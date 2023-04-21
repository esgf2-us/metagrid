import React from 'react';
import { Drawer, Space, Button, Collapse } from 'antd';
import { markdownMessages } from './messageDisplayData';
import MessageCard from './MessageCard';

export type Props = {
  visible: boolean;
  onClose: () => void;
};

const RightDrawer: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Drawer
      title="Notifications"
      placement="right"
      width={500}
      onClose={onClose}
      visible={visible}
      footer={
        <Space>
          <Button type="primary" onClick={onClose}>
            Hide
          </Button>
        </Space>
      }
    >
      <Collapse defaultActiveKey={[markdownMessages[0].fileName]}>
        {markdownMessages.map((message) => {
          return (
            <Collapse.Panel key={message.fileName} header={message.title}>
              <MessageCard title={message.title} fileName={message.fileName} />
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </Drawer>
  );
};

export default RightDrawer;
