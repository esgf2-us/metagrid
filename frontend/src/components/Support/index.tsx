import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { Step } from 'react-joyride';
import { Link, useHistory } from 'react-router-dom';
import {
  mainTourUnloadedTable,
  mainTourLoadedTable,
  searchCardTour,
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
  const {
    startTour,
    setSteps,
    setFinishCallback,
    getCurrentAppPage,
    setCurrentAppPage,
  } = tourState;

  const startSpecificTour = (steps: Step[]): void => {
    setSteps(steps);
    startTour();
    onClose();
  };

  const curPage = getCurrentAppPage();

  const startMainTour = (): void => {
    startSpecificTour(mainTourUnloadedTable);
  };

  const startSearchCardTour = (): void => {
    startSpecificTour(searchCardTour);
  };

  const doMultiPageTour = (): void => {
    setCurrentAppPage(AppPage.Main);
    startSpecificTour(mainTourUnloadedTable);
    setFinishCallback(() => {
      return () => {
        setTimeout(() => {
          setCurrentAppPage(AppPage.SavedSearches);
          setTimeout(() => {
            setFinishCallback(() => {
              return () => {
                setTimeout(() => {
                  setCurrentAppPage(curPage);
                }, 0);
              };
            });
            startSpecificTour(searchCardTour);
          }, 0);
        }, 0);
      };
    });
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
                <Button onClick={doMultiPageTour}>Full Walkthrough</Button>

                {curPage === AppPage.Main && (
                  <Button onClick={startMainTour}>Main Page</Button>
                )}
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
