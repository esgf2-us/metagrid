import { GithubOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import Modal from '../Feedback/Modal';
import startupDisplayData from './startupDisplayData';
import WelcomeTemplate from './Templates/Welcome';
import ChangeLogTemplate from './Templates/ChangeLog';
import { MessageActions, MessageData, MessageTemplates } from './types';

const getMessageSeen = (): string | null => {
  return localStorage.getItem('lastMessageSeen');
};

const setMessageSeen = (): void => {
  localStorage.setItem('lastMessageSeen', startupDisplayData.messageToShow);
};

const getMessageTemplate = (
  msgId: string | null,
  msgActions: MessageActions
): JSX.Element => {
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

  const { template, data: props } = messageData;
  switch (template) {
    case MessageTemplates.ChangeLog:
      return (
        <ChangeLogTemplate templateData={props} templateActions={msgActions} />
      );
    default:
      return (
        <WelcomeTemplate templateData={props} templateActions={msgActions} />
      );
  }
};

const StartPopup: React.FC = () => {
  const startData = startupDisplayData;
  // Startup visibility
  const [visible, setVisible] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<JSX.Element>(<></>);

  const hideMessage = (): void => {
    setVisible(false);
    setMessageSeen();
  };

  const showMessage = (msgId: string | null): void => {
    const actions: MessageActions = {
      close: hideMessage,
      viewChanges: (): void => showMessage(startData.messageToShow),
    };
    const titleComponent = getMessageTemplate(msgId, actions);
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
      <Modal visible={visible} title={title} onClose={hideMessage} centered>
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
