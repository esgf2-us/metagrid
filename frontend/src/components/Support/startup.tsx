import { GithubOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React, { useEffect } from 'react';
import { JoyrideTour } from '../../common/JoyrideTour';
import {
  createSearchCardTour,
  createMainPageTour,
  createCartItemsTour,
  createNodeStatusTour,
  TourTitles,
} from '../../common/reactJoyrideSteps';
import {
  RawTourState,
  ReactJoyrideContext,
} from '../../contexts/ReactJoyrideContext';
import Modal from '../Feedback/Modal';

const Startup: React.FC = () => {
  // Startup visibility
  const [visible, setVisible] = React.useState(false);

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setTour, startTour, setCurrentAppPage } = tourState;

  const startSpecificTour = (tour: JoyrideTour): void => {
    setTour(tour);
    startTour();
  };

  const startMainPageTour = (): void => {
    startSpecificTour(createMainPageTour());
  };

  const startCartPageTour = (): void => {
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
  };

  const startSearchCardTour = (): void => {
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
  };

  const startNodeStatusTour = (): void => {
    startSpecificTour(createNodeStatusTour());
  };

  useEffect(() => {
    const startupShown = localStorage.getItem('welcomeAlreadyShown');
    if (startupShown === null) {
      setVisible(true);
    }
  }, []);

  return (
    <>
      <div data-testid="support-form">
        <Modal
          visible={visible}
          title={
            <div>
              <h1>Welcome!</h1>
              <h2>If this is your first time using Metagrid, welcome!</h2>
              <p>
                {`If you wish to become familiar with Metagrid's search and download
                features, we recommend checking out the interface tours below: You can always access these tours, as well as Metagrid
                related support and documentation, by clicking on the 'help'
                button in the top-right or clicking the blue question mark icon
                in the lower-right corner.`}
              </p>
              <div>
                <h3>User Interface Tours</h3>
                <p style={{ fontSize: '14px' }}>
                  {`If you are new to Metagrid, you can familiarize yourself with
                  the user interface by clicking on an available tour below.`}
                </p>
              </div>
              <Card title="">
                <Button
                  style={{ marginLeft: '10px' }}
                  onClick={startMainPageTour}
                >
                  {TourTitles.Main}
                </Button>
                <Button
                  style={{ marginLeft: '10px' }}
                  onClick={startCartPageTour}
                >
                  {TourTitles.Cart}
                </Button>
                <Button
                  style={{ marginLeft: '10px' }}
                  onClick={startSearchCardTour}
                >
                  {TourTitles.Searches}
                </Button>
                <Button
                  style={{ marginLeft: '10px' }}
                  onClick={startNodeStatusTour}
                >
                  {TourTitles.Node}
                </Button>
              </Card>

              <h3>Documentation</h3>
              <p style={{ fontSize: '14px' }}>
                To view the latest documentation and FAQ, please visit this
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
            </div>
          }
          onClose={() => {
            setVisible(false);
            localStorage.setItem('welcomeAlreadyShown', 'true');
          }}
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

export default Startup;
