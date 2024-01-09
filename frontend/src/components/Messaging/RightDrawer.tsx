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
        <Collapse defaultActiveKey={[rightDrawerMessages[0].fileName]}>
          {rightDrawerMessages.map((message: MarkdownMessage) => {
            return (
              <Collapse.Panel key={message.fileName} header={message.title}>
                <MessageCard
                  title={message.title}
                  fileName={message.fileName}
                />
              </Collapse.Panel>
            );
          })}
        </Collapse>
      </Card>
      <Card title="Metagrid Version History">
        <Collapse>
          {rightDrawerChanges.map((change: MarkdownMessage) => {
            return (
              <Collapse.Panel key={change.fileName} header={change.title}>
                <MessageCard title={change.title} fileName={change.fileName} />
              </Collapse.Panel>
            );
          })}
        </Collapse>
      </Card>
    </Drawer>
  );
};

export default RightDrawer;
