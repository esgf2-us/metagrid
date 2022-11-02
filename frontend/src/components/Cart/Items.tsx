/* eslint-disable no-void */

import {
  CloudDownloadOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Col, Form, message, Modal, Row, Select, Switch } from 'antd';
import React from 'react';
import {
  fetchGlobusEndpoints,
  fetchWgetScript,
  openDownloadURL,
  ResponseError,
} from '../../api/index';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Empty from '../DataDisplay/Empty';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';
import {
  getDefaultGlobusEndpoint,
  isSignedIntoGlobus,
  loginWithGlobus,
  setDefaultGlobusEndpoint,
} from '../Globus/GlobusAuth';
import Table from '../Search/Table';
import { RawSearchResults } from '../Search/types';
import { ModalContext } from '../../contexts/ModalContext';
import ToolTip from '../DataDisplay/ToolTip';

const styles: CSSinJS = {
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    leftSide: {
      display: 'flex',
    },
  },
  image: { margin: '1em', width: '25%' },
};

export type Props = {
  userCart: RawSearchResults | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onClearCart: () => void;
};

const Items: React.FC<Props> = ({ userCart, onUpdateCart, onClearCart }) => {
  const [downloadForm] = Form.useForm();

  // Statically defined list of dataset download options
  const downloadOptions = ['Globus', 'wget'];
  const defaultGlobusEndpoint = getDefaultGlobusEndpoint();

  const signedIn = isSignedIntoGlobus();
  const [
    showLoginConfirmModal,
    setShowLoginConfirmModal,
  ] = React.useState<boolean>(false);

  const [useDefaultEndpoint, setUseDefaultEndpoint] = React.useState(
    defaultGlobusEndpoint !== null
  );
  const [downloadIsLoading, setDownloadIsLoading] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResults | []
  >([]);

  const { setEndpointModalVisible, setSearchResults } = React.useContext(
    ModalContext
  );

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    setSelectedItems(selectedRows);
  };

  const handleWgetDownload = (): void => {
    const ids = (selectedItems as RawSearchResults).map((item) => item.id);
    // eslint-disable-next-line no-void
    void message.success(
      'The wget script is generating, please wait momentarily.',
      10
    );
    setDownloadIsLoading(true);
    fetchWgetScript(ids)
      .then((url) => {
        openDownloadURL(url);
        setDownloadIsLoading(false);
      })
      .catch((error: ResponseError) => {
        // eslint-disable-next-line no-void
        void message.error(error.message);
        setDownloadIsLoading(false);
      });
  };

  const handleGlobusDownload = (): void => {
    if (selectedItems) {
      const ids = selectedItems.map((item) => item.id);

      // Open the endpoint selection modal if not using default
      if (!useDefaultEndpoint) {
        setSearchResults(selectedItems as RawSearchResults);
        setEndpointModalVisible(true);
        return;
      }

      fetchGlobusEndpoints('')
        .then((response) => {
          if (response.DATA && response.DATA.length > 0) {
            let defaultEndpoint = null;
            if (defaultGlobusEndpoint) {
              defaultEndpoint = response.DATA.find((rawEndpoint) => {
                return rawEndpoint.id === defaultGlobusEndpoint;
              });
              if (!defaultEndpoint) {
                void message.warning(
                  `Unable to find the selected default endpoint!`
                );
                setDefaultGlobusEndpoint('');
                setUseDefaultEndpoint(false);
              }
            }

            // If there's a default endpoint, no need to open selection
            if (defaultEndpoint) {
              void message.info(
                `Loading using default endpoint: ${defaultEndpoint.display_name}`
              );
              void message.info(`Downloading files: ${ids.toString()}`);
            } else {
              setSearchResults(selectedItems as RawSearchResults);
              setEndpointModalVisible(true);
            }
          }
        })
        .catch((error: ResponseError) => {
          void message.error(error.message);
        });
    }
  };

  const showLoginModal = (): void => {
    setShowLoginConfirmModal(true);
  };

  const hideLoginModal = (): void => {
    setShowLoginConfirmModal(false);
  };

  const logIntoGlobusConfirmed = (): void => {
    hideLoginModal();
    void message.info(`Redirecting you to log into Globus...`, 2);
    setTimeout(() => {
      loginWithGlobus();
    }, 2000);
  };

  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    /* istanbul ignore else */
    if (downloadType === 'wget') {
      handleWgetDownload();
    } else if (downloadType === 'Globus') {
      if (signedIn) {
        handleGlobusDownload();
      } else {
        showLoginModal();
      }
    }
  };

  return (
    <div data-testid="cartItems">
      {userCart.length === 0 && (
        <Empty description="Your cart is empty"></Empty>
      )}
      {userCart.length > 0 && (
        <>
          <div style={styles.summary}>
            {userCart.length > 0 && (
              <Popconfirm
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={onClearCart}
              >
                <span>
                  <Button
                    className={cartTourTargets.getClass('removeItemsBtn')}
                    danger
                  >
                    Remove All Items
                  </Button>
                </span>
              </Popconfirm>
            )}
          </div>
          <Row gutter={[24, 16]} justify="space-around">
            <Col lg={24}>
              <Table
                loading={false}
                canDisableRows={false}
                results={userCart}
                userCart={userCart}
                onUpdateCart={onUpdateCart}
                onRowSelect={handleRowSelect}
              />
            </Col>
          </Row>
          <div data-testid="downloadForm">
            <h1>
              <CloudDownloadOutlined /> Download Your Cart
            </h1>
            <p></p>
            <p>
              Select datasets in your cart and confirm your download preference.
              Speeds will vary based on your bandwidth and distance from the
              data node serving the files.
            </p>
            <Form
              form={downloadForm}
              layout="inline"
              onFinish={({ downloadType }) =>
                handleDownloadForm(downloadType as 'wget' | 'Globus')
              }
              initialValues={{
                downloadType: downloadOptions[0],
              }}
            >
              <Form.Item
                name="downloadType"
                className={cartTourTargets.getClass('downloadAllType')}
              >
                <Select style={{ width: 235 }}>
                  {downloadOptions.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                  /
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  className={cartTourTargets.getClass('downloadAllBtn')}
                  type="primary"
                  htmlType="submit"
                  icon={<DownloadOutlined />}
                  disabled={selectedItems.length === 0}
                  loading={downloadIsLoading}
                >
                  Download
                </Button>
                {signedIn &&
                  selectedItems.length !== 0 &&
                  defaultGlobusEndpoint && (
                    <>
                      {' '}
                      <ToolTip title="Uncheck if you want to select a specific endpoint">
                        <Switch
                          defaultChecked
                          checkedChildren="Default endpoint"
                          unCheckedChildren="Select an endpoint"
                          onChange={(checked) => {
                            setUseDefaultEndpoint(checked);
                          }}
                        />
                      </ToolTip>
                    </>
                  )}
              </Form.Item>
            </Form>
          </div>
        </>
      )}
      <Modal
        title="Modal"
        visible={showLoginConfirmModal}
        onOk={logIntoGlobusConfirmed}
        onCancel={hideLoginModal}
        okText="Login to Globus"
        cancelText="Cancel"
      >
        <p>
          You are not currently logged into Globus. Would you like to log in?
        </p>
      </Modal>
    </div>
  );
};

export default Items;
