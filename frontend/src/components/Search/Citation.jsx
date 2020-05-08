import React from 'react';
import PropTypes from 'prop-types';
import { useAsync } from 'react-async';

import Alert from '../Feedback/Alert';
import Spin from '../Feedback/Spin';

import { fetchCitation } from '../../utils/api';
import { parseUrl } from '../../utils/utils';

const CitationInfo = ({ title, children }) => {
  return (
    <p style={{ margin: 0 }}>
      <span style={{ fontWeight: 'bold' }}>{title}: </span>
      {children}
    </p>
  );
};

CitationInfo.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const Citation = ({ url }) => {
  const { data, error, isLoading } = useAsync({
    promiseFn: fetchCitation,
    url,
  });

  return (
    <div>
      <div>
        <a
          href={parseUrl(url, '.json')}
          rel="noopener noreferrer"
          target="_blank"
        >
          Data Citation Page
        </a>
      </div>

      {isLoading && <Spin></Spin>}
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

Citation.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Citation;
