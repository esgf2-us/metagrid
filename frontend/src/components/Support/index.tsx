// eslint-disable @typescript-eslint/no-unsafe-argument
import { GithubOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { useAtom } from 'jotai';
import Markdown from 'react-markdown';
import { AppPage } from '../../common/types';
import { RawTourState, ReactJoyrideContext } from '../../contexts/ReactJoyrideContext';
import Modal from '../Feedback/Modal';
import { getCurrentAppPage } from '../../common/utils';
import { supportModalVisibleAtom } from '../../common/atoms';
import {
  createMainPageTour,
  createCartItemsTour,
  createCartDatasetDetailsTour,
  createCartDownloadOptionsTour,
  createSearchCardTour,
  createNodeStatusTour,
  createNavBarTour,
  createFacetsPanelTour,
  createSearchFeaturesTour,
  createSearchResultsTour,
  TourTitles,
  navBarTargets,
  leftSidebarTargets,
  searchTableTargets,
  cartTourTargets,
} from '../../common/joyrideTutorials/reactJoyrideSteps';

const Support: React.FC = () => {
  // Global states
  const [supportModalVisible, setSupportModalVisible] = useAtom<boolean>(supportModalVisibleAtom);

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setCurrentAppPage, startSpecificTour } = tourState;

  const curPage = getCurrentAppPage();
  const showStatus = window.METAGRID.STATUS_URL !== null;

  // State to track which tour area is being hovered
  const [hoveredTourArea, setHoveredTourArea] = React.useState<string | null>(null);

  // Helper function to check if element exists before setting hover state
  /* istanbul ignore next -- @preserve */
  const handleTourAreaHover = (selector: string): void => {
    // Default case - check if element exists
    const element = document.querySelector(selector);
    if (element) {
      setHoveredTourArea(selector);
    }
  };

  // Helper function to clear hover state
  /* istanbul ignore next -- @preserve */
  const clearHoverArea = (): void => {
    setHoveredTourArea(null);
  };

  // Effect to highlight the hovered tour area
  /* istanbul ignore next -- @preserve */
  React.useEffect(() => {
    if (!hoveredTourArea) return undefined;

    // Default single element highlighting
    const area = document.querySelector(hoveredTourArea) as HTMLElement;
    if (area) {
      const originalBorder = area.style.border;
      const originalBoxShadow = area.style.boxShadow;
      const originalZIndex = area.style.zIndex;
      const originalPosition = area.style.position;
      const originalPointerEvents = area.style.pointerEvents;
      const originalOpacity = area.style.opacity;
      const originalTransition = area.style.transition;

      area.style.transition = 'border 0.2s ease, box-shadow 0.3s ease';
      area.style.border = '4px solid #1890ff';
      area.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 15px rgba(24, 144, 255, 0.9)';
      area.style.position = 'relative';
      area.style.zIndex = '9999';
      area.style.pointerEvents = 'none';
      area.style.setProperty('opacity', '1', 'important');

      return () => {
        area.style.border = originalBorder;
        area.style.boxShadow = originalBoxShadow;
        area.style.zIndex = originalZIndex;
        area.style.position = originalPosition;
        area.style.pointerEvents = originalPointerEvents;
        area.style.opacity = originalOpacity;
        area.style.transition = originalTransition;
      };
    }

    return undefined;
  }, [hoveredTourArea]);

  const startMainPageTour = (): void => {
    clearHoverArea();
    startSpecificTour(createMainPageTour());
    setSupportModalVisible(false);
  };

  const startCartPageTour = (): void => {
    clearHoverArea();
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startSearchCardTour = (): void => {
    clearHoverArea();
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startNodeStatusTour = (): void => {
    clearHoverArea();
    startSpecificTour(createNodeStatusTour());
    setSupportModalVisible(false);
  };

  const startNavBarTour = (): void => {
    clearHoverArea();
    startSpecificTour(createNavBarTour());
    setSupportModalVisible(false);
  };

  const startFacetsPanelTour = (): void => {
    clearHoverArea();
    startSpecificTour(createFacetsPanelTour());
    setSupportModalVisible(false);
  };

  const startSearchFeaturesTour = (): void => {
    clearHoverArea();
    startSpecificTour(createSearchFeaturesTour());
    setSupportModalVisible(false);
  };

  const startSearchResultsTour = (): void => {
    clearHoverArea();
    startSpecificTour(createSearchResultsTour());
    setSupportModalVisible(false);
  };

  const startCartDatasetDetailsTour = (): void => {
    clearHoverArea();
    startSpecificTour(createCartDatasetDetailsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startCartDownloadOptionsTour = (): void => {
    clearHoverArea();
    startSpecificTour(createCartDownloadOptionsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  // Calculate modal style values
  /* istanbul ignore next -- @preserve */
  const modalOpacity = hoveredTourArea ? 0.7 : 1;
  /* istanbul ignore next -- @preserve */
  const maskBackgroundColor = hoveredTourArea ? 'transparent' : 'rgba(0, 0, 0, 0.45)';

  return (
    <div data-testid="support-form">
      <style>
        {`
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes maskFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
      <Modal
        open={supportModalVisible}
        closeText="Close Support"
        title={<h2>MetaGrid Support</h2>}
        onClose={() => {
          clearHoverArea();
          setSupportModalVisible(false);
        }}
        centered
        transitionName=""
        maskTransitionName=""
        style={{
          minWidth: showStatus ? '745px' : '640px',
          animation: supportModalVisible ? 'modalFadeIn 0.3s ease-out' : 'none',
          opacity: modalOpacity,
          transition: 'opacity 0.3s ease',
        }}
        styles={{
          mask: {
            backgroundColor: maskBackgroundColor,
            transition: 'background-color 0.3s ease',
            zIndex: 99999,
            animation: supportModalVisible ? 'maskFadeIn 0.3s ease-out' : 'none',
          },
          wrapper: {
            zIndex: 99999,
          },
        }}
      >
        <div>
          <div>
            <h3>Documentation</h3>
            <p style={{ fontSize: '14px' }}>
              Welcome to Metagrid Support! To view the latest documentation and FAQ, please visit
              this page:
              <br />
              <a
                href=" https://esgf.github.io/esgf-user-support/metagrid.html"
                rel="noopener noreferrer"
                target="_blank"
              >
                https://esgf.github.io/esgf-user-support/metagrid.html
              </a>
            </p>
          </div>
          <div>
            <h3>User Interface Tours</h3>
            <p style={{ fontSize: '14px' }}>
              If you are new to Metagrid, you can familiarize yourself with the user interface by
              clicking on any of the tours below.
            </p>
          </div>
          <Card title="">
            <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
              Main Tours:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '16px' }}>
              <Button
                onClick={startMainPageTour}
                type={curPage === AppPage.Main ? 'primary' : 'default'}
              >
                {TourTitles.Main}
              </Button>
              <Button
                onClick={startCartPageTour}
                type={curPage === AppPage.Cart ? 'primary' : 'default'}
              >
                {TourTitles.Cart}
              </Button>
              <Button
                onClick={startSearchCardTour}
                type={curPage === AppPage.SavedSearches ? 'primary' : 'default'}
              >
                {TourTitles.SavedSearches}
              </Button>
              {showStatus && (
                <Button
                  onClick={startNodeStatusTour}
                  type={curPage === AppPage.NodeStatus ? 'primary' : 'default'}
                >
                  {TourTitles.NodeStatus}
                </Button>
              )}
            </div>
            {(curPage === AppPage.Main || curPage === AppPage.Cart) && (
              <>
                <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                  Or choose a specific topic:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {curPage === AppPage.Main && (
                    <>
                      <Button
                        onClick={startNavBarTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(navBarTargets.topNavBar.selector());
                        }}
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.MainNavBar}
                      </Button>
                      <Button
                        onClick={startFacetsPanelTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(leftSidebarTargets.leftSideBar.selector());
                        }}
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.MainFacetsPanel}
                      </Button>
                      <Button
                        onClick={startSearchFeaturesTour}
                        onMouseEnter={() =>
                          handleTourAreaHover(searchTableTargets.searchFeaturesArea.selector())
                        }
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.MainSearchFeatures}
                      </Button>
                      <Button
                        onClick={startSearchResultsTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(searchTableTargets.searchResultsTable.selector());
                        }}
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.SearchResults}
                      </Button>
                    </>
                  )}
                  {curPage === AppPage.Cart && (
                    <>
                      <Button
                        onClick={startCartDatasetDetailsTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(cartTourTargets.cartItemsTable.selector());
                        }}
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.CartDatasetDetails}
                      </Button>
                      <Button
                        onClick={startCartDownloadOptionsTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(cartTourTargets.downloadForm.selector());
                        }}
                        onMouseLeave={clearHoverArea}
                      >
                        {TourTitles.CartDownloadOptions}
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </Card>
          {window.METAGRID.SUPPORT_INFO && (
            <div style={{ fontSize: '14px' }}>
              <h3>Site Admin Support</h3>
              <Markdown>{window.METAGRID.SUPPORT_INFO}</Markdown>
            </div>
          )}
          <div>
            <h3>Globus Specific Support</h3>
            <p>
              If you need help regarding Globus Transfers <b>(not related to the Metagrid site)</b>,
              please visit this page for more information:
              <a href="https://app.globus.org/help">https://app.globus.org/help</a>
            </p>
            <h3>Metagrid Specific Issues</h3>
            <p>
              For Metagrid related suggestions, bugs or concerns that cannot be addressed by site
              admins, please visit our GitHub page to open an issue for the developer team.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '12px',
              }}
            >
              <a
                href="https://github.com/aims-group/metagrid/issues"
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubOutlined style={{ fontSize: '30px' }} /> GitHub Issues
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Support;
