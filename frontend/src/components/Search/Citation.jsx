import React from 'react';
import PropTypes from 'prop-types';
import { useAsync } from 'react-async';

import Spin from '../Feedback/Spin';
import Button from '../General/Button';

import { isEmpty } from '../../utils/utils';
import { fetchCitation } from '../../utils/api';

const Citation = ({ url }) => {
  const { data, error, isLoading, run } = useAsync({
    deferFn: fetchCitation,
  });

  React.useEffect(() => {
    run(url);
  }, [run, url]);

  return (
    <div>
      {isLoading && <Spin></Spin>}

      <Button type="link" href={url} target="_blank">
        Data Citation Page
      </Button>

      {!isEmpty(data) && !error && JSON.stringify(data.results)}
    </div>
  );
};

Citation.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Citation;
