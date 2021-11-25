import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { JoyrideTour } from '../../common/JoyrideTour';
import {
  createSearchCardTour,
  createMainPageTour,
  getCurrentAppPage,
  mainTourTargets,
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
  const history = useHistory();

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setTour, startTour, setCurrentAppPage } = tourState;

  const curPage = getCurrentAppPage();

  const startSpecificTour = (tour: JoyrideTour): void => {
    setTour(tour);
    startTour();
    onClose();
  };

  const startTestTour = (): void => {
    startSpecificTour(mainTourTargets.createTestTourOfTargets());
  };

  const startSearchCardTour = (): void => {
    startSpecificTour(createSearchCardTour());
  };

  const startMainPageTour = (): void => {
    startSpecificTour(createMainPageTour());
  };

  const startGrandTour = (): void => {
    setCurrentAppPage(AppPage.Main);

    const firstTour = createMainPageTour();
    const secondTour = createSearchCardTour();

    firstTour.setOnFinish(() => {
      return (): void => {
        setTimeout((): void => {
          setCurrentAppPage(AppPage.SavedSearches);
          setTimeout(() => {
            startSpecificTour(secondTour);
          }, 1000);
        }, 1000);
      };
    });

    secondTour.setOnFinish(() => {
      return (): void => {
        setTimeout((): void => {
          setCurrentAppPage(curPage);
        }, 500);
      };
    });

    startSpecificTour(firstTour);
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
              <h3>User Interface Tours</h3>
              <p style={{ fontSize: '14px' }}>
                If you are new to Metagrid, you can familiarize yourself with
                the user interface by clicking on an available tour below.
              </p>
              <Card title="U.I Tours">
                <Button onClick={startGrandTour}>Metagrid Grand Tour</Button>
                <Button onClick={startTestTour}>TEST Main Page Targets</Button>
                <Button onClick={startMainPageTour}>
                  Main Search Page Tour
                </Button>
                {curPage === AppPage.SavedSearches && (
                  <Button onClick={startSearchCardTour}>Search Card</Button>
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
