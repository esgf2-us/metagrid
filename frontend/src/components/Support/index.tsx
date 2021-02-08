import { GithubOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import Modal from '../Feedback/Modal';

export type Props = {
  visible: boolean;
  onClose: () => void;
};

const Support: React.FC<Props> = ({ visible, onClose }) => (
    <div>
      <Modal
        visible={visible}
        title={
          <div>
            <h2>
              <QuestionCircleOutlined /> MetaGrid Support
            </h2>
            <p style={{ fontSize: '14px' }}>
              Checkback for documentation and FAQs in the near future. A user
              support ticket form will also be integrated!
            </p>
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
  );

export default Support;
