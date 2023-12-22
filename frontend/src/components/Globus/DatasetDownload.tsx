import { CheckCircleFilled, DownloadOutlined } from '@ant-design/icons';
import { Button, Modal, Radio, Select, Space, Tooltip } from 'antd';
import PKCE from 'js-pkce';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
  saveSessionValue,
  loadSessionValue,
  fetchWgetScript,
  ResponseError,
  startGlobusTransfer,
} from '../../api';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import {
  globusClientID,
  globusEnabledNodes,
  globusRedirectUrl,
} from '../../env';
import { RawSearchResults } from '../Search/types';
import CartStateKeys, {
  cartItemSelections,
  cartDownloadIsLoading,
} from '../Cart/recoil/atoms';
import GlobusStateKeys, {
  globusUseDefaultEndpoint,
  globusDefaultEndpoint,
  globusTaskItems,
} from './recoil/atom';
import {
  GlobusStateValue,
  GlobusTokenResponse,
  GlobusEndpointData,
  GlobusTaskItem,
  MAX_TASK_LIST_LENGTH,
} from './types';
import { NotificationType, showError, showNotice } from '../../common/utils';

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

type AlertModalState = {
  onCancelAction: () => void;
  onOkAction: () => void;
  show: boolean;
  state: string;
  content: React.ReactNode;
};

// Statically defined list of dataset download options
const downloadOptions = ['Globus', 'wget'];

const DatasetDownloadForm: React.FC<React.PropsWithChildren<unknown>> = () => {
  // User wants to use default endpoint
  const [
    useGlobusDefaultEndpoint,
    setUseGlobusDefaultEndpoint,
  ] = useRecoilState<boolean>(globusUseDefaultEndpoint);

  const [
    defaultGlobusEndpoint,
    setDefaultGlobusEndpoint,
  ] = useRecoilState<GlobusStateValue>(globusDefaultEndpoint);

  const [taskItems, setTaskItems] = useRecoilState<GlobusTaskItem[]>(
    globusTaskItems
  );

  const [itemSelections, setItemSelections] = useRecoilState<RawSearchResults>(
    cartItemSelections
  );

  const [downloadIsLoading, setDownloadIsLoading] = useRecoilState<boolean>(
    cartDownloadIsLoading
  );

  // Component internal state
  const [downloadActive, setDownloadActive] = React.useState<boolean>(true);

  const [
    selectedDownloadType,
    setSelectedDownloadType,
  ] = React.useState<string>(downloadOptions[0]);

  const [globusStepsModal, setGlobusStepsModal] = React.useState<ModalState>({
    show: false,
    state: 'both',
    onOkAction:
      // istanbul ignore next
      () => {
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
    onOkAction: /* istanbul ignore next */ () => {
      setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
    },
    onCancelAction: /* istanbul ignore next */ () => {
      setUseDefaultConfirmModal({ ...useDefaultConfirmModal, show: false });
    },
  });

  const [alertPopupState, setAlertPopupState] = React.useState<AlertModalState>(
    {
      content: '',

      onCancelAction:
        // istanbul ignore next
        () => {
          setAlertPopupState({ ...alertPopupState, show: false });
        },
      onOkAction:
        // istanbul ignore next
        () => {
          setAlertPopupState({ ...alertPopupState, show: false });
        },
      show: false,
      state: 'none',
    }
  );

  function addNewTask(newTask: GlobusTaskItem): void {
    const newItemsList = [...taskItems];
    if (taskItems.length >= MAX_TASK_LIST_LENGTH) {
      newItemsList.pop();
    }
    newItemsList.unshift(newTask);
    setTaskItems(newItemsList);
    saveSessionValue(GlobusStateKeys.globusTaskItems, newItemsList);
  }

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

  async function resetTokens(): Promise<void> {
    await saveSessionValue<null>(GlobusStateKeys.accessToken, null);
    await saveSessionValue<null>(GlobusStateKeys.refreshToken, null);
    await saveSessionValue<null>(GlobusStateKeys.transferToken, null);
    await saveSessionValue<null>(GlobusStateKeys.defaultEndpoint, null);
    await saveSessionValue<null>(GlobusStateKeys.userSelectedEndpoint, null);
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
    /* istanbul ignore else */
    if (itemSelections !== null) {
      itemSelections.filter((item) => {
        return item !== undefined && item !== null;
      });
      const ids = itemSelections.map((item) => item.id);
      showNotice('The wget script is generating, please wait momentarily.', {
        duration: 3,
        type: 'info',
      });
      setDownloadIsLoading(true);
      fetchWgetScript(ids)
        .then(() => {
          setDownloadIsLoading(false);
          showNotice('Wget script downloaded successfully!', {
            duration: 4,
            type: 'success',
          });
        })
        .catch((error: ResponseError) => {
          showError(error.message);
          setDownloadIsLoading(false);
        });
    }
  };

  const handleGlobusDownload = async (
    globusTransferToken: GlobusTokenResponse | null,
    refreshToken: string | null,
    endpoint: GlobusEndpointData | null
  ): Promise<void> => {
    setDownloadIsLoading(true);

    const loadedSelections = await loadSessionValue<RawSearchResults>(
      CartStateKeys.cartItemSelections
    );
    if (loadedSelections && loadedSelections.length > 0) {
      setItemSelections(loadedSelections);
      const ids = loadedSelections.map((item) => (item ? item.id : ''));

      if (globusTransferToken && refreshToken) {
        let messageContent: React.ReactNode | string = null;
        let messageType: NotificationType = 'success';

        startGlobusTransfer(
          globusTransferToken.access_token,
          refreshToken,
          endpoint?.endpointId || '',
          endpoint?.path || '',
          ids
        )
          .then((resp) => {
            if (resp.status === 200) {
              setItemSelections([]);
              setDownloadIsLoading(false);
              saveSessionValue(CartStateKeys.cartItemSelections, []);

              const transRespData = resp.data as Record<string, unknown>;
              if (transRespData && transRespData.taskid) {
                const taskId = transRespData.taskid as string;
                const taskItem: GlobusTaskItem = {
                  submitDate: new Date(Date.now()).toLocaleString(),
                  taskId,
                  taskStatusURL: `https://app.globus.org/activity/${taskId}/overview`,
                };
                addNewTask(taskItem);

                if (taskItem.taskStatusURL !== '') {
                  messageContent = (
                    <p>
                      Globus transfer task submitted successfully!
                      <br />
                      <a
                        href={taskItem.taskStatusURL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Task Status
                      </a>
                    </p>
                  );
                }
              } else {
                messageContent = `Globus transfer task submitted successfully!`;
              }
            } else {
              messageContent = `Globus transfer task struggled: ${resp.statusText}`;
              messageType = 'warning';
            }
          })
          .catch(async (error: ResponseError) => {
            if (error.message !== '') {
              messageContent = `Globus transfer task failed: ${error.message}`;
            } else {
              messageContent = `Globus transfer task failed. Resetting tokens.`;
              // eslint-disable-next-line no-console
              console.error(error);
            }
            messageType = 'error';
            await resetTokens();
          })
          .finally(async () => {
            setDownloadActive(false);
            await showNotice(messageContent, {
              duration: 3,
              type: messageType,
            });
            setDownloadActive(true);
            await endDownloadSteps();
          });
      }
    } else {
      await endDownloadSteps();
    }
  };

  /**
   *
   * @returns False if one or more items are not Globus Ready
   */
  const checkItemsAreGlobusEnabled = (): boolean => {
    if (globusEnabledNodes.length === 0) {
      return true;
    }
    const globusReadyItems: RawSearchResults = [];

    itemSelections.filter((item) => {
      return item !== undefined && item !== null;
    });
    itemSelections.forEach((selection) => {
      const data = selection as Record<string, unknown>;
      const dataNode = data.data_node as string;
      if (dataNode && globusEnabledNodes.includes(dataNode)) {
        globusReadyItems.push(selection);
      }
    });

    // If there are non-Globus Ready selections, show alert
    const globusDisabledCount = itemSelections.length - globusReadyItems.length;
    if (globusDisabledCount > 0) {
      let state = 'One';
      if (globusDisabledCount > 1) {
        state = 'Some';
      }
      let content = `${state} of your selected items cannot be transfered via Globus. Would you like to continue the Globus transfer with the 'Globus Ready' items?`;

      if (globusDisabledCount === itemSelections.length) {
        state = 'None';
        content =
          "None of your selected items can be transferred via Globus at this time. When choosing the Globus Transfer option, make sure your selections are 'Globus Ready'.";
      }

      const newAlertPopupState: AlertModalState = {
        content,
        onCancelAction: () => {
          setAlertPopupState({ ...alertPopupState, show: false });
        },
        onOkAction: async () => {
          setAlertPopupState({ ...alertPopupState, show: false });
          if (state !== 'None') {
            // Select only globus enabled items, save to session memory
            setItemSelections(globusReadyItems);
            await saveSessionValue<RawSearchResults>(
              CartStateKeys.cartItemSelections,
              globusReadyItems
            );
            // Starting globus download process
            const prepareDownload = async (): Promise<void> => {
              await performGlobusDownloadStep();
            };
            prepareDownload();
          }
        },
        show: true,
        state,
      };

      setAlertPopupState(newAlertPopupState);
      return false;
    }

    return true;
  };

  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    // istanbul ignore else
    if (downloadType === 'wget') {
      handleWgetDownload();
    } else if (downloadType === 'Globus') {
      const itemsReady = checkItemsAreGlobusEnabled();
      if (itemsReady) {
        const prepareDownload = async (): Promise<void> => {
          await performGlobusDownloadStep();
        };
        prepareDownload();
      }
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
    try {
      const url = window.location.href;

      const tokenResponse = (await GlobusAuth.exchangeForAccessToken(
        url
      )) as GlobusTokenResponse;

      /* istanbul ignore else */
      if (tokenResponse) {
        /* istanbul ignore else */
        if (tokenResponse.refresh_token) {
          await saveSessionValue(
            GlobusStateKeys.refreshToken,
            tokenResponse.refresh_token
          );
        } else {
          await saveSessionValue(GlobusStateKeys.refreshToken, null);
        }

        // Try to find and get the transfer token
        /* istanbul ignore else */
        if (tokenResponse.other_tokens) {
          const otherTokens: GlobusTokenResponse[] = [
            ...(tokenResponse.other_tokens as GlobusTokenResponse[]),
          ];
          otherTokens.forEach(async (tokenBlob) => {
            /* istanbul ignore else */
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
      /* istanbul ignore next */
      showError('Error occured when obtaining transfer permissions.');
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
      const continueProcess = await loadSessionValue<boolean>(
        GlobusStateKeys.continueGlobusPrepSteps
      );
      const itemCartSelections = await loadSessionValue<RawSearchResults>(
        CartStateKeys.cartItemSelections
      );
      const defaultEndpoint = await loadSessionValue<GlobusStateValue>(
        GlobusStateKeys.defaultEndpoint
      );
      const useDefaultEndpoint = await loadSessionValue<boolean>(
        GlobusStateKeys.useDefaultEndpoint
      );
      const savedTaskItems = await loadSessionValue<GlobusTaskItem[]>(
        GlobusStateKeys.globusTaskItems
      );
      if (itemCartSelections) {
        setItemSelections(itemCartSelections);
      }
      if (defaultEndpoint) {
        setDefaultGlobusEndpoint(defaultEndpoint);
      }
      if (useDefaultEndpoint) {
        setUseGlobusDefaultEndpoint(useDefaultEndpoint);
      }
      if (savedTaskItems) {
        setTaskItems(savedTaskItems);
      }
      if (continueProcess) {
        await performGlobusDownloadStep();
      }
    };
    initializePage();
  }, []);

  return (
    <>
      <Space>
        <Select
          className={cartTourTargets.downloadAllType.class()}
          defaultValue={downloadOptions[0]}
          data-testid="downloadTypeSelector"
          style={{ width: 235 }}
          onSelect={(rawType) => {
            const downloadType: string = rawType;
            if (downloadType) {
              setSelectedDownloadType(downloadType);
            }
          }}
        >
          {downloadOptions.map((option) => (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          ))}
        </Select>
        <Button
          data-testid="downloadDatasetBtn"
          className={cartTourTargets.downloadAllBtn.class()}
          type="primary"
          onClick={() => {
            handleDownloadForm(selectedDownloadType as 'wget' | 'Globus');
          }}
          icon={<DownloadOutlined />}
          disabled={itemSelections.length === 0 || !downloadActive}
          loading={downloadIsLoading}
        >
          {selectedDownloadType === 'Globus' ? 'Transfer' : 'Download'}
        </Button>
        {selectedDownloadType === 'Globus' &&
          defaultGlobusEndpoint &&
          itemSelections.length !== 0 &&
          downloadActive && (
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
                <Tooltip title="This option will use your currently saved default endpoint for the Globus transfer">
                  <Radio value defaultChecked>
                    Default Endpoint
                  </Radio>
                </Tooltip>
                <Tooltip title="This option will let you specify an endpoint for the Globus transfer">
                  <Radio value={false}>Specify Endpoint</Radio>
                </Tooltip>
              </Space>
            </Radio.Group>
          )}
      </Space>
      <Modal
        title="Save Endpoint"
        open={useDefaultConfirmModal.show}
        onOk={useDefaultConfirmModal.onOkAction}
        onCancel={useDefaultConfirmModal.onCancelAction}
        okText="Yes"
        cancelText="No"
      >
        <p>Do you want to save this endpoint as default?</p>
      </Modal>
      <Modal
        title="Globus Transfer"
        open={globusStepsModal.show}
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
      <Modal
        okText="Ok"
        onOk={alertPopupState.onOkAction}
        onCancel={alertPopupState.onCancelAction}
        title="Notice"
        open={alertPopupState.show}
      >
        {alertPopupState.content}
      </Modal>
    </>
  );
};

export default DatasetDownloadForm;
