import { GithubOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import Modal from '../Feedback/Modal';
import startupDisplayData from './startupDisplayData';
import WelcomeTemplate from './Templates/Welcome';
import ChangeLogTemplate from './Templates/ChangeLog';
import { MessageData, MessageTemplates } from './types';

const getMessageSeen = (): string | null => {
  return localStorage.getItem('lastMessageSeen');
};

const setMessageSeen = (): void => {
  localStorage.setItem('lastMessageSeen', startupDisplayData.messageToShow);
};

const getMessageTemplate = (msgId: string | null): JSX.Element => {
  const messages: MessageData[] = startupDisplayData.messageData;
  let messageData = messages.find((msg) => {
    return msg.messageId === startupDisplayData.defaultMessageId;
  });
  if (msgId) {
    const msgData = messages.find((msg) => {
      return msg.messageId === msgId;
    });
    if (msgData) {
      messageData = msgData;
    }
  }

  if (!messageData) {
    return <></>;
  }

  const { template, props } = messageData;
  switch (template) {
    case MessageTemplates.ChangeLog:
      return <ChangeLogTemplate templateProps={props} />;
    default:
      return <WelcomeTemplate templateProps={props} />;
  }
};

const StartPopup: React.FC = () => {
  const startData = startupDisplayData;
  // Startup visibility
  const [visible, setVisible] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<JSX.Element>(<></>);

  const showMessage = (msgId: string | null): void => {
    const titleComponent = getMessageTemplate(msgId);
    setTitle(titleComponent);
    setVisible(true);
  };

  useEffect(() => {
    const startupMessageSeen = getMessageSeen();
    if (startupMessageSeen === null) {
      showMessage(null);
    } else if (startupMessageSeen !== startData.messageToShow) {
      showMessage(startData.messageToShow);
    }
  }, []);

  return (
    <div data-testid="startup-window">
      <Modal
        visible={visible}
        title={title}
        onClose={() => {
          setVisible(false);
          setMessageSeen();
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
            margin: 0,
          }}
        >
          <a
            href="https://github.com/aims-group/metagrid/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubOutlined style={{ fontSize: '24px' }} /> GitHub Issues
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default StartPopup;
