import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';

const enabledMode = {
  color: 'green',
  title: 'Globus Transfer Available',
  icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
};

const disabledMode = {
  color: 'red',
  title: 'Globus Transfer Unavailable',
  icon: <CloseCircleTwoTone twoToneColor="#eb2f96" />,
};

export type Props = { dataNode: string };

const GlobusToolTip: React.FC<Props> = ({ dataNode }) => {
  const mode = window.METAGRID.GLOBUS_NODES.includes(dataNode) ? enabledMode : disabledMode;

  return (
    <Tooltip
      color={mode.color}
      title={
        <>
          Data Node:<div>{dataNode}</div>
          {mode.title}
        </>
      }
    >
      <span>{mode.icon}</span>
    </Tooltip>
  );
};

export default GlobusToolTip;
