import { Drawer, Space, Button } from 'antd';
import React from 'react';

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
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Drawer>
  );
};

export default RightDrawer;
