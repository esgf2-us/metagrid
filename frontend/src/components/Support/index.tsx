import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { JoyrideTour } from '../../common/JoyrideTour';
import {
  createSearchCardTour,
  createMainPageTour,
  getCurrentAppPage,
  createCartItemsTour,
  createNodeStatusTour,
  TourTitles,
  miscTargets,
} from '../../common/reactJoyrideSteps';
import { AppPage } from '../../common/types';
import {
  RawTourState,
  ReactJoyrideContext,
} from '../../contexts/ReactJoyrideContext';
import Modal from '../Feedback/Modal';

export type Props = {
  visible: boolean;
  onClose: () => void;
};

const Support: React.FC<Props> = ({ visible, onClose }) => {
  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setTour, startTour, setCurrentAppPage } = tourState;

  const curPage = getCurrentAppPage();

  const startSpecificTour = (tour: JoyrideTour): void => {
    setTour(tour);
    startTour();
  };

  const startMainPageTour = (): void => {
    startSpecificTour(createMainPageTour());
    onClose();
  };

  const startCartPageTour = (): void => {
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
    onClose();
  };

  const startSearchCardTour = (): void => {
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
    onClose();
  };

  const startNodeStatusTour = (): void => {
    startSpecificTour(createNodeStatusTour());
    onClose();
  };

  return (
    <>
      <div data-testid="support-form">
        <Modal
          visible={visible}
          title={
            <div>
              <h2 className={miscTargets.questionBtn.class()}>
                <QuestionCircleOutlined /> MetaGrid Support
              </h2>
              <h3>Documentation</h3>
              <p style={{ fontSize: '14px' }}>
                Welcome to Metagrid Support! To view the latest documentation
                and FAQ, please visit this page:
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
                  If you are new to Metagrid, you can familiarize yourself with
                  the user interface by clicking on an available tour below.
                </p>
              </div>
              <Card title="">
                {curPage === AppPage.Main && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startMainPageTour}
                  >
                    {TourTitles.Main}
                  </Button>
                )}
                {curPage === AppPage.Cart && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startCartPageTour}
                  >
                    {TourTitles.Cart}
                  </Button>
                )}
                {curPage === AppPage.SavedSearches && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startSearchCardTour}
                  >
                    {TourTitles.Searches}
                  </Button>
                )}
                {curPage === AppPage.NodeStatus && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startNodeStatusTour}
                  >
                    {TourTitles.Node}
                  </Button>
                )}
              </Card>
            </div>
          }
          onClose={onClose}
          centered
        >
          <p>
            Questions, suggestions, or problems? Please visit our GitHub page to
            open an issue.
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
              <GithubOutlined style={{ fontSize: '32px' }} /> GitHub Issues
            </a>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Support;
