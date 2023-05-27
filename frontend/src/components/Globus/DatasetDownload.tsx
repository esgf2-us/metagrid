import { CheckCircleFilled, DownloadOutlined } from '@ant-design/icons';
import { Button, Form, message, Modal, Radio, Select, Space } from 'antd';
import PKCE from 'js-pkce';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
  saveSessionValue,
  loadSessionValue,
  fetchWgetScript,
  openDownloadURL,
  ResponseError,
  startGlobusTransfer,
} from '../../api';
import {
  GlobusStateValue,
  GlobusEndpointData,
  GlobusTokenResponse,
} from '../../common/types';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { globusClientID, globusRedirectUrl } from '../../env';
import { RawSearchResults } from '../Search/types';
import CartStateKeys, {
  cartItemSelections,
  cartDownloadIsLoading,
} from '../Cart/recoil/atoms';
import GlobusStateKeys, {
  globusUseDefaultEndpoint,
  globusDefaultEndpoint,
} from './recoil/atom';

// Reference: https://github.com/bpedroza/js-pkce
const GlobusAuth = new PKCE({
  client_id: globusClientID, // Update this using your native client ID
  redirect_uri: globusRedirectUrl, // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes:
    'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all', // Update with any scopes you would need, e.g. transfer
});

type ModalFormState = 'signin' | 'endpoint' | 'both' | 'none';

type ModalState = {
  onCancelAction: () => void;
  onOkAction: () => void;
  show: boolean;
  state: ModalFormState;
};

// Statically defined list of dataset download options
const downloadOptions = ['Globus', 'wget'];

const DatasetDownloadForm: React.FC = () => {
  const [downloadForm] = Form.useForm();

  // User wants to use default endpoint
  const [
    useGlobusDefaultEndpoint,
    setUseGlobusDefaultEndpoint,
  ] = useRecoilState<boolean>(globusUseDefaultEndpoint);

  const [
    defaultGlobusEndpoint,
    setDefaultGlobusEndpoint,
  ] = useRecoilState<GlobusStateValue>(globusDefaultEndpoint);

  const [itemSelections, setItemSelections] = useRecoilState<RawSearchResults>(
    cartItemSelections
  );

  const [downloadIsLoading, setDownloadIsLoading] = useRecoilState<boolean>(
    cartDownloadIsLoading
  );

  // Component internal state
  const [globusStepsModal, setGlobusStepsModal] = React.useState<ModalState>({
    show: false,
    state: 'both',
    onOkAction: () => {
      setGlobusStepsModal({ ...globusStepsModal, show: false });
    },
    onCancelAction: async () => {
      setGlobusStepsModal({ ...globusStepsModal, show: false });
      await endDownloadSteps();
    },
  });
  const [
    useDefaultConfirmModal,
    setUseDefaultConfirmModal,
  ] = React.useState<ModalState>({
    show: false,
    state: 'none',
    onOkAction: () => {
      setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
    },
    onCancelAction: () => {
      setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
    },
  });

  function redirectToNewURL(newUrl: string): void {
    setTimeout(() => {
      window.location.replace(newUrl);
    }, 200);
  }

  function redirectToRootUrl(): void {
    // Redirect back to the root URL (simple but brittle way to clear the query params)
    const splitUrl = window.location.href.split('?');
    if (splitUrl.length > 1) {
      const params = new URLSearchParams(window.location.search);
      if (endpointUrlReady(params) || tokenUrlReady(params)) {
        const newUrl = splitUrl[0];
        redirectToNewURL(newUrl);
      }
    }
  }

  async function getGlobusTransferToken(): Promise<GlobusTokenResponse | null> {
    const token = await loadSessionValue<GlobusTokenResponse>(
      GlobusStateKeys.transferToken
    );
    if (token && token.expires_in && token.created_on) {
      const createTime = token.created_on;
      const lifeTime = token.expires_in;
      const expires = createTime + lifeTime;
      const curTime = Math.floor(Date.now() / 1000);

      if (curTime <= expires) {
        return token;
      }
      return null;
    }
    return null;
  }

  async function getGlobusTokens(): Promise<
    [GlobusTokenResponse | null, string | null]
  > {
    const refreshToken = await loadSessionValue<string>(
      GlobusStateKeys.refreshToken
    );
    const transferToken = await getGlobusTransferToken();
    return [transferToken, refreshToken];
  }

  async function getEndpointData(): Promise<
    [boolean | null, GlobusEndpointData | null, GlobusEndpointData | null]
  > {
    const useDefault = await loadSessionValue<boolean>(
      GlobusStateKeys.useDefaultEndpoint
    );
    const defaultEndpoint = await loadSessionValue<GlobusEndpointData>(
      GlobusStateKeys.defaultEndpoint
    );
    const selectedEndpoint = await loadSessionValue<GlobusEndpointData>(
      GlobusStateKeys.userSelectedEndpoint
    );

    return [useDefault, defaultEndpoint, selectedEndpoint];
  }

  const handleWgetDownload = (): void => {
    if (itemSelections !== null) {
      const ids = itemSelections.map((item) => item.id);
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
    }
  };

  const handleGlobusDownload = async (
    globusTransferToken: GlobusTokenResponse | null,
    refreshToken: string | null,
    endpoint: GlobusEndpointData | null
  ): Promise<void> => {
    if (!endpoint) {
      message.warning(`Globus endpoint was undefined.`);
      return;
    }

    setDownloadIsLoading(true);
    const loadedSelections = await loadSessionValue<RawSearchResults>(
      CartStateKeys.cartItemSelections
    );
    if (loadedSelections && loadedSelections.length > 0) {
      setItemSelections(loadedSelections);
      const ids = loadedSelections.map((item) => (item ? item.id : ''));

      if (globusTransferToken && refreshToken) {
        startGlobusTransfer(
          globusTransferToken.access_token,
          refreshToken,
          endpoint?.endpointId || '',
          endpoint?.path || '',
          ids
        )
          .then((resp) => {
            if (resp.status === 200) {
              message.info(`Globus transfer task submitted successfully!`);
              saveSessionValue(CartStateKeys.cartItemSelections, []);
            } else {
              message.warning(
                `Globus transfer task struggled: ${resp.statusText}`
              );
            }
          })
          .catch((error: ResponseError) => {
            message.error(`Globus transfer task failed: ${error.message}`);
          })
          .finally(async () => {
            await endDownloadSteps();
          });
      }
    } else {
      await endDownloadSteps();
    }
  };

  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    /* istanbul ignore else */
    if (downloadType === 'wget') {
      handleWgetDownload();
    } else if (downloadType === 'Globus') {
      const prepareDownload = async (): Promise<void> => {
        await performGlobusDownloadStep();
      };
      prepareDownload();
    }
  };

  const showGlobusSigninPrompt = (formState: ModalFormState): void => {
    setGlobusStepsModal({
      ...globusStepsModal,
      onOkAction: async () => {
        setGlobusStepsModal({ ...globusStepsModal, show: false });
        await loginWithGlobus();
      },
      show: true,
      state: formState,
    });
  };

  const showGlobusEndpointPrompt = (): void => {
    setGlobusStepsModal({
      ...globusStepsModal,
      onOkAction: async () => {
        setGlobusStepsModal({ ...globusStepsModal, show: false });
        await redirectToSelectGlobusEndpoint();
      },
      show: true,
      state: 'endpoint',
    });
  };

  const showGlobusDownloadPrompt = (
    transferToken: GlobusTokenResponse | null,
    refreshToken: string | null,
    endpoint: GlobusEndpointData | null
  ): void => {
    setGlobusStepsModal({
      ...globusStepsModal,
      onOkAction: () => {
        setGlobusStepsModal({ ...globusStepsModal, show: false });
        handleGlobusDownload(transferToken, refreshToken, endpoint);
      },
      show: true,
      state: 'none',
    });
  };

  function tokensReady(
    refreshToken: string | null,
    globusTransferToken: GlobusTokenResponse | null
  ): boolean {
    if (refreshToken && globusTransferToken) {
      return true;
    }
    return false;
  }

  function endpointIsReady(
    useDefault: boolean | null,
    defaultEndpoint: GlobusEndpointData | null,
    userEndpoint: GlobusEndpointData | null
  ): boolean {
    if (useDefault !== null) {
      if ((useDefault && defaultEndpoint) || userEndpoint) {
        return true;
      }
    }
    // Check the UI state as backup if state wasn't saved
    if ((useGlobusDefaultEndpoint && defaultEndpoint) || userEndpoint) {
      return true;
    }

    return false;
  }

  function endpointUrlReady(params: URLSearchParams): boolean {
    return params.has('endpoint');
  }

  function tokenUrlReady(params: URLSearchParams): boolean {
    return params.has('code') && params.has('state');
  }

  async function getUrlTokens(): Promise<void> {
    const url = window.location.href;
    try {
      const tokenResponse = (await GlobusAuth.exchangeForAccessToken(
        url
      )) as GlobusTokenResponse;

      if (tokenResponse) {
        if (tokenResponse.refresh_token) {
          await saveSessionValue(
            GlobusStateKeys.refreshToken,
            tokenResponse.refresh_token
          );
        } else {
          await saveSessionValue(GlobusStateKeys.refreshToken, null);
        }

        // Try to find and get the transfer token
        if (tokenResponse.other_tokens) {
          const otherTokens: GlobusTokenResponse[] = [
            ...(tokenResponse.other_tokens as GlobusTokenResponse[]),
          ];
          otherTokens.forEach(async (tokenBlob) => {
            if (
              tokenBlob.resource_server &&
              tokenBlob.resource_server === 'transfer.api.globus.org'
            ) {
              const newTransferToken = { ...tokenBlob };
              newTransferToken.created_on = Math.floor(Date.now() / 1000);
              await saveSessionValue(
                GlobusStateKeys.transferToken,
                newTransferToken
              );
            }
          });
        } else {
          await saveSessionValue(GlobusStateKeys.transferToken, null);
        }
      }
    } catch (error: unknown) {
      message.error('Error occured when obtaining transfer permissions.');
    } finally {
      // This isn't strictly necessary but it ensures no code reuse.
      sessionStorage.removeItem('pkce_code_verifier');
      sessionStorage.removeItem('pkce_state');
    }
  }

  async function getUrlEndpoint(
    params: URLSearchParams
  ): Promise<GlobusEndpointData> {
    // The url has endpoint information, so process it
    const endpoint = params.get('endpoint');
    const label = params.get('label');
    const path = params.get('path');
    const globfs = params.get('globfs');
    const endpointId = params.get('endpoint_id');

    const endpointInfo: GlobusEndpointData = {
      endpoint,
      label,
      path,
      globfs,
      endpointId,
    };
    await saveSessionValue(GlobusStateKeys.userSelectedEndpoint, endpointInfo);
    return endpointInfo;
  }

  async function saveEndpointAsDefault(
    userEndpoint: GlobusStateValue
  ): Promise<void> {
    if (userEndpoint) {
      setDefaultGlobusEndpoint(userEndpoint);
      await saveSessionValue(GlobusStateKeys.defaultEndpoint, userEndpoint);
    }
  }

  async function redirectToSelectGlobusEndpoint(): Promise<void> {
    await saveSessionValue(GlobusStateKeys.continueGlobusPrepSteps, true);
    const endpointSearchURL = `https://app.globus.org/file-manager?action=${globusRedirectUrl}&method=GET&cancelUrl=${globusRedirectUrl}`;
    redirectToNewURL(endpointSearchURL);
  }

  async function loginWithGlobus(): Promise<void> {
    await saveSessionValue(GlobusStateKeys.continueGlobusPrepSteps, true);
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
    const authUrl: string = GlobusAuth.authorizeUrl();
    redirectToNewURL(authUrl);
  }

  async function endDownloadSteps(): Promise<void> {
    setDownloadIsLoading(false);
    await saveSessionValue(GlobusStateKeys.userSelectedEndpoint, null);
    await saveSessionValue(GlobusStateKeys.continueGlobusPrepSteps, false);
    redirectToRootUrl();
  }

  async function performGlobusDownloadStep(): Promise<void> {
    const [transferToken, refreshToken] = await getGlobusTokens();
    const [
      useDefaultEndpoint,
      defaultEndpoint,
      userSelectedEndpoint,
    ] = await getEndpointData();
    const tReady = tokensReady(refreshToken, transferToken);
    const eReady = endpointIsReady(
      useDefaultEndpoint,
      defaultEndpoint,
      userSelectedEndpoint
    );
    const urlParams = new URLSearchParams(window.location.search);
    const tUrlReady = tokenUrlReady(urlParams);
    const eUrlReady = endpointUrlReady(urlParams);

    if (tReady && eReady) {
      setDownloadIsLoading(true);
      if (useDefaultEndpoint) {
        handleGlobusDownload(transferToken, refreshToken, defaultEndpoint);
      } else {
        handleGlobusDownload(transferToken, refreshToken, userSelectedEndpoint);
      }
    } else if (tReady) {
      if (endpointUrlReady(urlParams)) {
        const userEndpoint = await getUrlEndpoint(urlParams);
        setUseDefaultConfirmModal({
          ...useDefaultConfirmModal,
          onOkAction: async () => {
            await saveEndpointAsDefault(userEndpoint);
            setUseDefaultConfirmModal({
              ...useDefaultConfirmModal,
              show: false,
            });
            showGlobusDownloadPrompt(transferToken, refreshToken, userEndpoint);
          },
          onCancelAction: (): void => {
            setUseDefaultConfirmModal({
              ...useDefaultConfirmModal,
              show: false,
            });
            showGlobusDownloadPrompt(transferToken, refreshToken, userEndpoint);
          },
          show: true,
          state: 'none',
        });
      } else {
        showGlobusEndpointPrompt();
      }
    } else if (eReady) {
      if (tokenUrlReady(urlParams)) {
        await getUrlTokens();
        showGlobusDownloadPrompt(
          transferToken,
          refreshToken,
          userSelectedEndpoint
        );
      } else {
        showGlobusSigninPrompt('signin');
      }
    } else if (tUrlReady) {
      await getUrlTokens();
      showGlobusEndpointPrompt();
    } else if (eUrlReady) {
      const userEndpoint = await getUrlEndpoint(urlParams);
      setUseDefaultConfirmModal({
        ...useDefaultConfirmModal,
        onOkAction: async () => {
          await saveEndpointAsDefault(userEndpoint);
          setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
          showGlobusSigninPrompt('signin');
        },
        onCancelAction: (): void => {
          setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
          showGlobusSigninPrompt('signin');
        },
        show: true,
        state: 'both',
      });
    } else {
      showGlobusSigninPrompt('both');
    }
  }

  useEffect(() => {
    const initializePage = async (): Promise<void> => {
      const continueProcess = await loadSessionValue(
        GlobusStateKeys.continueGlobusPrepSteps
      );
      const itemCartSelections = await loadSessionValue<RawSearchResults>(
        CartStateKeys.cartItemSelections
      );
      const defaultEndpoint = await loadSessionValue<GlobusStateValue>(
        GlobusStateKeys.defaultEndpoint
      );

      if (itemCartSelections) {
        setItemSelections(itemCartSelections);
      }
      if (defaultEndpoint) {
        setDefaultGlobusEndpoint(defaultEndpoint);
      }
      if (continueProcess) {
        await performGlobusDownloadStep();
      }
    };
    initializePage();
  }, []);

  return (
    <>
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
          className={cartTourTargets.downloadAllType.class()}
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
          <div>
            <Button
              className={cartTourTargets.downloadAllBtn.class()}
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              disabled={itemSelections.length === 0}
              loading={downloadIsLoading}
            >
              Download
            </Button>
          </div>
        </Form.Item>
        {defaultGlobusEndpoint && itemSelections.length !== 0 && (
          <Form.Item>
            <Radio.Group
              onChange={(e) => {
                setUseGlobusDefaultEndpoint(e.target.value as boolean);
                saveSessionValue(
                  GlobusStateKeys.useDefaultEndpoint,
                  e.target.value as boolean
                );
              }}
              value={useGlobusDefaultEndpoint}
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
      <Modal
        title="Save Endpoint"
        visible={useDefaultConfirmModal.show}
        onOk={useDefaultConfirmModal.onOkAction}
        onCancel={useDefaultConfirmModal.onCancelAction}
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
    </>
  );
};

export default DatasetDownloadForm;
