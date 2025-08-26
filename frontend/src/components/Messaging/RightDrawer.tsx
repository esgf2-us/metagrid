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
    ...messageDataJSON.messages.map((message, idx) => {
      return {
        key: idx,
        label: message.title,
        children: <MessageCard fileName={message.fileName} />,
      };
    }),
    {
      key: messageDataJSON.messages.length,
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
      <Collapse defaultActiveKey={[0]} items={panels} accordion />
    </Drawer>
  );
};

export default RightDrawer;
