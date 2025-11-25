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
  createSearchCardTour,
  createNodeStatusTour,
  TourTitles,
} from '../../common/joyrideTutorials/reactJoyrideSteps';

const Support: React.FC = () => {
  // Global states
  const [supportModalVisible, setSupportModalVisible] = useAtom<boolean>(supportModalVisibleAtom);

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setCurrentAppPage, startSpecificTour } = tourState;

  const curPage = getCurrentAppPage();

  const startMainPageTour = (): void => {
    startSpecificTour(createMainPageTour());
    setSupportModalVisible(false);
  };

  const startCartPageTour = (): void => {
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startSearchCardTour = (): void => {
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
    setSupportModalVisible(false);
  };

  const startNodeStatusTour = (): void => {
    startSpecificTour(createNodeStatusTour());
    setSupportModalVisible(false);
  };

  return (
    <>
      <div data-testid="support-form">
        <Modal
          open={supportModalVisible}
          closeText="Close Support"
          title={
            <div>
              <h2>MetaGrid Support</h2>
            </div>
          }
          onClose={() => {
            setSupportModalVisible(false);
          }}
          centered
          style={{ minWidth: '700px' }}
        >
          <h3>Documentation</h3>
          <p style={{ fontSize: '14px' }}>
            Welcome to Metagrid Support! To view the latest documentation and FAQ, please visit this
            page:
            <br />
            <a
              href=" https://esgf.github.io/esgf-user-support/metagrid.html"
              rel="noopener noreferrer"
              target="_blank"
            >
              https://esgf.github.io/esgf-user-support/metagrid.html
            </a>
          </p>
          <div>
            <h3>User Interface Tours</h3>
            <p style={{ fontSize: '14px' }}>
              If you are new to Metagrid, you can familiarize yourself with the user interface of
              this page by clicking on the tour below.
            </p>
            <Card title="">
              <div style={{ display: 'flex', gap: 10 }}>
                {curPage === AppPage.Main && (
                  <Button onClick={startMainPageTour}>{TourTitles.Main}</Button>
                )}
                {curPage === AppPage.Cart && (
                  <Button onClick={startCartPageTour}>{TourTitles.Cart}</Button>
                )}
                {curPage === AppPage.SavedSearches && (
                  <Button onClick={startSearchCardTour}>{TourTitles.Searches}</Button>
                )}
                {curPage === AppPage.NodeStatus && (
                  <Button onClick={startNodeStatusTour}>{TourTitles.Node}</Button>
                )}
              </div>
            </Card>
            {window.METAGRID.SUPPORT_INFO && (
              <>
                <h3>Site Admin Support</h3>
                <p style={{ fontSize: '14px' }}>{window.METAGRID.SUPPORT_INFO}</p>
              </>
            )}
          </div>
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
        </Modal>
      </div>
    </>
  );
};

export default Support;
