/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { DownloadOutlined, QuestionOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Collapse,
  Divider,
  Dropdown,
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
import { useAtom } from 'jotai';
import axios from 'axios';
import { useLocation } from 'react-router';
import {
  deleteCookie,
  fetchWgetScript,
  getCookie,
  ResponseError,
  setCookie,
  startSearchGlobusEndpoints,
  SubmissionResult,
} from '../../api';
import { RawSearchResults } from '../Search/types';
import {
  GlobusTaskItem,
  MAX_TASK_LIST_LENGTH,
  GlobusEndpointSearchResults,
  GlobusEndpoint,
} from './types';
import { getCurrentAppPage, showError, showNotice } from '../../common/utils';
import { RawTourState, ReactJoyrideContext } from '../../contexts/ReactJoyrideContext';
import apiRoutes from '../../api/routes';
import { AppPage } from '../../common/types';
import {
  cartDownloadIsLoadingAtom,
  cartItemSelectionsAtom,
  savedGlobusEndpointsAtom,
  globusTaskItemsAtom,
  GlobusStateKeys,
  userChosenEndpointAtom,
} from '../../common/atoms';
import {
  cartTourTargets,
  manageCollectionsTourTargets,
  createCollectionsFormTour,
} from '../../common/joyrideTutorials/reactJoyrideSteps';

const GLOBUS_REDIRECT_URL = `${window.location.origin}/cart/items`;

const COLLECTION_SEARCH_PAGE_SIZE = 5;

// Reference: https://github.com/bpedroza/js-pkce
/* istanbul ignore next */
export const REQUESTED_SCOPES =
  'openid profile email urn:globus:auth:scope:transfer.api.globus.org:all';

type AlertModalState = {
  onCancelAction: () => void;
  onOkAction: () => void;
  show: boolean;
  content: React.ReactNode;
};

export enum GlobusGoals {
  None = 'none',
  DoGlobusTransfer = 'doTransfer',
  SetEndpointPath = 'setEndpoints',
}

// Statically defined list of dataset download options
const downloadOptions = ['Globus', 'wget'];

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

  const location = useLocation();

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { startSpecificTour } = tourState;

  const [downloadIsLoading, setDownloadIsLoading] = useAtom<boolean>(cartDownloadIsLoadingAtom);

  // Persistent vars
  const [taskItems, setTaskItems] = useAtom<GlobusTaskItem[]>(globusTaskItemsAtom);
  const [itemSelections, setItemSelections] = useAtom<RawSearchResults>(cartItemSelectionsAtom);
  const [savedGlobusEndpoints, setSavedGlobusEndpoints] =
    useAtom<GlobusEndpoint[]>(savedGlobusEndpointsAtom);
  const [chosenGlobusEndpoint, setChosenGlobusEndpoint] = useAtom<GlobusEndpoint | null>(
    userChosenEndpointAtom,
  );

  const [loadingPage, setLoadingPage] = React.useState<boolean>(false);

  const [endpointSearchOpen, setEndpointSearchOpen] = React.useState<boolean>(false);

  const [endpointSearchValue, setEndpointSearchValue] = React.useState<string>('');

  const [loadingEndpointSearchResults, setLoadingEndpointSearchResults] =
    React.useState<boolean>(false);

  const [globusEndpoints, setGlobusEndpoints] = React.useState<GlobusEndpoint[] | []>();

  const [selectedDownloadType, setSelectedDownloadType] = React.useState<string>(
    downloadOptions[0],
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

  function resetAuthScope(): void {
    setCurrentGoal(GlobusGoals.None);
    setLoadingPage(false);
    deleteCookie(GlobusStateKeys.globusAuthScope, '/cart/items');
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
          </Card>,
        );
        setDownloadIsLoading(false);
      });
  };

  const getCurrentScope = (): string => {
    if (
      chosenGlobusEndpoint &&
      chosenGlobusEndpoint.entity_type === 'GCSv5_mapped_collection' &&
      chosenGlobusEndpoint.subscription_id
    ) {
      const dataAccessScope = `urn:globus:auth:scope:transfer.api.globus.org:all[*https://auth.globus.org/scopes/${chosenGlobusEndpoint.id}/data_access]`;
      return dataAccessScope;
    }

    return REQUESTED_SCOPES;
  };

  const handleGlobusDownload = (endpoint: GlobusEndpoint, authCode?: string): void => {
    const ids = itemSelections?.map((item) => (item ? item.id : '')) ?? [];

    setDownloadIsLoading(true);

    axios
      .post<SubmissionResult>(
        apiRoutes.globusTransfer.path,
        JSON.stringify({
          authCode,
          authRedirectUrl: `${window.location.origin}/cart/items`,
          authScope: getCurrentScope(),
          endpointId: endpoint.id,
          path: endpoint.path || '',
          dataset_id: ids,
        }),
      )
      .then((resp) => {
        return resp.data;
      })
      .then(async (resp) => {
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
                },
              );
            } else {
              await showNotice(messageApi, 'Globus download initiated successfully!', {
                type: 'success',
              });
            }
            endDownloadSteps();
            break;

          case 207:
            if (resp.auth_url) {
              setLoadingPage(false);
              setDownloadIsLoading(false);
              const content = authCode
                ? 'Permission denied despite consent. Try logging out and logging in again.'
                : 'You will need to provide new consents. Continue?';

              const authURL = resp.auth_url;
              if (!alertPopupState.show) {
                setAlertPopupState({
                  onCancelAction: () => {
                    setAlertPopupState({ ...alertPopupState, show: false });
                    endDownloadSteps();
                  },
                  onOkAction: () => {
                    if (authCode) {
                      endDownloadSteps();
                    } else {
                      redirectToNewURL(authURL);
                    }
                  },
                  show: true,
                  content,
                });
              }
              return;
            }

            await showNotice(
              messageApi,
              <span data-testid="207-globus-failures-msg">
                {`One or more Globus submissions failed: \n${resp.failures.join('\n')}`}
              </span>,
              {
                type: 'error',
              },
            );

            resetAuthScope();
            break;

          default:
            await showNotice(
              messageApi,
              <span data-testid="unhandled-status-globus-failures-msg">
                {`Globus download returned unexpected response: ${resp.status}`}
              </span>,
              {
                type: 'error',
              },
            );
            resetAuthScope();
            endDownloadSteps();
            break;
        }
      })
      .catch(async (error: ResponseError) => {
        if (error.response && error.response.status === 401) {
          // If the error is 401, it means the user needs to re-authenticate
          setAlertPopupState({
            content: 'You may need to re-authenticate with Globus to update consents. Continue?',
            onCancelAction: () => {
              setAlertPopupState({ ...alertPopupState, show: false });
            },
            onOkAction: () => {
              redirectToNewURL(`login/globus/?next=${location.pathname}${location.search}`);
            },
            show: true,
          });
          return;
        }

        await showNotice(
          messageApi,
          <span data-testid="globus-transfer-backend-error-msg">
            An error occurred while processing your Globus transfer request:
            {error.message}
          </span>,
          {
            type: 'error',
          },
        );
        resetAuthScope();
        endDownloadSteps();
      })
      .finally(() => {
        setDownloadIsLoading(false);
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
        onOkAction: () => {
          if (state === 'None') {
            setAlertPopupState({ ...alertPopupState, show: false });
            setCurrentGoal(GlobusGoals.None);
          } else {
            setAlertPopupState({ ...alertPopupState, show: false });
            setItemSelections(globusReadyItems);
            setCurrentGoal(GlobusGoals.DoGlobusTransfer);
            performStepsForGlobusGoalsTest();
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
        const prepareDownload = (): void => {
          setCurrentGoal(GlobusGoals.DoGlobusTransfer);
          performStepsForGlobusGoalsTest();
        };
        prepareDownload();
      }
    }
  };

  /* https://docs.globus.org/globus-connect-server/v5/application/ */
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
    const oldScope = getCookie(GlobusStateKeys.globusAuthScope) ?? REQUESTED_SCOPES;
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
      setCookie(GlobusStateKeys.globusAuthScope, newScope, 7, '/cart/items');
    }
  };

  const saveGlobusEndpoint = (newEndpoint: GlobusEndpoint): void => {
    // Add the endpoint to the list
    const newEndpointsList = [...savedGlobusEndpoints, newEndpoint];
    setSavedGlobusEndpoints(newEndpointsList);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const changeGlobusEndpoint = (value: string): void => {
    if (value === '') {
      setEndpointSearchValue('');
      setGlobusEndpoints([]);
      setEndpointSearchOpen(true);
      return;
    }

    const checkEndpoint = savedGlobusEndpoints?.find(
      (endpoint: GlobusEndpoint) => endpoint.id === value,
    );

    setChosenGlobusEndpoint(checkEndpoint || null);
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

  function redirectToSelectGlobusEndpointPath(): void {
    const endpointSearchURL = `https://app.globus.org/helpers/browse-collections?action=${GLOBUS_REDIRECT_URL}&method=GET&cancelurl=${GLOBUS_REDIRECT_URL}?cancelled&filelimit=0`;

    if (chosenGlobusEndpoint) {
      redirectToNewURL(`${endpointSearchURL}&origin_id=${chosenGlobusEndpoint.id}`);
    } else {
      redirectToNewURL(endpointSearchURL);
    }
  }

  function endDownloadSteps(): void {
    setDownloadIsLoading(false);
    setChosenGlobusEndpoint(null);

    setItemSelections([]);
    setCurrentGoal(GlobusGoals.None);
    redirectToRootUrl();
  }

  function performStepsForGlobusGoalsTest(): void {
    const goal = getCurrentGoal();

    // Obtain URL params if applicable
    const urlParams = new URLSearchParams(window.location.search);
    const eUrlReady = endpointUrlReady(urlParams);

    if (urlParams.size > 0) {
      if (chosenGlobusEndpoint && urlParams.has('state') && urlParams.has('code')) {
        handleGlobusDownload(chosenGlobusEndpoint, urlParams.get('code') || undefined);
        return;
      }
    }

    // If globusGoal state is none, do nothing
    if (goal === GlobusGoals.None) {
      redirectToRootUrl();
      setLoadingPage(false);
      setDownloadIsLoading(false);
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
          (endpoint: GlobusEndpoint) => endpoint.id === endpointId,
        );
        if (updatedEndpoint) {
          setChosenGlobusEndpoint(updatedEndpoint);
        }

        setCurrentGoal(GlobusGoals.None);
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
          onOkAction: () => {
            redirectToSelectGlobusEndpointPath();
          },
          show: true,
          content: 'You will be redirected to set the path for the collection. Continue?',
        });
      }
      return;
    }

    // Goal is to perform a transfer
    if (goal === GlobusGoals.DoGlobusTransfer) {
      // If there is no chosen endpoint, give notice
      if (!chosenGlobusEndpoint || chosenGlobusEndpoint.id === '') {
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
          setChosenGlobusEndpoint({ ...updatedEndpoint, path } as GlobusEndpoint);
        } else {
          setChosenGlobusEndpoint({
            canonical_name: '',
            contact_email: '',
            display_name: 'Unsaved Collection',
            entity_type: '',
            id: endpointId || '',
            owner_id: '',
            owner_string: '',
            path,
            subscription_id: '',
          } as GlobusEndpoint);
        }

        setLoadingPage(false);
        redirectToRootUrl();
        return;
      }

      // Check chosen endpoint path is ready
      if (chosenGlobusEndpoint.path) {
        handleGlobusDownload(chosenGlobusEndpoint);
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
            onOkAction: () => {
              redirectToSelectGlobusEndpointPath();
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
    if (itemSelections.length === 0) {
      return 'Please select at least one dataset to download in your cart above.';
    }
    if (selectedDownloadType === 'Globus') {
      if (!chosenGlobusEndpoint || savedGlobusEndpoints.length === 0) {
        return 'Please select a Globus Collection.';
      }
    }
    return '';
  };

  const globusTransferButtonMenu = [
    {
      key: '1',
      label: 'Reset Auth Scope',
      danger: true,
      onClick: () => {
        const newAlertPopupState: AlertModalState = {
          content:
            "If you haven't performed a Globus transfer in a while, or you ran into some issues, it may help to reset the authentication scope. Click 'Ok' if you wish to to reset.",

          onCancelAction: () => {
            setAlertPopupState({ ...alertPopupState, show: false });
          },
          onOkAction: () => {
            resetAuthScope();

            setAlertPopupState({ ...alertPopupState, show: false });
            showNotice(messageApi, 'Globus Auth scope reset!', {
              duration: 3,
              type: 'info',
            });
          },
          show: true,
        };

        if (!alertPopupState.show) {
          setAlertPopupState(newAlertPopupState);
        }
      },
    },
  ];

  useEffect(() => {
    const initializePage = (): void => {
      setLoadingPage(true);

      performStepsForGlobusGoalsTest();
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
                    {(option.data as unknown as GlobusEndpoint)?.path &&
                      `Path: ${(option.data as unknown as GlobusEndpoint)?.path}`}
                    {(option.data as unknown as GlobusEndpoint)?.path && <br />}
                    {(option.data as unknown as GlobusEndpoint)?.entity_type ===
                      'GCSv5_mapped_collection' &&
                      (option.data as unknown as GlobusEndpoint)?.subscription_id !== '' &&
                      'Managed '}
                    {(option.data as unknown as GlobusEndpoint)?.entity_type ===
                    'GCSv5_guest_collection'
                      ? 'Guest Collection'
                      : 'Mapped Collection'}{' '}
                    <br />
                    {(option.data as unknown as GlobusEndpoint)?.contact_email !== null &&
                      (option.data as unknown as GlobusEndpoint)?.contact_email}
                  </span>
                  <Divider style={{ marginBottom: '0px', marginTop: '0px' }} />
                </>
              )
            }
          ></Select>
        )}
        {selectedDownloadType === 'Globus' ? (
          <Tooltip title={downloadBtnTooltip()} placement="top">
            <Dropdown.Button
              data-testid="downloadDatasetTransferBtns"
              type="primary"
              onClick={() => {
                handleDownloadForm('Globus');
              }}
              disabled={
                itemSelections.length === 0 ||
                !chosenGlobusEndpoint ||
                savedGlobusEndpoints.length === 0
              }
              loading={downloadIsLoading}
              menu={{ items: globusTransferButtonMenu }}
            >
              <div
                data-testid="downloadDatasetTransferBtn"
                className={cartTourTargets.downloadTransferBtn.class()}
              >
                <DownloadOutlined /> Transfer
              </div>
            </Dropdown.Button>
          </Tooltip>
        ) : (
          <Tooltip title={downloadBtnTooltip()} placement="top">
            <Button
              data-testid="downloadDatasetWgetBtn"
              className={cartTourTargets.downloadWgetBtn.class()}
              type="primary"
              onClick={() => {
                handleDownloadForm('wget');
              }}
              icon={<DownloadOutlined />}
              disabled={itemSelections.length === 0}
              loading={downloadIsLoading}
            >
              Download
            </Button>
          </Tooltip>
        )}
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
          </>
        }
        open={endpointSearchOpen}
        okText="Save"
        okButtonProps={{
          className: manageCollectionsTourTargets.saveCollectionBtn.class(),
        }}
        onOk={() => {
          setEndpointSearchOpen(false);
          setChosenGlobusEndpoint(null);
        }}
        cancelText="Cancel Changes"
        cancelButtonProps={{
          className: manageCollectionsTourTargets.cancelCollectionBtn.class(),
        }}
        onCancel={() => {
          setEndpointSearchOpen(false);
          setChosenGlobusEndpoint(null);
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
                              }),
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
                          onClick={() => {
                            setChosenGlobusEndpoint(endpoint);
                            setEndpointSearchOpen(false);
                            setCurrentGoal(GlobusGoals.SetEndpointPath);
                            performStepsForGlobusGoalsTest();
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
