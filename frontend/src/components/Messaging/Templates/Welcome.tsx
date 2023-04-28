import { Button, Card, Col, Row } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MessageActions, TemplateProps, WelcomeData } from '../types';

const WelcomeTemplate: React.FC<TemplateProps> = ({
  templateData,
  templateActions,
}) => {
  const data: WelcomeData = templateData as WelcomeData;
  const actions: MessageActions = templateActions;

  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { setTour, startTour, setCurrentAppPage } = tourState;
  const navigator = useNavigate();

  const startSpecificTour = (tour: JoyrideTour): void => {
    setTour(tour);
    actions.close();
    startTour();
  };

  const startMainPageTour = (): void => {
    navigator('/search');
    startSpecificTour(createMainPageTour());
  };

  const startCartPageTour = (): void => {
    navigator('/cart/items');
    startSpecificTour(createCartItemsTour(setCurrentAppPage));
  };

  const startSearchCardTour = (): void => {
    navigator('/cart/searches');
    startSpecificTour(createSearchCardTour(setCurrentAppPage));
  };

  const startNodeStatusTour = (): void => {
    navigator('/nodes');
    startSpecificTour(createNodeStatusTour());
  };

  return (
    <>
      <h1>Welcome!</h1>
      <p>{data.welcomeMessage}</p>
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Button
              style={{ marginLeft: '10px', width: '180px' }}
              onClick={startMainPageTour}
            >
              {TourTitles.Main}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              style={{ marginLeft: '10px', width: '180px' }}
              onClick={startCartPageTour}
            >
              {TourTitles.Cart}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              style={{ marginLeft: '10px', width: '180px' }}
              onClick={startSearchCardTour}
            >
              {TourTitles.Searches}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              style={{ marginLeft: '10px', width: '180px' }}
              onClick={startNodeStatusTour}
            >
              {TourTitles.Node}
            </Button>
          </Col>
        </Row>
      </Card>
      <br />
      <p style={{ textAlign: 'center' }}>
        Click buttons below, to view the latest changes related to Metagrid:
        <br />
        <Button style={{ margin: '8px' }} onClick={actions.viewChanges}>
          View Latest Changes
        </Button>
      </p>
      <h2>Documentation</h2>
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
    </>
  );
};

export default WelcomeTemplate;
