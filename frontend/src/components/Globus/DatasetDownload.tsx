/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { DownloadOutlined, QuestionOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Collapse,
  Divider,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  message,
} from 'antd';
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import PKCE from 'js-pkce';
import {
  fetchWgetScript,
  ResponseError,
  startSearchGlobusEndpoints,
  SubmissionResult,
} from '../../api';
import {
  cartTourTargets,
  createCollectionsFormTour,
  manageCollectionsTourTargets,
} from '../../common/reactJoyrideSteps';
import { RawSearchResults } from '../Search/types';
import { cartDownloadIsLoading, cartItemSelections } from '../Cart/recoil/atoms';
import GlobusStateKeys, { globusSavedEndpoints, globusTaskItems } from './recoil/atom';
import {
  GlobusTokenResponse,
  GlobusTaskItem,
  MAX_TASK_LIST_LENGTH,
  GlobusEndpointSearchResults,
  GlobusEndpoint,
} from './types';
import { getCurrentAppPage, showError, showNotice } from '../../common/utils';
import { RawTourState, ReactJoyrideContext } from '../../contexts/ReactJoyrideContext';
import axios from '../../lib/axios';
import apiRoutes from '../../api/routes';
import DataBundlePersister from '../../common/DataBundlePersister';
import { AppPage } from '../../common/types';

const globusRedirectUrl = `${window.location.origin}/cart/items`;

// Reference: https://github.com/bpedroza/js-pkce
export const REQUESTED_SCOPES =
  'openid profile email urn:globus:auth:scope:transfer.api.globus.org:all';

type AlertModalState = {
  onCancelAction: () => void;
  onOkAction: () => void;
  show: boolean;
  content: React.ReactNode;
};

const COLLECTION_SEARCH_PAGE_SIZE = 5;

export enum GlobusGoals {
  None = 'none',
  DoGlobusTransfer = 'doTransfer',
  SetEndpointPath = 'setEndpoints',
}

// Statically defined list of dataset download options
const downloadOptions = ['Globus', 'wget'];

// The persistent, static, data storage singleton
const db: DataBundlePersister = DataBundlePersister.Instance;

function redirectToNewURL(newUrl: string): void {
  window.location.replace(newUrl);
}

function endpointUrlReady(params: URLSearchParams): boolean {
  return params.has('endpoint_id');
}

function tokenUrlReady(params: URLSearchParams): boolean {
  return params.has('code') && params.has('state');
}

function redirectToRootUrl(): void {
  // Redirect back to the root URL (simple but brittle way to clear the query params)
  const splitUrl = window.location.href.split('?');
  if (splitUrl.length > 1) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cancelled') || endpointUrlReady(params) || tokenUrlReady(params)) {
      const newUrl = splitUrl[0];
      redirectToNewURL(newUrl);
    }
  }
}

const DatasetDownloadForm: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { startSpecificTour } = tourState;

  const [downloadIsLoading, setDownloadIsLoading] = useRecoilState<boolean>(cartDownloadIsLoading);

  // Persistent vars
  const [taskItems, setTaskItems] = useRecoilState<GlobusTaskItem[]>(globusTaskItems);
  const [itemSelections, setItemSelections] = useRecoilState<RawSearchResults>(cartItemSelections);
  const [savedGlobusEndpoints, setSavedGlobusEndpoints] = useRecoilState<GlobusEndpoint[]>(
    globusSavedEndpoints
  );

  db.addVar<string | null>(GlobusStateKeys.accessToken, null);
  db.addVar<string | null>(GlobusStateKeys.globusAuth, null);
  db.addVar<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);

  // Component internal state
  const [chosenGlobusEndpoint, setChosenGlobusEndpoint] = React.useState<GlobusEndpoint | null>();
  db.addVar(GlobusStateKeys.userChosenEndpoint, null, setChosenGlobusEndpoint);

  const [varsLoaded, setVarsLoaded] = React.useState<boolean>(false);

  const [loadingPage, setLoadingPage] = React.useState<boolean>(false);

  const [endpointSearchOpen, setEndpointSearchOpen] = React.useState<boolean>(false);

  const [endpointSearchValue, setEndpointSearchValue] = React.useState<string>('');

  const [loadingEndpointSearchResults, setLoadingEndpointSearchResults] = React.useState<boolean>(
    false
  );

  const [globusEndpoints, setGlobusEndpoints] = React.useState<GlobusEndpoint[] | []>();

  const [selectedDownloadType, setSelectedDownloadType] = React.useState<string>(
    downloadOptions[0]
  );

  const [searchResultsPage, setSearchResultsPage] = React.useState<number>(1);

  const [alertPopupState, setAlertPopupState] = React.useState<AlertModalState>({
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
  });

  async function resetTokens(): Promise<void> {
    setCurrentGoal(GlobusGoals.None);
    setLoadingPage(false);

    db.set<string | null>(GlobusStateKeys.accessToken, null);
    db.set<string | null>(GlobusStateKeys.globusAuth, REQUESTED_SCOPES);
    db.set<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);
    await db.saveAll();
  }

  // Creates an auth object using desired authentication scope
  function createGlobusAuthObject(): PKCE {
    const authScope = db.get<string>(GlobusStateKeys.globusAuth, REQUESTED_SCOPES);

    return new PKCE({
      client_id: window.METAGRID.GLOBUS_CLIENT_ID, // Update this using your native client ID
      redirect_uri: `${window.location.origin}/cart/items`, // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
      authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
      token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
      requested_scopes: authScope, // Update with any scopes you would need, e.g. transfer
    });
  }

  function getGlobusTokens(): [GlobusTokenResponse | null, string | null] {
    const accessToken = db.get<string>(GlobusStateKeys.accessToken, '');
    const transferToken = db.get<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);

    return [transferToken, accessToken];
  }

  async function getUrlAuthTokens(): Promise<void> {
    try {
      const url = window.location.href;
      const pkce = createGlobusAuthObject(); // Create pkce with saved scope
      const tokenResponse = (await pkce.exchangeForAccessToken(url)) as GlobusTokenResponse;

      /* istanbul ignore else */
      if (tokenResponse) {
        /* istanbul ignore else */
        if (tokenResponse.access_token) {
          db.set<string | null>(GlobusStateKeys.accessToken, tokenResponse.access_token);
        } else {
          db.set<string | null>(GlobusStateKeys.accessToken, null);
        }

        // Try to find and get the transfer token
        /* istanbul ignore else */
        if (tokenResponse.other_tokens) {
          const otherTokens: GlobusTokenResponse[] = [
            ...(tokenResponse.other_tokens as GlobusTokenResponse[]),
          ];
          otherTokens.forEach((tokenBlob) => {
            /* istanbul ignore else */
            if (
              tokenBlob.resource_server &&
              tokenBlob.resource_server === 'transfer.api.globus.org'
            ) {
              const newTransferToken = { ...tokenBlob };
              newTransferToken.created_on = Math.floor(Date.now() / 1000);

              db.set<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, newTransferToken);
            }
          });
        } else {
          db.set<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);
        }
        await db.saveAll();
      }
    } catch (error: unknown) {
      /* istanbul ignore next */
      showError(messageApi, 'Error occured when obtaining transfer permissions.');
      await resetTokens();
    } finally {
      // This isn't strictly necessary but it ensures no code reuse.
      sessionStorage.removeItem('pkce_code_verifier');
      sessionStorage.removeItem('pkce_state');
    }
  }

  const handleWgetDownload = (): void => {
    const cleanedSelections = itemSelections.filter((item) => {
      return item !== undefined && item !== null;
    });
    setItemSelections(cleanedSelections);

    const ids = cleanedSelections.map((item) => item.id);
    showNotice(messageApi, 'The wget script is generating, please wait momentarily.', {
      duration: 3,
      type: 'info',
    });
    setDownloadIsLoading(true);
    fetchWgetScript(ids)
      .then(() => {
        setDownloadIsLoading(false);
        showNotice(messageApi, 'Wget script downloaded successfully!', {
          duration: 4,
          type: 'success',
        });
      })
      .catch((error: ResponseError) => {
        showError(
          messageApi,
          <Card
            title="Wget Script Error"
            style={{
              maxWidth: '500px',
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'auto',
            }}
          >
            {error.message}
          </Card>
        );
        setDownloadIsLoading(false);
      });
  };

  const handleGlobusDownload = (
    globusTransferToken: GlobusTokenResponse,
    accessToken: string,
    endpoint: GlobusEndpoint
  ): void => {
    setDownloadIsLoading(true);

    const ids = itemSelections?.map((item) => (item ? item.id : '')) ?? [];

    axios
      .post<SubmissionResult>(
        apiRoutes.globusTransfer.path,
        JSON.stringify({
          access_token: globusTransferToken.access_token,
          refresh_token: accessToken,
          endpointId: endpoint.id,
          path: endpoint.path || '',
          dataset_id: ids,
        })
      )
      .then((resp) => {
        return resp.data;
      })
      .then(async (resp) => {
        setItemSelections([]);
        const newTasks = resp.successes.map((submission) => {
          const taskId = submission.task_id as string;
          return {
            submitDate: new Date(Date.now()).toLocaleString(),
            taskId,
            taskStatusURL: `https://app.globus.org/activity/${taskId}/overview`,
          };
        });

        const nMostRecentTasks = [...newTasks, ...taskItems].slice(0, MAX_TASK_LIST_LENGTH);

        setTaskItems(nMostRecentTasks);

        switch (resp.status) {
          case 200:
            if (resp.successes.length === 0) {
              await showNotice(
                messageApi,
                'Globus download requested, however no transfer occurred.',
                {
                  type: 'warning',
                }
              );
            } else {
              await showNotice(messageApi, 'Globus download initiated successfully!', {
                type: 'success',
              });
            }

            break;

          case 207:
            await showNotice(
              messageApi,
              <span data-testid="207-globus-failures-msg">
                {`One or more Globus submissions failed: \n${resp.failures.join('\n')}`}
              </span>,
              {
                type: 'error',
              }
            );
            await resetTokens();
            break;

          default:
            await showNotice(
              messageApi,
              <span data-testid="unhandled-status-globus-failures-msg">
                {`Globus download returned unexpected response: ${resp.status}`}
              </span>,
              {
                type: 'error',
              }
            );
            await resetTokens();
            break;
        }
      })
      .catch(async (error: ResponseError) => {
        await showNotice(
          messageApi,
          <span data-testid="globus-transfer-backend-error-msg">{error.message}</span>,
          {
            type: 'error',
          }
        );
        await resetTokens();
      })
      .finally(async () => {
        setDownloadIsLoading(false);
        await endDownloadSteps();
      });
  };

  /**
   *
   * @returns False if one or more items are not Globus Ready
   */
  const checkItemsAreGlobusEnabled = (): boolean => {
    if (window.METAGRID.GLOBUS_NODES.length === 0) {
      return true;
    }
    const globusReadyItems: RawSearchResults = [];

    itemSelections.filter((item) => {
      return item !== undefined && item !== null;
    });
    itemSelections.forEach((selection) => {
      if (selection) {
        const dataNode = selection.data_node as string;
        if (dataNode && window.METAGRID.GLOBUS_NODES.includes(dataNode)) {
          globusReadyItems.push(selection);
        }
      }
    });

    // If there are non-Globus Ready selections, show alert
    const globusDisabledCount = itemSelections.length - globusReadyItems.length;

    if (globusDisabledCount > 0) {
      let state = 'One';
      if (globusDisabledCount > 1) {
        state = 'Some';
      }
      let content = `${state} of your selected items cannot be transferred via Globus. Would you like to continue the Globus transfer with the 'Globus Ready' items?`;

      if (globusDisabledCount === itemSelections.length) {
        state = 'None';
        content =
          "None of your selected items can be transferred via Globus at this time. When choosing the Globus Transfer option, make sure your selections are 'Globus Ready'.";
      }

      const newAlertPopupState: AlertModalState = {
        content,
        onCancelAction: () => {
          setAlertPopupState({ ...alertPopupState, show: false });
          setCurrentGoal(GlobusGoals.None);
        },
        onOkAction: async () => {
          if (state === 'None') {
            setAlertPopupState({ ...alertPopupState, show: false });
            setCurrentGoal(GlobusGoals.None);
          } else {
            setAlertPopupState({ ...alertPopupState, show: false });
            setItemSelections(globusReadyItems);
            setCurrentGoal(GlobusGoals.DoGlobusTransfer);
            await performStepsForGlobusGoals();
          }
        },
        show: true,
      };

      if (!alertPopupState.show) {
        setAlertPopupState(newAlertPopupState);
      }
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
          setCurrentGoal(GlobusGoals.DoGlobusTransfer);
          await performStepsForGlobusGoals();
        };
        prepareDownload();
      }
    }
  };

  const updateScopes = (): void => {
    // Save the endpoint in the list

    // Create list of endpoints that require data access scope
    const dataAccessEndpoints: GlobusEndpoint[] = [];
    savedGlobusEndpoints.forEach((endpoint) => {
      if (endpoint.entity_type === 'GCSv5_mapped_collection' && endpoint.subscription_id) {
        dataAccessEndpoints.push(endpoint);
      }
    });

    // Previous scope
    const oldScope = db.get<string>(GlobusStateKeys.globusAuth, REQUESTED_SCOPES);
    let newScope = REQUESTED_SCOPES;
    if (dataAccessEndpoints.length > 0) {
      // Create a new scope string
      const DATA_ACCESS_SCOPE = `${dataAccessEndpoints
        .reduce((acc, endpoint) => {
          const ACCESS_SCOPE = `*https://auth.globus.org/scopes/${endpoint.id}/data_access`;
          return `${acc + ACCESS_SCOPE} `;
        }, 'urn:globus:auth:scope:transfer.api.globus.org:all[')
        .trimEnd()}]`;
      newScope = newScope.concat(' ', DATA_ACCESS_SCOPE);
    }

    // Reset tokens if the SCOPES changed
    if (oldScope !== newScope) {
      db.set<string | null>(GlobusStateKeys.accessToken, null);
      db.set<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);
      db.set<string>(GlobusStateKeys.globusAuth, newScope);
    }
  };

  const saveGlobusEndpoint = (newEndpoint: GlobusEndpoint): void => {
    // Add the endpoint to the list
    const newEndpointsList = [...savedGlobusEndpoints, newEndpoint];
    setSavedGlobusEndpoints(newEndpointsList);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const changeGlobusEndpoint = async (value: string): Promise<void> => {
    if (value === '') {
      setEndpointSearchValue('');
      setGlobusEndpoints([]);
      setEndpointSearchOpen(true);
      return;
    }

    const checkEndpoint = savedGlobusEndpoints?.find(
      (endpoint: GlobusEndpoint) => endpoint.id === value
    );

    await db.setAndSave<GlobusEndpoint | undefined>(
      GlobusStateKeys.userChosenEndpoint,
      checkEndpoint
    );
  };

  const searchGlobusEndpoints = async (value: string): Promise<void> => {
    try {
      if (value) {
        setLoadingEndpointSearchResults(true);
        const endpoints: GlobusEndpointSearchResults = await startSearchGlobusEndpoints(value);
        const mappedEndpoints: GlobusEndpoint[] = endpoints.data.map((endpointInfo) => {
          return {
            canonical_name: endpointInfo.canonical_name,
            contact_email: endpointInfo.contact_email,
            display_name: endpointInfo.display_name,
            entity_type: endpointInfo.entity_type,
            id: endpointInfo.id,
            owner_id: endpointInfo.owner_id,
            owner_string: endpointInfo.owner_string,
            path: endpointInfo.path,
            subscription_id: endpointInfo.subscription_id,
          };
        });

        for (let i = 0; i < mappedEndpoints.length; i += 1) {
          if (mappedEndpoints[i].entity_type === 'GCSv5_endpoint') {
            mappedEndpoints.splice(i, 1);
          }
        }
        setGlobusEndpoints(mappedEndpoints);
        setSearchResultsPage(1);
      } else {
        setEndpointSearchValue('');
        setGlobusEndpoints([]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      setAlertPopupState({
        content: 'An error occurred while searching for collections. Please try again later.',
        onCancelAction: () => {
          setAlertPopupState({ ...alertPopupState, show: false });
        },
        onOkAction: () => {
          setAlertPopupState({ ...alertPopupState, show: false });
        },
        show: true,
      });
    } finally {
      setLoadingEndpointSearchResults(false);
    }
  };

  function tokensReady(
    accessToken: string | null,
    globusTransferToken: GlobusTokenResponse | null
  ): boolean {
    // Test if the current transfer token is expired
    let globusTokenReady = false;
    if (globusTransferToken && globusTransferToken.expires_in) {
      const createTime = globusTransferToken.created_on;
      const lifeTime = globusTransferToken.expires_in;
      const expires = createTime + lifeTime;
      const curTime = Math.floor(Date.now() / 1000);

      if (curTime <= expires) {
        globusTokenReady = true;
      }
    }

    return accessToken !== null && globusTokenReady;
  }

  function getCurrentGoal(): GlobusGoals {
    const urlParams = new URLSearchParams(window.location.search);
    const curPage = getCurrentAppPage();
    // If cancelled key is in URL, set goal to none
    if (urlParams.has('cancelled') || curPage !== AppPage.Cart) {
      setCurrentGoal(GlobusGoals.None);
      return GlobusGoals.None;
    }

    const goal = localStorage.getItem(GlobusStateKeys.globusTransferGoalsState);
    if (goal !== null) {
      return goal as GlobusGoals;
    }

    return GlobusGoals.None;
  }

  function setCurrentGoal(goal: GlobusGoals): void {
    localStorage.setItem(GlobusStateKeys.globusTransferGoalsState, goal);
  }

  async function redirectToSelectGlobusEndpointPath(): Promise<void> {
    const endpointSearchURL = `https://app.globus.org/helpers/browse-collections?action=${globusRedirectUrl}&method=GET&cancelurl=${globusRedirectUrl}?cancelled&filelimit=0`;

    setLoadingPage(true);
    await db.saveAll();
    setLoadingPage(false);
    const chosenEndpoint = db.get<GlobusEndpoint | null>(GlobusStateKeys.userChosenEndpoint, null);

    if (chosenEndpoint) {
      redirectToNewURL(`${endpointSearchURL}&origin_id=${chosenEndpoint.id}`);
    } else {
      redirectToNewURL(endpointSearchURL);
    }
  }

  async function loginWithGlobus(): Promise<void> {
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');

    const pkce = createGlobusAuthObject();
    const authUrl: string = pkce.authorizeUrl();
    setLoadingPage(true);
    await db.saveAll();
    setLoadingPage(false);
    redirectToNewURL(authUrl);
  }

  async function endDownloadSteps(): Promise<void> {
    setDownloadIsLoading(false);
    setLoadingPage(true);
    await db.setAndSave<GlobusEndpoint | undefined>(GlobusStateKeys.userChosenEndpoint, undefined);
    setLoadingPage(false);
    setCurrentGoal(GlobusGoals.None);
    redirectToRootUrl();
  }

  async function performStepsForGlobusGoals(): Promise<void> {
    const goal = getCurrentGoal();

    if (!varsLoaded) {
      setVarsLoaded(true);
      await db.loadAll();
      // eslint-disable-next-line no-console
    }

    // Obtain URL params if applicable
    const urlParams = new URLSearchParams(window.location.search);
    const eUrlReady = endpointUrlReady(urlParams);

    // If globusGoal state is none, do nothing
    if (goal === GlobusGoals.None) {
      if (urlParams.size > 0) {
        redirectToRootUrl();
      }
      setLoadingPage(false);
      return;
    }

    // Goal is to set the path for chosen endpoint
    if (goal === GlobusGoals.SetEndpointPath) {
      // If endpoint urls are ready, update related values
      if (eUrlReady) {
        const path = urlParams.get('origin_path');
        const endpointId = urlParams.get('endpoint_id');
        if (path === null) {
          setCurrentGoal(GlobusGoals.None);
        }

        const updatedEndpointList = savedGlobusEndpoints.map((endpoint) => {
          if (endpoint && endpoint.id === endpointId) {
            return { ...endpoint, path };
          }
          return endpoint;
        });

        // Set path for endpoint
        setSavedGlobusEndpoints(updatedEndpointList);

        // If endpoint was updated, set it as chosen endpoint
        const updatedEndpoint = updatedEndpointList.find(
          (endpoint: GlobusEndpoint) => endpoint.id === endpointId
        );
        if (updatedEndpoint) {
          db.set<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint, updatedEndpoint);
        }

        setCurrentGoal(GlobusGoals.None);
        await db.saveAll();
        redirectToRootUrl();
        return;
      }

      if (!alertPopupState.show) {
        setAlertPopupState({
          onCancelAction: () => {
            setLoadingPage(false);
            setCurrentGoal(GlobusGoals.None);
            setAlertPopupState({ ...alertPopupState, show: false });
          },
          onOkAction: async () => {
            await redirectToSelectGlobusEndpointPath();
          },
          show: true,
          content: 'You will be redirected to set the path for the collection. Continue?',
        });
      }
      return;
    }

    // Goal is to perform a transfer
    if (goal === GlobusGoals.DoGlobusTransfer) {
      const chosenEndpoint: GlobusEndpoint | null = db.get<GlobusEndpoint | null>(
        GlobusStateKeys.userChosenEndpoint,
        null
      );

      // If there is no chosen endpoint, give notice
      if (!chosenEndpoint || chosenEndpoint.id === '') {
        setLoadingPage(false);
        if (!alertPopupState.show) {
          setAlertPopupState({
            onCancelAction: () => {
              setCurrentGoal(GlobusGoals.None);
              setAlertPopupState({ ...alertPopupState, show: false });
            },
            onOkAction: () => {
              setCurrentGoal(GlobusGoals.None);
              setAlertPopupState({ ...alertPopupState, show: false });
              setEndpointSearchOpen(true);
            },
            show: true,
            content:
              'You need to select a Globus Collection. Would you like to search for a new Globus Collection?',
          });
        }
        return;
      }

      // Update scopes
      updateScopes();

      const [transferToken, accessToken] = getGlobusTokens();
      const tknsReady = tokensReady(accessToken, transferToken);

      // Get tokens if they aren't ready
      if (!tknsReady) {
        const tUrlReady = tokenUrlReady(urlParams);

        // If auth token urls are ready, update related tokens
        if (tUrlReady) {
          // Token URL is ready get tokens
          await getUrlAuthTokens();
          redirectToRootUrl();
          return;
        }

        if (!alertPopupState.show) {
          setAlertPopupState({
            onCancelAction: () => {
              setCurrentGoal(GlobusGoals.None);
              setLoadingPage(false);
              setAlertPopupState({ ...alertPopupState, show: false });
            },
            onOkAction: async () => {
              await loginWithGlobus();
            },
            show: true,
            content: 'You will be redirected to obtain globus tokens. Continue?',
          });
        }

        return;
      }

      // If endpoint urls are ready, update related values
      if (eUrlReady) {
        const path = urlParams.get('origin_path');
        const endpointId = urlParams.get('endpoint_id');
        if (path === null) {
          setCurrentGoal(GlobusGoals.None);
        }
        const updatedEndpoint = savedGlobusEndpoints.find((endpoint) => {
          return endpoint.id === endpointId;
        });

        if (updatedEndpoint) {
          db.set<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint, {
            ...updatedEndpoint,
            path,
          } as GlobusEndpoint);
        } else {
          db.set<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint, {
            canonical_name: '',
            contact_email: '',
            display_name: 'Unsaved Collection',
            entity_type: '',
            id: endpointId,
            owner_id: '',
            owner_string: '',
            path,
            subscription_id: '',
          } as GlobusEndpoint);
        }

        await db.saveAll();
        setLoadingPage(false);
        redirectToRootUrl();
        return;
      }

      // Check chosen endpoint path is ready
      if (chosenEndpoint.path) {
        setCurrentGoal(GlobusGoals.None);
        handleGlobusDownload(
          transferToken as GlobusTokenResponse,
          accessToken as string,
          chosenEndpoint
        );
      } else {
        // Setting endpoint path
        setLoadingPage(false);
        if (!alertPopupState.show) {
          setAlertPopupState({
            onCancelAction: () => {
              setLoadingPage(false);
              setCurrentGoal(GlobusGoals.None);
              setAlertPopupState({ ...alertPopupState, show: false });
            },
            onOkAction: async () => {
              await redirectToSelectGlobusEndpointPath();
            },
            show: true,
            content:
              'You will be redirected to set the path for your selected collection. Continue?',
          });
        }
      }
    }
  }

  const downloadBtnTooltip = (): string => {
    const chosenEndpoint = db.get<GlobusEndpoint | null>(GlobusStateKeys.userChosenEndpoint, null);

    if (itemSelections.length === 0) {
      return 'Please select at least one dataset to download in your cart above.';
    }
    if (selectedDownloadType === 'Globus') {
      if (!chosenEndpoint || savedGlobusEndpoints.length === 0) {
        return 'Please select a Globus Collection.';
      }
    }
    return '';
  };

  useEffect(() => {
    const initializePage = async (): Promise<void> => {
      setLoadingPage(true);

      await performStepsForGlobusGoals();
    };
    initializePage();
  }, []);

  return (
    <>
      {contextHolder}
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
          options={downloadOptions.map((option) => ({
            key: option,
            value: option,
            label: option,
          }))}
        />
        {selectedDownloadType === 'Globus' && (
          <Select
            className={cartTourTargets.globusCollectionDropdown.class()}
            data-testid="searchCollectionInput"
            defaultActiveFirstOption={false}
            filterOption={false}
            onSelect={(value) => {
              changeGlobusEndpoint(value);
            }}
            notFoundContent={null}
            placeholder="Select Globus Collection"
            showSearch
            style={{ width: '450px' }}
            value={chosenGlobusEndpoint?.display_name}
            options={[
              {
                key: '',
                value: '',
                path: '',
                label: 'Manage Collections',
              },
              ...savedGlobusEndpoints.map((endpoint: GlobusEndpoint) => {
                return {
                  key: endpoint.id,
                  value: endpoint.id,
                  path: endpoint.path,
                  label: endpoint.display_name,
                };
              }),
            ]}
            optionLabelProp="label"
            optionRender={(option) =>
              option.key === '' ? (
                <strong>{option.label}</strong>
              ) : (
                <>
                  <strong>{option.label}</strong>
                  <br />
                  ID: {option.key}
                  <br />
                  <span>
                    {((option.data as unknown) as GlobusEndpoint)?.path &&
                      `Path: ${((option.data as unknown) as GlobusEndpoint)?.path}`}
                    {((option.data as unknown) as GlobusEndpoint)?.path && <br />}
                    {((option.data as unknown) as GlobusEndpoint)?.entity_type ===
                      'GCSv5_mapped_collection' &&
                      ((option.data as unknown) as GlobusEndpoint)?.subscription_id !== '' &&
                      'Managed '}
                    {((option.data as unknown) as GlobusEndpoint)?.entity_type ===
                    'GCSv5_guest_collection'
                      ? 'Guest Collection'
                      : 'Mapped Collection'}{' '}
                    <br />
                    {((option.data as unknown) as GlobusEndpoint)?.contact_email !== null &&
                      ((option.data as unknown) as GlobusEndpoint)?.contact_email}
                  </span>
                  <Divider style={{ marginBottom: '0px', marginTop: '0px' }} />
                </>
              )
            }
          ></Select>
        )}
        <Tooltip title={downloadBtnTooltip()} placement="top">
          <Button
            data-testid="downloadDatasetBtn"
            className={cartTourTargets.downloadAllBtn.class()}
            type="primary"
            onClick={() => {
              handleDownloadForm(selectedDownloadType as 'wget' | 'Globus');
            }}
            icon={<DownloadOutlined />}
            disabled={
              itemSelections.length === 0 ||
              (selectedDownloadType === 'Globus' &&
                (!chosenGlobusEndpoint || savedGlobusEndpoints.length === 0))
            }
            loading={downloadIsLoading}
          >
            {selectedDownloadType === 'Globus' ? 'Transfer' : 'Download'}
          </Button>
        </Tooltip>
      </Space>
      <Modal
        className={manageCollectionsTourTargets.globusCollectionsForm.class()}
        data-testid="manageCollectionsForm"
        title={
          <>
            Manage My Collections{' '}
            <Button
              shape="circle"
              type="primary"
              icon={<QuestionOutlined color="primary" style={{ fontSize: '20px' }} />}
              onClick={() => {
                startSpecificTour(createCollectionsFormTour());
              }}
            />
            <Button
              type="primary"
              danger
              onClick={async () => {
                await resetTokens();
                setEndpointSearchOpen(false);
              }}
            >
              Reset Tokens
            </Button>
          </>
        }
        open={endpointSearchOpen}
        okText="Save"
        okButtonProps={{
          className: manageCollectionsTourTargets.saveCollectionBtn.class(),
        }}
        onOk={async () => {
          setEndpointSearchOpen(false);
          db.set<GlobusEndpoint | undefined>(GlobusStateKeys.userChosenEndpoint, undefined);

          await db.saveAll(); // save all the values after the form is closed
        }}
        cancelText="Cancel Changes"
        cancelButtonProps={{
          className: manageCollectionsTourTargets.cancelCollectionBtn.class(),
        }}
        onCancel={async () => {
          setEndpointSearchOpen(false);
          await db.loadAll(); // Reset values from before the form was opened
          await db.setAndSave<GlobusEndpoint | undefined>(
            GlobusStateKeys.userChosenEndpoint,
            undefined
          );
        }}
        width={1000}
      >
        <Input.Search
          className={manageCollectionsTourTargets.searchCollectionInput.class()}
          value={endpointSearchValue}
          onChange={(e) => {
            setEndpointSearchValue(e.target.value);
          }}
          placeholder="Search for a Globus Collection"
          onSearch={searchGlobusEndpoints}
          loading={loadingEndpointSearchResults}
          enterButton
        />
        <Collapse
          size="small"
          defaultActiveKey={1}
          items={[
            {
              key: '1',
              label: (
                <div className={manageCollectionsTourTargets.globusSearchResultsPanel.class()}>
                  Globus Collection Search Results
                </div>
              ),
              children: (
                <Table
                  className={manageCollectionsTourTargets.globusSearchResults.class()}
                  data-testid="globusEndpointSearchResults"
                  loading={loadingEndpointSearchResults}
                  size="small"
                  pagination={
                    globusEndpoints && globusEndpoints.length > COLLECTION_SEARCH_PAGE_SIZE
                      ? {
                          current: searchResultsPage,
                          pageSize: COLLECTION_SEARCH_PAGE_SIZE,
                          onChange: (page) => setSearchResultsPage(page),
                          position: ['bottomRight'],
                        }
                      : {
                          current: searchResultsPage,
                          pageSize: COLLECTION_SEARCH_PAGE_SIZE,
                          onChange: (page) => setSearchResultsPage(page),
                          position: ['none'],
                        }
                  }
                  dataSource={globusEndpoints?.map((endpoint) => {
                    return { ...endpoint, key: endpoint.id };
                  })}
                  columns={[
                    {
                      title: '',
                      dataIndex: 'addBox',
                      key: 'addBox',
                      width: 35,
                      render: (_, endpoint) => {
                        if (
                          savedGlobusEndpoints.findIndex((savedEndpoint) => {
                            return savedEndpoint.id === endpoint.id;
                          }) === -1
                        ) {
                          return (
                            <Button
                              type="primary"
                              onClick={() => {
                                saveGlobusEndpoint(endpoint);
                              }}
                            >
                              Add
                            </Button>
                          );
                        }
                        return (
                          <Button type="primary" disabled>
                            Added
                          </Button>
                        );
                      },
                    },
                    {
                      title: 'ID',
                      dataIndex: 'id',
                      key: 'id',
                      width: 350,
                    },
                    { title: 'Name', dataIndex: 'display_name', key: 'label' },
                  ]}
                />
              ),
            },
            {
              key: '2',
              label: (
                <div className={manageCollectionsTourTargets.mySavedCollectionsPanel.class()}>
                  My Saved Globus Collections
                </div>
              ),
              children: (
                <Table
                  className={manageCollectionsTourTargets.mySavedCollections.class()}
                  data-testid="savedGlobusEndpoints"
                  size="small"
                  pagination={
                    savedGlobusEndpoints.length > COLLECTION_SEARCH_PAGE_SIZE
                      ? {
                          pageSize: COLLECTION_SEARCH_PAGE_SIZE,
                          position: ['bottomRight'],
                        }
                      : {
                          pageSize: COLLECTION_SEARCH_PAGE_SIZE,
                          position: ['none'],
                        }
                  }
                  dataSource={savedGlobusEndpoints
                    .filter((savedEndpoint) => {
                      return savedEndpoint.id !== '';
                    })
                    .map((endpoint) => {
                      return {
                        ...endpoint,
                        key: endpoint.id,
                      } as GlobusEndpoint;
                    })}
                  columns={[
                    {
                      title: '',
                      dataIndex: 'removeBox',
                      key: 'removeBox',
                      width: 70,
                      render: (_, endpoint) => (
                        <Button
                          type="primary"
                          danger
                          onClick={() => {
                            setSavedGlobusEndpoints(
                              savedGlobusEndpoints.filter((savedEndpoint) => {
                                return savedEndpoint.id !== endpoint.id;
                              })
                            );
                          }}
                        >
                          Remove
                        </Button>
                      ),
                    },
                    {
                      title: 'ID',
                      dataIndex: 'id',
                      key: 'id',
                      width: 350,
                    },
                    { title: 'Name', dataIndex: 'display_name', key: 'label' },
                    {
                      title: 'Path',
                      dataIndex: 'setPath',
                      key: 'setPath',
                      width: 70,
                      render: (_, endpoint) => (
                        <Button
                          type="primary"
                          danger
                          onClick={async () => {
                            db.set<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint, endpoint);
                            setEndpointSearchOpen(false);
                            setCurrentGoal(GlobusGoals.SetEndpointPath);
                            await performStepsForGlobusGoals();
                          }}
                        >
                          {endpoint.path ? 'Update Path' : 'Set Path'}
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
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
      <Spin datatest-id="fullscreenLoadingSpinner" spinning={loadingPage} fullscreen />
    </>
  );
};

export default DatasetDownloadForm;
