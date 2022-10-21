import { message } from 'antd';
import React, { useEffect } from 'react';
import { fetchGlobusEndpoints, ResponseError } from '../../api';
import Modal from '../Feedback/Modal';
import { RawSearchResults } from '../Search/types';
import { RawEndpointList } from './types';

export type Props = {
  visible: boolean;
  onClose: () => void;
  searchResults: RawSearchResults | null;
};

const EndpointModal: React.FC<Props> = ({
  visible,
  onClose,
  searchResults,
}) => {
  const [endpoints, setEndpoints] = React.useState<RawEndpointList | null>(
    null
  );

  useEffect(() => {
    let ids = null;
    if (searchResults) {
      ids = searchResults.map((item) => item.id);

      // eslint-disable-next-line no-void
      void message.info('Loading endpoints list...');

      fetchGlobusEndpoints('')
        .then((response) => {
          // eslint-disable-next-line no-void
          void message.success('Finished!');
          setEndpoints(response);
        })
        .catch((error: ResponseError) => {
          // eslint-disable-next-line no-void
          void message.error(error.message);
        });
    }
  }, [searchResults]);

  return (
    <div data-testid="globus-endpoint-form">
      <Modal
        visible={visible}
        title={
          <div>
            <h2>Globus Endpoint Selection</h2>
          </div>
        }
        onClose={() => {
          onClose();
          // eslint-disable-next-line no-void
          void message.success('The globus download has been initiated...', 3);
        }}
        centered
      >
        <p>Select the endpoint you&apos;d like to have.</p>
        <ul>
          {endpoints?.DATA.map((endpoint) => {
            return <li key={endpoint.id}>{endpoint.display_name}</li>;
          })}
        </ul>
      </Modal>
    </div>
  );
};

export default EndpointModal;
