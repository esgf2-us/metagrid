import { Button, Card } from 'antd';
import React from 'react';
import { JoyrideTour } from '../../../common/JoyrideTour';
import {
  createMainPageTour,
  createCartItemsTour,
  createSearchCardTour,
  createNodeStatusTour,
  TourTitles,
} from '../../../common/reactJoyrideSteps';
import {
  RawTourState,
  ReactJoyrideContext,
} from '../../../contexts/ReactJoyrideContext';

export type WelcomeProps = {
  welcomeMessage: string;
};

const WelcomeTemplate: React.FC<WelcomeProps> = ({ welcomeMessage }) => {
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

  return (
    <div>
      <h1>Welcome!</h1>
      <p>{welcomeMessage}</p>
      <div>
        <h3>User Interface Tours</h3>
        <p style={{ fontSize: '14px' }}>
          {`If you are new to Metagrid, you can familiarize yourself with
                  the user interface by clicking on an available tour below.`}
        </p>
      </div>
      <Card title="">
        <Button style={{ marginLeft: '10px' }} onClick={startMainPageTour}>
          {TourTitles.Main}
        </Button>
        <Button style={{ marginLeft: '10px' }} onClick={startCartPageTour}>
          {TourTitles.Cart}
        </Button>
        <Button style={{ marginLeft: '10px' }} onClick={startSearchCardTour}>
          {TourTitles.Searches}
        </Button>
        <Button style={{ marginLeft: '10px' }} onClick={startNodeStatusTour}>
          {TourTitles.Node}
        </Button>
      </Card>

      <h3>Documentation</h3>
      <p style={{ fontSize: '14px' }}>
        To view the latest documentation and FAQ, please visit this page:
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
  );
};

export default WelcomeTemplate;
