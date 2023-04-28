import { GithubOutlined } from '@ant-design/icons';
import React, { CSSProperties, useEffect } from 'react';
import Modal from '../Feedback/Modal';
import messageDisplayData from './messageDisplayData';
import WelcomeTemplate from './Templates/Welcome';
import ChangeLogTemplate from './Templates/ChangeLog';
import { MessageActions, MessageData, MessageTemplates } from './types';

const getMessageSeen = (): string | null => {
  return localStorage.getItem('lastMessageSeen');
};

const setMessageSeen = (): void => {
  localStorage.setItem('lastMessageSeen', messageDisplayData.messageToShow);
};

const getMessageData = (msgId: string | null): MessageData | undefined => {
  if (!msgId) {
    return undefined;
  }
  const messages: MessageData[] = messageDisplayData.messageData;
  const msgData = messages.find((msg) => {
    return msg.messageId === msgId;
  });
  return msgData;
};

const getMessageTemplate = (
  msgData: MessageData | undefined,
  msgActions: MessageActions
): JSX.Element => {
  if (!msgData) {
    return <></>;
  }
  const { template, data: props } = msgData;
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
  const startData = messageDisplayData;
  // Startup visibility
  const [visible, setVisible] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<JSX.Element>(<></>);
  const [style, setStyle] = React.useState<CSSProperties>();

  const hideMessage = (): void => {
    setVisible(false);
    setMessageSeen();
  };

  const showMessage = (msgId: string | null): void => {
    const actions: MessageActions = {
      close: hideMessage,
      viewChanges: (): void => showMessage(startData.messageToShow),
    };
    const messageData = getMessageData(msgId);
    const titleComponent = getMessageTemplate(messageData, actions);
    setStyle(messageData?.style);
    setTitle(titleComponent);
    setVisible(true);
  };

  useEffect(() => {
    const startupMessageSeen = getMessageSeen();
    if (startupMessageSeen === null) {
      showMessage(startData.defaultMessageId);
    } else if (startupMessageSeen !== startData.messageToShow) {
      showMessage(startData.messageToShow);
    }
  }, []);

  return (
    <div data-testid="startup-window">
      <Modal
        visible={visible}
        title={title}
        onClose={hideMessage}
        style={style}
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
