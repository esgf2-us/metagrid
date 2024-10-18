import React from 'react';
import { Drawer, Space, Button, Collapse, Card } from 'antd';
import { rightDrawerChanges, rightDrawerMessages } from './messageDisplayData';
import MessageCard from './MessageCard';
import { MarkdownMessage } from './types';

export type Props = {
  open: boolean;
  onClose: () => void;
};

const RightDrawer: React.FC<React.PropsWithChildren<Props>> = ({
  open,
  onClose,
}) => {
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
          defaultActiveKey={[rightDrawerMessages[0].fileName]}
          items={rightDrawerMessages.map((message: MarkdownMessage) => {
            return {
              key: message.fileName,
              label: message.title,
              children: (
                <MessageCard
                  title={message.title}
                  fileName={message.fileName}
                />
              ),
            };
          })}
        />
      </Card>
      <Card title="Metagrid Version History">
        <Collapse
          items={rightDrawerChanges.map((change: MarkdownMessage) => {
            return {
              key: change.fileName,
              label: change.title,
              children: (
                <MessageCard title={change.title} fileName={change.fileName} />
              ),
            };
          })}
        />
      </Card>
    </Drawer>
  );
};

export default RightDrawer;
