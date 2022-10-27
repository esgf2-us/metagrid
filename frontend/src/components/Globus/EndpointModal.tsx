/* eslint-disable no-void */

import { message, Modal, Select } from 'antd';
import React, { useEffect } from 'react';
import { fetchGlobusEndpoints, ResponseError } from '../../api';
import { RawSearchResults } from '../Search/types';
import { RawEndpoint, RawEndpointList } from './types';

export type Props = {
  visible: boolean;
  onClose: () => void;
  searchResults: RawSearchResults | null;
};

const { Option } = Select;

const EndpointModal: React.FC<Props> = ({
  visible,
  onClose,
  searchResults,
}) => {
  const [filesToDownload, setFilesToDownloade] = React.useState<string[]>([]);
  const [endpoints, setEndpoints] = React.useState<RawEndpointList | null>(
    null
  );
  const [
    selectedEndpoint,
    setSelectedEndpoint,
  ] = React.useState<RawEndpoint | null>(null);

  const handleSelectionChanged = (endpointId: string): void => {
    console.log(`selected endpoint id: ${endpointId}`);

    if (endpoints && endpoints.DATA.length > 0) {
      const endpoint = endpoints.DATA.find((rawEndpoint) => {
        if (rawEndpoint.id === endpointId) {
          return rawEndpoint;
        }
        return selectedEndpoint;
      });
      if (endpoint) {
        setSelectedEndpoint(endpoint);
      }
    }
  };
  const handleEndpointDownload = (): void => {
    if (selectedEndpoint) {
      void message.info(
        `Loading selected endpoint: ${selectedEndpoint.display_name}`
      );
      void message.info(`Downloading files: ${filesToDownload.toString()}`);
    }
    onClose();
  };

  useEffect(() => {
    let ids = null;
    if (searchResults) {
      ids = searchResults.map((item) => item.id);
      setFilesToDownloade(ids);

      fetchGlobusEndpoints('')
        .then((response) => {
          setEndpoints(response);
          if (response.DATA.length > 0) {
            const firstEndpoint = response.DATA.at(0);
            if (firstEndpoint) {
              setSelectedEndpoint(firstEndpoint);
            }
          }
        })
        .catch((error: ResponseError) => {
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
        okText="Download"
        onOk={handleEndpointDownload}
        cancelText="Cancel"
        onCancel={() => {
          onClose();
        }}
      >
        <>
          <p>Select the endpoint you&apos;d like to reach:</p>
          {endpoints && (
            <Select
              defaultValue={endpoints.DATA.at(0)?.display_name}
              onChange={handleSelectionChanged}
              style={{ width: 120 }}
            >
              {endpoints.DATA.map((endpoint) => {
                return (
                  <Option key={endpoint.id} value={endpoint.id}>
                    {endpoint.display_name}
                  </Option>
                );
              })}
            </Select>
          )}
        </>
      </Modal>
    </div>
  );
};

export default EndpointModal;
