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
      <div>
        <Modal
          visible={visible}
          title={
            <div>
              <h2>
                <QuestionCircleOutlined /> MetaGrid Support
              </h2>
              <h3>Documentation</h3>
              <p style={{ fontSize: '14px' }}>
                Checkback for documentation and FAQs in the near future!
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
                    Main Page Tour
                  </Button>
                )}
                {curPage === AppPage.Cart && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startCartPageTour}
                  >
                    Cart Page Tour
                  </Button>
                )}
                {curPage === AppPage.SavedSearches && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startSearchCardTour}
                  >
                    Search Library Tour
                  </Button>
                )}
                {curPage === AppPage.NodeStatus && (
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={startNodeStatusTour}
                  >
                    Node Status Tour
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
