import React from 'react';
import { Drawer, Space, Button, Collapse, Card } from 'antd';
import { changeLogMessages, messageDataJSON } from './messageDisplayData';
import MessageCard from './MessageCard';
import { MessageData } from './types';

export type Props = {
  open: boolean;
  onClose: () => void;
};

const RightDrawer: React.FC<React.PropsWithChildren<Props>> = ({ open, onClose }) => {
  return (
    <Drawer
      title="Notifications"
      placement="right"
      width={500}
      onClose={onClose}
      open={open}
      footer={
        <Space>
          <Button type="primary" onClick={onClose}>
            Hide
          </Button>
        </Space>
      }
    >
      <Card title="Metagrid Messages">
        <Collapse
          defaultActiveKey={[messageDataJSON.messages[0].fileName]}
          items={messageDataJSON.messages.map((message) => {
            return {
              key: message.fileName,
              label: message.title,
              children: <MessageCard fileName={message.fileName} />,
            };
          })}
        />
      </Card>
      <Card title="Metagrid Version History">
        <Collapse
          items={changeLogMessages().map((change: MessageData) => {
            return {
              key: change.fileName,
              label: change.messageId,
              children: <MessageCard fileName={change.fileName} />,
            };
          })}
        />
      </Card>
    </Drawer>
  );
};

export default RightDrawer;
