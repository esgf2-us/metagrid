/* eslint-disable no-void */

import { AutoComplete, Checkbox, Col, message, Modal, Row } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import React, { useEffect } from 'react';
import { fetchGlobusEndpoints, ResponseError } from '../../api';
import { RawSearchResults } from '../Search/types';
import { setDefaultGlobusEndpoint } from './GlobusAuth';
import { RawEndpoint } from './types';

export type Props = {
  visible: boolean;
  onClose: () => void;
  searchResults: RawSearchResults | null;
};

const { Option } = AutoComplete;

const EndpointModal: React.FC<Props> = ({
  visible,
  onClose,
  searchResults,
}) => {
  const [filesToDownload, setFilesToDownloade] = React.useState<string[]>([]);
  const [endpoints, setEndpoints] = React.useState<RawEndpoint[]>([]);
  const [listedEndpoints, setListedEndpoints] = React.useState<RawEndpoint[]>(
    []
  );
  const [value, setValue] = React.useState<string>();
  const [defaultChecked, setDefaultChecked] = React.useState<boolean>(false);

  const [
    selectedEndpoint,
    setSelectedEndpoint,
  ] = React.useState<RawEndpoint | null>(null);

  useEffect(() => {
    let ids = null;
    if (searchResults) {
      ids = searchResults.map((item) => item.id);
      setFilesToDownloade(ids);

      fetchGlobusEndpoints('')
        .then((response) => {
          setEndpoints(response.DATA);
          /* if (response.DATA.length > 0) {
            const firstEndpoint = response.DATA.at(0);
            if (firstEndpoint) {
              setSelectedEndpoint(firstEndpoint);
            }
          }*/
        })
        .catch((error: ResponseError) => {
          void message.error(error.message);
        });
    }
  }, [searchResults]);

  const resetEndpointModal = (): void => {
    onClose();
    setSelectedEndpoint(null);
    setListedEndpoints(endpoints);
    setValue('');
  };

  const handleOnSelect = (endpointName: string): void => {
    if (endpoints && endpoints.length > 0) {
      const endpoint = endpoints.find((rawEndpoint) => {
        if (rawEndpoint.display_name === endpointName) {
          return rawEndpoint;
        }
        return null;
      });
      if (endpoint) {
        setSelectedEndpoint(endpoint);

        console.log(`selected endpoint id: ${endpoint.id}`);
        console.log(`selected endpoint name: ${endpoint.display_name}`);
      } else {
        console.log('No endpoint was selected');
      }
    }
  };

  const handleOnSearch = (searchText: string): void => {
    setSelectedEndpoint(null);
    if (searchText && endpoints && endpoints.length > 0) {
      const newEndpointList = endpoints.filter((rawEndpoint) => {
        if (rawEndpoint.display_name.includes(searchText)) {
          return rawEndpoint;
        }
        return null;
      });
      setListedEndpoints(newEndpointList);
    } else if (endpoints) {
      setListedEndpoints(endpoints);
    }
  };

  const handleOnChange = (newInput: string): void => {
    setValue(newInput);
  };

  const handleDownloadClicked = (): void => {
    if (selectedEndpoint) {
      void message.info(
        `Loading selected endpoint: ${selectedEndpoint.display_name}`
      );
      void message.info(`Downloading files: ${filesToDownload.toString()}`);
      if (defaultChecked) {
        setDefaultGlobusEndpoint(selectedEndpoint.id);
        void message.info(
          `Default endpoint set to: ${selectedEndpoint.display_name}`
        );
      }
    }
    resetEndpointModal();
  };

  const handleCancelClicked = (): void => {
    resetEndpointModal();
  };

  const onCheckboxChange = (e: CheckboxChangeEvent): void => {
    setDefaultChecked(e.target.checked);
  };

  return (
    <div data-testid="globus-endpoint-form">
      <Modal
        visible={visible && endpoints.length > 0}
        title={
          <div>
            <h2>Globus Endpoint Selection</h2>
          </div>
        }
        okText="Download"
        onOk={handleDownloadClicked}
        okButtonProps={{ disabled: selectedEndpoint === null }}
        cancelText="Cancel"
        onCancel={handleCancelClicked}
      >
        <>
          <h3>Select the endpoint to use:</h3>
          <Row>
            <Col flex="200px">
              <AutoComplete
                // defaultValue={endpoints.DATA.at(0)?.display_name}
                value={value}
                onChange={handleOnChange}
                onSearch={handleOnSearch}
                onSelect={handleOnSelect}
                style={{ width: 180 }}
              >
                {listedEndpoints.map((endpoint) => {
                  return (
                    <Option key={endpoint.id} value={endpoint.display_name}>
                      {endpoint.display_name}
                    </Option>
                  );
                })}
              </AutoComplete>
            </Col>
            <Col flex="100px">
              <h4 style={{ float: 'right', marginRight: '10px' }}>
                Organization:
              </h4>
            </Col>
            <Col flex={3}>
              <p>{selectedEndpoint ? selectedEndpoint.organization : ''}</p>
            </Col>
          </Row>
          <Row>
            <Col flex="200px">
              <Checkbox checked={defaultChecked} onChange={onCheckboxChange}>
                Set endpoint as default
              </Checkbox>
            </Col>
            <Col flex="100px">
              <h4 style={{ float: 'right', marginRight: '10px' }}>
                User Name:
              </h4>
            </Col>
            <Col flex={3}>
              <p>{selectedEndpoint ? selectedEndpoint.username : ''}</p>
            </Col>
          </Row>
          <Row>
            <Col flex="200px"></Col>
            <Col flex="100px">
              <h4 style={{ float: 'right', marginRight: '10px' }}>
                Description
              </h4>
            </Col>
          </Row>
          <Row>
            <Col flex="200px"></Col>
            <Col flex="auto">
              <p>{selectedEndpoint ? selectedEndpoint.description : ''}</p>
            </Col>
          </Row>
        </>
      </Modal>
    </div>
  );
};

export default EndpointModal;
