import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import Modal from '../Feedback/Modal';

export type Props = {
  visible: boolean;
  onClose: () => void;
};

const EndpointModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <>
      <div data-testid="globus-endpoint-form">
        <Modal
          visible={visible}
          title={
            <div>
              <h2>
                <QuestionCircleOutlined /> Globus Endpoint Selection
              </h2>
            </div>
          }
          onClose={onClose}
          centered
        >
          <p>Select the endpoint you`&apos;`d like to have.</p>
        </Modal>
      </div>
    </>
  );
};

export default EndpointModal;
