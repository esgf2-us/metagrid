import { DownloadOutlined, QuestionOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Dropdown,
  Input,
  Modal,
  Select,
  SelectProps,
  Space,
  Spin,
  Table,
  Tooltip,
  message,
} from 'antd';
import React, { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import axios from 'axios';
import { useLocation } from 'react-router';
import {
  deleteCookie,
  fetchWgetScript,
  getCookie,
  resetGlobusTokens,
  ResponseError,
  setCookie,
  startSearchGlobusEndpoints,
  SubmissionResult,
} from '../../api';
import { RawSearchResults, StacFeature, StacSearchResponse } from '../Search/types';
import {
  GlobusTaskItem,
  MAX_TASK_LIST_LENGTH,
  GlobusEndpointSearchResults,
  GlobusEndpoint,
} from '../Globus/types';
import { showError, showNotice } from '../../common/utils';
import { RawTourState, ReactJoyrideContext } from '../../contexts/ReactJoyrideContext';
import apiRoutes from '../../api/routes';
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
import {
  getStacGlobusHref,
  generateWgetScriptSTAC,
  convertStacToRawSearchResult,
} from '../../common/STAC';
import GlobusEndpointOption, { GlobusEndpointOptionData } from '../Globus/GlobusEndpointOption';

const GLOBUS_REDIRECT_URL = `${window.location.origin}/cart/items`;

const COLLECTION_SEARCH_PAGE_SIZE = 5;

// Reference: https://github.com/bpedroza/js-pkce
const REQUESTED_SCOPES = 'openid profile email urn:globus:auth:scope:transfer.api.globus.org:all';

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

/* istanbul ignore next -- @preserve */
function redirectToNewURL(newUrl: string): void {
  window.location.replace(newUrl);
}

function endpointUrlReady(params: URLSearchParams): boolean {
  return params.has('endpoint_id');
}

function tokenUrlReady(params: URLSearchParams): boolean {
  return params.has('code') && params.has('state');
}

/* istanbul ignore next -- @preserve */
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

interface DatasetDownloadFormProps {
  stacResults?: StacSearchResponse;
  searchURL?: string;
  onDownloadFinish?: () => void;
}

const DatasetDownloadForm: React.FC<React.PropsWithChildren<DatasetDownloadFormProps>> = (
  props: DatasetDownloadFormProps,
) => {
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
      // istanbul ignore next -- @preserve
      () => {
        setAlertPopupState({ ...alertPopupState, show: false });
      },
    onOkAction:
      // istanbul ignore next -- @preserve
      () => {
        setAlertPopupState({ ...alertPopupState, show: false });
      },
    show: false,
  });

  function setCurrentGoal(goal: GlobusGoals): void {
    localStorage.setItem(GlobusStateKeys.globusTransferGoalsState, goal);
  }

  function endDownloadSteps(): void {
    setCurrentGoal(GlobusGoals.None);
    setLoadingPage(false);
    setDownloadIsLoading(false);

    setChosenGlobusEndpoint(null);
    setItemSelections([]);
    redirectToRootUrl();
  }

  function resetCookiesAndTokens(): void {
    deleteCookie(GlobusStateKeys.globusAuthScope, '/cart/items');
    resetGlobusTokens();
  }

  const handleWgetDownload = (): void => {
    setDownloadIsLoading(true);

    if (props.stacResults && props.stacResults.features.length > 0) {
      const searchItems = props.stacResults.features.map((feature: StacFeature) =>
        convertStacToRawSearchResult(feature),
      );
      // Handle direct hrefs download
      generateWgetScriptSTAC(searchItems, props.searchURL);
      setDownloadIsLoading(false);
      return;
    }

    const cleanedSelections = itemSelections.filter((item) => {
      return item !== undefined && item !== null;
    });
    setItemSelections(cleanedSelections);

    const stacSelections = cleanedSelections.filter((item) => item.isStac);
    const nonStacSelections = cleanedSelections.filter((item) => !item.isStac);

    const STAC_ERROR_MSG =
      'No file links found in selected STAC files, wget script was not generated.';
    const SUCCESS_MSG = 'Wget script downloaded successfully!';
    const STAC_SUCCESS_MSG = 'Wget script for STAC files downloaded successfully!';
    const NON_STAC_SUCCESS_MSG = 'Wget script for non-STAC files downloaded successfully!';
    const BOTH_SUCCESS_MSG =
      'Wget scripts for both STAC and non-STAC files downloaded successfully!';

    // Generate file for STAC selections
    let stacSuccess = false;

    if (stacSelections.length > 0) {
      stacSuccess = generateWgetScriptSTAC(stacSelections);

      /* istanbul ignore next -- @preserve */
      if (props.onDownloadFinish) {
        props.onDownloadFinish();
      }

      if (nonStacSelections.length === 0) {
        setDownloadIsLoading(false);
        if (stacSuccess) {
          showNotice(messageApi, STAC_SUCCESS_MSG, {
            duration: 4,
            type: 'success',
          });
        } else {
          showError(messageApi, STAC_ERROR_MSG);
        }
      }
    }

    // Generate file for non-STAC selections
    if (nonStacSelections.length > 0) {
      const ids = nonStacSelections.map((item) => item.id);

      // Generate wget script for download
      showNotice(
        messageApi,
        `The wget script${nonStacSelections.length > 0 ? 's' : ''} generating, please wait momentarily.`,
        {
          duration: 3,
          type: 'info',
        },
      );

      fetchWgetScript(ids)
        .then(() => {
          setDownloadIsLoading(false);
          let noticeContent: string | React.ReactNode =
            stacSelections.length > 0 ? BOTH_SUCCESS_MSG : SUCCESS_MSG;
          if (stacSelections.length > 0 && !stacSuccess) {
            noticeContent = (
              <Card
                title="STAC Wget Script Error"
                style={{
                  maxWidth: '500px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                }}
              >
                Non-STAC: <Alert closable message={NON_STAC_SUCCESS_MSG} type="success" showIcon />
                <br />
                STAC: <Alert closable message={STAC_ERROR_MSG} type="error" showIcon />
              </Card>
            );
          }

          showNotice(messageApi, noticeContent, {
            duration: 5,
            type: stacSuccess || stacSelections.length === 0 ? 'success' : 'error',
          });
        })
        .catch((error: ResponseError) => {
          setDownloadIsLoading(false);
          const noticeContent: string | React.ReactNode =
            stacSelections.length > 0 ? (
              <>
                STAC:{' '}
                {stacSuccess ? (
                  <Alert closable message={STAC_SUCCESS_MSG} type="success" showIcon />
                ) : (
                  <Alert closable message={STAC_ERROR_MSG} type="error" showIcon />
                )}
                <br />
                Non-STAC: <Alert closable message={error.message} type="error" showIcon />
              </>
            ) : (
              error.message
            );

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
              {noticeContent}
            </Card>,
          );
        });
    }
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
    const ids: string[] = [];
    const globusHrefs: string[] = [];

    if (itemSelections) {
      ids.concat(itemSelections?.map((item) => (item ? item.id : '')));
      itemSelections.forEach((item) => {
        const href = getStacGlobusHref(item.assets);
        if (href !== null) {
          globusHrefs.push(href);
        }
      });
    }

    if (props.stacResults) {
      props.stacResults.features.forEach((feature) => {
        const href = getStacGlobusHref(feature.assets);
        if (href !== null) {
          globusHrefs.push(href);
        }
      });
    }

    setDownloadIsLoading(true);

    const params = JSON.stringify({
      authCode,
      authRedirectUrl: `${window.location.origin}/cart/items`,
      authScope: getCurrentScope(),
      endpointId: endpoint.id,
      path: endpoint.path || '',
      dataset_id: ids,
      globus_hrefs: globusHrefs,
    });

    axios
      .post<SubmissionResult>(apiRoutes.globusTransfer.path, params)
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

            resetCookiesAndTokens();
            endDownloadSteps();
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
            resetCookiesAndTokens();
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
        resetCookiesAndTokens();
        endDownloadSteps();
      })
      .finally(() => {
        /* istanbul ignore next -- @preserve */
        if (props.onDownloadFinish) {
          props.onDownloadFinish();
        }
        setDownloadIsLoading(false);
      });
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
      /* istanbul ignore next -- @preserve */
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

  function setCollectionPath(endpoint: GlobusEndpoint): void {
    if (!alertPopupState.show) {
      setAlertPopupState({
        onCancelAction: () => {
          setLoadingPage(false);
          setCurrentGoal(GlobusGoals.None);
          setAlertPopupState({ ...alertPopupState, show: false });
        },
        onOkAction: () => {
          const endpointSearchURL = `https://app.globus.org/helpers/browse-collections?action=${GLOBUS_REDIRECT_URL}&method=GET&cancelurl=${GLOBUS_REDIRECT_URL}?cancelled&filelimit=0`;

          if (endpoint) {
            redirectToNewURL(`${endpointSearchURL}&origin_id=${endpoint.id}`);
          } else {
            redirectToNewURL(endpointSearchURL);
          }
        },
        show: true,
        content: 'You will be redirected to set the path for the collection. Continue?',
      });
    }
  }

  function getCurrentGoal(): GlobusGoals {
    const urlParams = new URLSearchParams(window.location.search);

    // If cancelled key is in URL, set goal to none
    if (urlParams.has('cancelled')) {
      setCurrentGoal(GlobusGoals.None);
      return GlobusGoals.None;
    }

    const goal = localStorage.getItem(GlobusStateKeys.globusTransferGoalsState);
    if (goal !== null) {
      return goal as GlobusGoals;
    }

    return GlobusGoals.None;
  }

  function performStepsForGlobusGoals(): void {
    const goal = getCurrentGoal();

    // Obtain URL params if applicable
    const urlParams = new URLSearchParams(window.location.search);
    const eUrlReady = endpointUrlReady(urlParams);

    const urlParamsSize = Array.from(urlParams).length;

    if (urlParamsSize > 0) {
      if (chosenGlobusEndpoint && tokenUrlReady(urlParams)) {
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

      setCollectionPath(chosenGlobusEndpoint as GlobusEndpoint);
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
      /* istanbul ignore next -- @preserve */
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
        setCollectionPath(chosenGlobusEndpoint);
      }
    }
  }

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
        } else if (selection.isStac && getStacGlobusHref(selection.assets)) {
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
            performStepsForGlobusGoals();
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
    /* istanbul ignore else -- @preserve */
    if (downloadType === 'wget') {
      handleWgetDownload();
    } else if (downloadType === 'Globus') {
      let itemsReady = false;
      if (props.stacResults && props.stacResults.features) {
        itemsReady = true;
      } else {
        itemsReady = checkItemsAreGlobusEnabled();
      }

      if (itemsReady) {
        setCurrentGoal(GlobusGoals.DoGlobusTransfer);
        performStepsForGlobusGoals();
      }
    }
  };

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
      label: 'Reset Tokens',
      danger: true,
      onClick: () => {
        const newAlertPopupState: AlertModalState = {
          content:
            "If you ran into some issues, it may help to reset tokens so you can request new ones. Click 'Ok' if you wish to to reset tokens.",

          onCancelAction: () => {
            setAlertPopupState({ ...alertPopupState, show: false });
          },
          onOkAction: async () => {
            resetCookiesAndTokens();

            setAlertPopupState({ ...alertPopupState, show: false });
            await showNotice(messageApi, 'Globus tokens reset!', {
              duration: 2,
              type: 'info',
            });

            endDownloadSteps();
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

      performStepsForGlobusGoals();
    };
    initializePage();
  }, []);

  type OptionRenderType = Required<SelectProps<string, GlobusEndpointOptionData>>['optionRender'];
  const renderGlobusOption: OptionRenderType = useCallback((option) => {
    // Now 'option.data' is correctly typed as MyGlobusOption
    return (
      <GlobusEndpointOption
        label={option.label}
        value={option.value ?? ''}
        endpoint={option.data.endpoint}
      />
    );
  }, []);

  return (
    <>
      {contextHolder}
      <Space>
        <Select
          className={cartTourTargets.downloadAllType.class()}
          defaultValue={downloadOptions[0]}
          data-testid="downloadTypeSelector"
          style={{ width: 135, textAlign: 'center' }}
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
            style={{ width: '400px', textAlign: 'center' }}
            value={chosenGlobusEndpoint?.display_name}
            options={[
              {
                key: '',
                value: '',
                path: '',
                label: 'Manage Collections',
                endpoint: {} as GlobusEndpoint,
              },
              ...savedGlobusEndpoints.map((endpoint: GlobusEndpoint) => ({
                key: endpoint.id,
                value: endpoint.id,
                path: endpoint.path,
                label: endpoint.display_name,
                endpoint,
              })),
            ]}
            optionLabelProp="label"
            optionRender={renderGlobusOption}
          />
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
                (itemSelections.length === 0 && !props.stacResults) ||
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
              disabled={itemSelections.length === 0 && !props.stacResults}
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
        <Space.Compact style={{ width: '100%' }}>
          <Input
            className={manageCollectionsTourTargets.searchCollectionInput.class()}
            value={endpointSearchValue}
            onChange={(e) => {
              setEndpointSearchValue(e.target.value);
            }}
            placeholder="Search for a Globus Collection"
            onPressEnter={() => {
              searchGlobusEndpoints(endpointSearchValue);
            }}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={() => {
              searchGlobusEndpoints(endpointSearchValue);
            }}
            loading={loadingEndpointSearchResults}
            type="primary"
            size="large"
          />
        </Space.Compact>
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
                            setCollectionPath(endpoint);
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
