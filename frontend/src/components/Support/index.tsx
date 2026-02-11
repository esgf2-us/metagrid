// eslint-disable @typescript-eslint/no-unsafe-argument
import { GithubOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { useAtom } from 'jotai';
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
  const handleTourAreaHover = (selector: string): void => {
    // Special case for search features area
    if (selector === 'search-features-area') {
      const element = document.querySelector('div[data-testid="search-features-wrapper"]');
      if (element) {
        setHoveredTourArea(selector);
      }
      return;
    }

    // Default case - check if element exists
    const element = document.querySelector(selector);
    if (element) {
      setHoveredTourArea(selector);
    }
  };

  // Effect to highlight the hovered tour area
  React.useEffect(() => {
    if (!hoveredTourArea) return undefined;

    // Handle special case for search features (target parent container)
    if (hoveredTourArea === 'search-features-area') {
      const searchContainer = document.querySelector(
        'div[data-testid="search-features-wrapper"]',
      ) as HTMLElement;
      if (!searchContainer) return undefined;

      const originalBorder = searchContainer.style.border;
      const originalBoxShadow = searchContainer.style.boxShadow;
      const originalZIndex = searchContainer.style.zIndex;
      const originalPosition = searchContainer.style.position;
      const originalPointerEvents = searchContainer.style.pointerEvents;
      const originalOpacity = searchContainer.style.opacity;
      const originalTransition = searchContainer.style.transition;

      searchContainer.style.transition = 'border 1.3s ease, box-shadow 1.3s ease';
      searchContainer.style.border = '3px solid #1890ff';
      searchContainer.style.boxShadow =
        '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 15px rgba(24, 144, 255, 0.8)';
      searchContainer.style.position = 'relative';
      searchContainer.style.zIndex = '9999';
      searchContainer.style.pointerEvents = 'none';
      searchContainer.style.setProperty('opacity', '1', 'important');

      return () => {
        searchContainer.style.border = originalBorder;
        searchContainer.style.boxShadow = originalBoxShadow;
        searchContainer.style.zIndex = originalZIndex;
        searchContainer.style.position = originalPosition;
        searchContainer.style.pointerEvents = originalPointerEvents;
        searchContainer.style.opacity = originalOpacity;
        searchContainer.style.transition = originalTransition;
      };
    }

    // Default single element highlighting
    const element = document.querySelector(hoveredTourArea) as HTMLElement;
    if (element) {
      const originalBorder = element.style.border;
      const originalBoxShadow = element.style.boxShadow;
      const originalZIndex = element.style.zIndex;
      const originalPosition = element.style.position;
      const originalPointerEvents = element.style.pointerEvents;
      const originalOpacity = element.style.opacity;
      const originalTransition = element.style.transition;

      element.style.transition = 'border 1.3s ease, box-shadow 1.3s ease';
      element.style.border = '3px solid #1890ff';
      element.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 15px rgba(24, 144, 255, 0.8)';
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.pointerEvents = 'none';
      element.style.setProperty('opacity', '1', 'important');

      return () => {
        element.style.border = originalBorder;
        element.style.boxShadow = originalBoxShadow;
        element.style.zIndex = originalZIndex;
        element.style.position = originalPosition;
        element.style.pointerEvents = originalPointerEvents;
        element.style.opacity = originalOpacity;
        element.style.transition = originalTransition;
      };
    }

    return undefined;
  }, [hoveredTourArea]);

  const startMainPageTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createMainPageTour());
    setSupportModalVisible(false);
  };

  const startCartPageTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startSearchCardTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startNodeStatusTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createNodeStatusTour());
    setSupportModalVisible(false);
  };

  const startNavBarTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createNavBarTour());
    setSupportModalVisible(false);
  };

  const startFacetsPanelTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createFacetsPanelTour());
    setSupportModalVisible(false);
  };

  const startSearchFeaturesTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createSearchFeaturesTour());
    setSupportModalVisible(false);
  };

  const startSearchResultsTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createSearchResultsTour());
    setSupportModalVisible(false);
  };

  const startCartDatasetDetailsTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createCartDatasetDetailsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startCartDownloadOptionsTour = (): void => {
    setHoveredTourArea(null);
    startSpecificTour(createCartDownloadOptionsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

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
          setHoveredTourArea(null);
          setSupportModalVisible(false);
        }}
        centered
        transitionName=""
        maskTransitionName=""
        style={{
          minWidth: showStatus ? '745px' : '640px',
          animation: supportModalVisible ? 'modalFadeIn 0.3s ease-out' : 'none',
          opacity: hoveredTourArea ? 0.7 : 1,
          transition: 'opacity 0.3s ease',
        }}
        styles={{
          mask: {
            backgroundColor: hoveredTourArea ? 'transparent' : 'rgba(0, 0, 0, 0.45)',
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
                {TourTitles.Searches}
              </Button>
              {showStatus && (
                <Button
                  onClick={startNodeStatusTour}
                  type={curPage === AppPage.NodeStatus ? 'primary' : 'default'}
                >
                  {TourTitles.Node}
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
                        onMouseLeave={() => setHoveredTourArea(null)}
                      >
                        {TourTitles.NavBar}
                      </Button>
                      <Button
                        onClick={startFacetsPanelTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(leftSidebarTargets.leftSideBar.selector());
                        }}
                        onMouseLeave={() => setHoveredTourArea(null)}
                      >
                        {TourTitles.FacetsPanel}
                      </Button>
                      <Button
                        onClick={startSearchFeaturesTour}
                        onMouseEnter={() => handleTourAreaHover('search-features-area')}
                        onMouseLeave={() => setHoveredTourArea(null)}
                      >
                        {TourTitles.SearchFeatures}
                      </Button>
                      <Button
                        onClick={startSearchResultsTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(searchTableTargets.searchResultsTable.selector());
                        }}
                        onMouseLeave={() => setHoveredTourArea(null)}
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
                        onMouseLeave={() => setHoveredTourArea(null)}
                      >
                        {TourTitles.CartDatasetDetails}
                      </Button>
                      <Button
                        onClick={startCartDownloadOptionsTour}
                        onMouseEnter={() => {
                          handleTourAreaHover(cartTourTargets.downloadForm.selector());
                        }}
                        onMouseLeave={() => setHoveredTourArea(null)}
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
            <div>
              <h3>Site Admin Support</h3>
              <p style={{ fontSize: '14px' }}>{window.METAGRID.SUPPORT_INFO}</p>
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
