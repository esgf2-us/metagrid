import React from 'react';
import { PromiseFn, useAsync } from 'react-async';
import { fetchDatasetCitation } from '../../api';
import { splitStringByChar } from '../../common/utils';
import Alert from '../Feedback/Alert';
import Skeleton from '../Feedback/Skeleton';
import { RawCitation } from './types';

type CitationInfoProps = {
  title: string;
  children: React.ReactNode;
};

export const CitationInfo: React.FC<CitationInfoProps> = ({
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

const Citation: React.FC<CitationProps> = ({ url }) => {
  const { data, error, isLoading } = useAsync({
    promiseFn: (fetchDatasetCitation as unknown) as PromiseFn<RawCitation>,
    url,
  });

  return (
    <div>
      <div>
        <a
          href={splitStringByChar(url, '.json', '0') as string}
          rel="noopener noreferrer"
          target="_blank"
        >
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
          <CitationInfo title="Identifier DOI">
            <a
              href={data.identifierDOI}
              rel="noopener noreferrer"
              target="_blank"
            >
              {data.identifierDOI}
            </a>
          </CitationInfo>
          <CitationInfo title="Creators">{data.creatorsList}</CitationInfo>
          <CitationInfo title="Titles">{data.titles}</CitationInfo>
          <CitationInfo title="Publisher">{data.publisher}</CitationInfo>
          <CitationInfo title="Publication Year">
            {data.publicationYear}
          </CitationInfo>
        </div>
      )}
    </div>
  );
};

export default Citation;
