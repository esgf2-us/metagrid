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
      <Collapse defaultActiveKey={['1']}>
        <Collapse.Panel header="Metagrid Messages" key="1">
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
        </Collapse.Panel>
        <Collapse.Panel header="Metagrid Version History" key="2">
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
        </Collapse.Panel>
      </Collapse>
    </Drawer>
  );
};

export default RightDrawer;
