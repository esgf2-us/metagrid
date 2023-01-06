/* eslint-disable no-void */

import {
  CheckCircleFilled,
  CloudDownloadOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Col, Form, message, Modal, Radio, Row, Select, Space } from 'antd';
import React, { useEffect } from 'react';
import {
  fetchWgetScript,
  openDownloadURL,
  ResponseError,
  startGlobusTransfer,
} from '../../api/index';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Empty from '../DataDisplay/Empty';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';
import {
  getDefaultGlobusEndpoint,
  getGlobusRefreshToken,
  getGlobusTransferToken,
  GlobusEndpointData,
  isSignedIntoGlobus,
  loginWithGlobus,
  processGlobusParams,
  redirectToSelectGlobusEndpoint,
  setDefaultGlobusEndpoint,
} from '../Globus/GlobusAuth';
import Table from '../Search/Table';
import { RawSearchResults } from '../Search/types';
import {
  getDataFromLocal,
  removeFromLocal,
  saveDataToLocal,
} from '../../common/utils';

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

type ModalState = {
  onCancelAction: () => void;
  onOkAction: () => void;
  show: boolean;
  state: 'signin' | 'endpoint' | 'both' | 'none';
};

const Items: React.FC<Props> = ({ userCart, onUpdateCart, onClearCart }) => {
  const [downloadForm] = Form.useForm();

  // Statically defined list of dataset download options
  const downloadOptions = ['Globus', 'wget'];

  // The selected endpoint
  const [
    selectedEndpoint,
    setSelectedEndpoint,
  ] = React.useState<GlobusEndpointData | null>(null);

  // Default endpoint exists
  const defaultGlobusEndpoint: GlobusEndpointData | null = getDefaultGlobusEndpoint();

  // User wants to select their endpoint
  const [useDefaultEndpoint, setUseDefaultEndpoint] = React.useState<boolean>(
    false
  );

  const [
    showDefaultConfirmModal,
    setShowDefaultConfirmModal,
  ] = React.useState<boolean>(false);

  const [downloadIsLoading, setDownloadIsLoading] = React.useState(false);

  const [globusStepsModal, setGlobusStepsModal] = React.useState<ModalState>({
    show: false,
    state: 'both',
    onOkAction: () => {
      setGlobusStepsModal({ ...globusStepsModal, show: false });
    },
    onCancelAction: () => {
      setDownloadIsLoading(false);
      saveDataToLocal('continueGlobusPrepSteps', false);
      removeFromLocal('userSelectedEndpoint');
      setGlobusStepsModal({ ...globusStepsModal, show: false });
    },
  });

  const savedSelections =
    getDataFromLocal<RawSearchResults>('savedItemSelections') || [];

  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResults | []
  >(savedSelections);

  const saveSelectionStateBeforeRedirect = (): void => {
    if (selectedItems && selectedItems.length > 0) {
      saveDataToLocal('savedItemSelections', selectedItems);
    }
  };

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

  const handleGlobusDownload = (endpoint: GlobusEndpointData | null): void => {
    saveDataToLocal('continueGlobusPrepSteps', false);

    if (!endpoint) {
      void message.warning(`Globus endpoint was undefined.`);
      return;
    }

    let selections = [...selectedItems];

    if (selections.length < 1) {
      const savedItems =
        getDataFromLocal<RawSearchResults>('savedItemSelections') || [];
      selections = [...savedItems];
    }

    if (selections && selections.length > 0) {
      const ids = (selections as RawSearchResults).map((item) => item.id);

      const globusTransferToken = getGlobusTransferToken();
      const globusRefreshToken = getGlobusRefreshToken();

      if (globusTransferToken && globusRefreshToken) {
        startGlobusTransfer(
          globusTransferToken.access_token,
          globusRefreshToken,
          endpoint?.endpointId || '',
          endpoint?.path || '',
          ids
        )
          .then((resp) => {
            if (resp.status === 200) {
              void message.info(`Globus transfer task submitted successfully!`);
            } else {
              void message.warning(
                `Globus transfer task struggled: ${resp.statusText}`
              );
            }
          })
          .catch((error: ResponseError) => {
            void message.error(`Globus transfer task failed: ${error.message}`);
            void message.error(ids);
          })
          .finally(() => {
            removeFromLocal('userSelectedEndpoint');
            setDownloadIsLoading(false);
          });
      }
    } else {
      removeFromLocal('userSelectedEndpoint');
      setDownloadIsLoading(false);

      // Should logout to refresh Globus state
      removeFromLocal('globus_access_token');
      removeFromLocal('globus_refresh_token');
      removeFromLocal('globus_transfer_token');
      removeFromLocal('globus_id_token');
    }
  };

  const showGlobusDownloadPrompt = (
    endpoint: GlobusEndpointData | null
  ): void => {
    setGlobusStepsModal({
      ...globusStepsModal,
      onOkAction: () => {
        setGlobusStepsModal({ ...globusStepsModal, show: false });
        setDownloadIsLoading(true);
        handleGlobusDownload(endpoint);
      },
      show: true,
      state: 'none',
    });
  };

  const prepareForGlobusDownload = (): void => {
    /**
     * What to do when user selects data to download via globus in the cart
     * State 0: User needs globus auth token, user also needs and endpoint.
     * State 1: User has an endpoint but needs globus auth.
     * State 2: User has globus auth but needs to select endpoint.
     * State 3: User has globus auth and endpoint.
     */

    // User has Globus permissions
    const globusReady = isSignedIntoGlobus();

    const savedEndpoint = getDataFromLocal<GlobusEndpointData | null>(
      'userSelectedEndpoint'
    );
    setSelectedEndpoint(savedEndpoint);
    const endpointReady = useDefaultEndpoint || savedEndpoint;

    saveSelectionStateBeforeRedirect(); // Save selected cart items
    saveDataToLocal('continueGlobusPrepSteps', true);

    if (globusReady && endpointReady) {
      if (useDefaultEndpoint) {
        showGlobusDownloadPrompt(defaultGlobusEndpoint);
      } else {
        setShowDefaultConfirmModal(true);
      }
    } else if (globusReady) {
      // Endpoint is missing, so get endpoint then continue prep
      setGlobusStepsModal({
        ...globusStepsModal,
        onOkAction: () => {
          redirectToSelectGlobusEndpoint();
        },
        show: true,
        state: 'endpoint',
      });
    } else if (endpointReady) {
      setGlobusStepsModal({
        ...globusStepsModal,
        onOkAction: () => {
          loginWithGlobus();
        },
        show: true,
        state: 'signin',
      });
    } else {
      setGlobusStepsModal({
        ...globusStepsModal,
        onOkAction: () => {
          loginWithGlobus();
        },
        show: true,
        state: 'both',
      });
    }
  };

  // Do next preparation step if prep steps is true
  useEffect(() => {
    if (getDataFromLocal<boolean>('continueGlobusPrepSteps') === true) {
      setTimeout(async () => {
        await processGlobusParams();
        prepareForGlobusDownload();
      }, 1000);
    }
  }, []);

  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    /* istanbul ignore else */
    if (downloadType === 'wget') {
      handleWgetDownload();
    } else if (downloadType === 'Globus') {
      prepareForGlobusDownload();
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
              </Form.Item>
              {defaultGlobusEndpoint && selectedItems.length !== 0 && (
                <Form.Item>
                  <Radio.Group
                    onChange={(e) => {
                      setUseDefaultEndpoint(e.target.value as boolean);
                    }}
                    value={useDefaultEndpoint}
                  >
                    <Space direction="vertical">
                      <Radio value defaultChecked>
                        Default Endpoint
                      </Radio>
                      <Radio value={false}>Specify Endpoint</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              )}
            </Form>
          </div>
        </>
      )}
      <Modal
        title="Save Endpoint"
        visible={showDefaultConfirmModal}
        onOk={() => {
          if (selectedEndpoint) {
            setDefaultGlobusEndpoint(selectedEndpoint);
            showGlobusDownloadPrompt(selectedEndpoint);
          }
          setShowDefaultConfirmModal(false);
        }}
        onCancel={() => {
          setShowDefaultConfirmModal(false);
          showGlobusDownloadPrompt(selectedEndpoint);
        }}
        okText="Yes"
        cancelText="No"
      >
        <p>Do you want to save this endpoint as default?</p>
      </Modal>
      <Modal
        title="Globus Transfer"
        visible={globusStepsModal.show}
        onOk={globusStepsModal.onOkAction}
        onCancel={globusStepsModal.onCancelAction}
        okText="Yes"
        cancelText="Cancel"
      >
        <p>Steps for Globus transfer:</p>
        <ol>
          <li>
            {(globusStepsModal.state === 'both' ||
              globusStepsModal.state === 'signin') &&
              '-> '}
            Redirect to obtain transfer permission from Globus.
            {(globusStepsModal.state === 'none' ||
              globusStepsModal.state === 'endpoint') && <CheckCircleFilled />}
          </li>
          <li>
            {globusStepsModal.state === 'endpoint' && '-> '}
            Redirect to select an endpoint in Globus.
            {(globusStepsModal.state === 'none' ||
              globusStepsModal.state === 'signin') && <CheckCircleFilled />}
          </li>

          <li>
            {globusStepsModal.state === 'none' && '-> '} Start Globus transfer.
          </li>
        </ol>
        <p>Do you wish to proceed?</p>
      </Modal>
    </div>
  );
};

export default Items;
