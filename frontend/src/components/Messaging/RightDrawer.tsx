import React from 'react';
import { Drawer, Space, Button, Collapse } from 'antd';
import { changeLogMessages, messageDataJSON } from './messageDisplayData';
import MessageCard from './MessageCard';
import { MessageData } from './types';

export type Props = {
  open: boolean;
  onClose: () => void;
};

const RightDrawer: React.FC<React.PropsWithChildren<Props>> = ({ open, onClose }) => {
  const panels = [
    {
      key: '1',
      label: 'Metagrid Messages',
      children: (
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
      ),
    },
    {
      key: '2',
      label: 'Metagrid Version History',
      children: (
        <Collapse
          defaultActiveKey={[]}
          items={changeLogMessages().map((change: MessageData) => {
            return {
              key: change.fileName,
              label: change.messageId,
              children: <MessageCard fileName={change.fileName} />,
            };
          })}
        />
      ),
    },
  ];

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
      <Collapse defaultActiveKey={['1']} items={panels} accordion />
    </Drawer>
  );
};

export default RightDrawer;
