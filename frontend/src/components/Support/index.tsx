import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { Step } from 'react-joyride';
import { mainTour } from '../../common/reactJoyrideSteps';
import { ReactJoyrideContext } from '../../contexts/ReactJoyrideContext';
import { RawTourState } from '../../contexts/types';
import Modal from '../Feedback/Modal';

export type Props = {
  visible: boolean;
  onClose: () => void;
};

const Support: React.FC<Props> = ({ visible, onClose }) => {
  // Tutorial state
  const tourState: RawTourState = React.useContext(ReactJoyrideContext);
  const { startTour, setSteps } = tourState;

  const startSpecificTour = (steps: Step[]): void => {
    setSteps(steps);
    startTour();
    onClose();
  };

  const startMainTour = (): void => {
    startSpecificTour(mainTour);
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
              <Card title="U.I. Tours">
                <Button onClick={startMainTour}>Main Page</Button>
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
