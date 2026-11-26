import React from 'react';
import { Alert, Skeleton } from 'antd';
import { PromiseFn, useAsync } from 'react-async';
import { fetchDatasetCitation } from '../../api';
import { splitStringByChar } from '../../common/utils';
import { RawCitation } from './types';

type CitationInfoProps = {
  title: string;
  children: React.ReactNode;
};

export const CitationInfo: React.FC<React.PropsWithChildren<CitationInfoProps>> = ({
  title,
  children,
}) => (
  <p style={{ margin: 0 }}>
    <span style={{ fontWeight: 'bold' }}>{title}: </span>
    {children}
  </p>
);

type CitationProps = {
  url: string;
};

/**
 * Removes the httpAccept parameter from a URL if present
 */
const removeHttpAcceptParam = (url: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('httpAccept');
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return the original URL
    return url;
  }
};

const Citation: React.FC<React.PropsWithChildren<CitationProps>> = ({ url }) => {
  const { data, error, isLoading } = useAsync({
    promiseFn: fetchDatasetCitation as unknown as PromiseFn<RawCitation>,
    url,
  });

  // Remove .json extension and httpAccept parameter for the display link
  const displayUrl = removeHttpAcceptParam(splitStringByChar(url, '.json', '0') as string);

  return (
    <div>
      <div>
        <a href={displayUrl} rel="noopener noreferrer" target="_blank">
          Data Citation Page
        </a>
      </div>
      {isLoading && <Skeleton active />}
      {error && (
        <Alert
          message="Error"
          description="There was an issue fetching citation information. Please contact support for assistance or try again later."
          type="error"
          showIcon
        />
      )}
      {data && (
        <div>
          {data.identifierDOI && (
            <CitationInfo title="Identifier DOI">
              <a href={data.identifierDOI} rel="noopener noreferrer" target="_blank">
                {data.identifierDOI}
              </a>
            </CitationInfo>
          )}
          {data.creatorsList && <CitationInfo title="Creators">{data.creatorsList}</CitationInfo>}
          {data.titles && <CitationInfo title="Titles">{data.titles}</CitationInfo>}
          {data.publisher && <CitationInfo title="Publisher">{data.publisher}</CitationInfo>}
          {data.publicationYear > 0 && (
            <CitationInfo title="Publication Year">{data.publicationYear}</CitationInfo>
          )}
          {data.license && <CitationInfo title="License">{data.license}</CitationInfo>}
        </div>
      )}
    </div>
  );
};

export default Citation;
