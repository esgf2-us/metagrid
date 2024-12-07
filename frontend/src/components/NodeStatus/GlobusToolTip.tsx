import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';

export type Props = {
  dataNode: string;
  children?: React.ReactNode;
};

export function globusEnabled(node: string | null | undefined): boolean {
  if (node) {
    return window.METAGRID.REACT_APP_GLOBUS_NODES.includes(node);
  }
  return false;
}

const GlobusToolTip: React.FC<React.PropsWithChildren<Props>> = ({ dataNode, children }) => {
  /* istanbul ignore else*/
  if (globusEnabled(dataNode)) {
    if (children) {
      return (
        <Tooltip
          title={
            <>
              Data Node:<div>{dataNode}</div>
              Globus Transfer Available
            </>
          }
          color="green"
        >
          <span>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
            {dataNode}
            {children}
          </span>
        </Tooltip>
      );
    }
    return (
      <Tooltip
        title={
          <>
            Data Node:<div>{dataNode}</div>
            Globus Transfer Available
          </>
        }
        color="green"
      >
        <span>
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        </span>
      </Tooltip>
    );
  }

  if (children) {
    return (
      <>
        <Tooltip
          title={
            <>
              Data Node:<div>{dataNode}</div>
              Globus Transfer Unavailable
            </>
          }
          color="red"
        >
          <span>
            <CloseCircleTwoTone twoToneColor="#eb2f96" /> {dataNode} {children}
          </span>
        </Tooltip>
      </>
    );
  }

  return (
    <>
      <Tooltip
        title={
          <>
            Data Node:<div>{dataNode}</div>
            Globus Transfer Unavailable
          </>
        }
        color="red"
      >
        <span>
          <CloseCircleTwoTone twoToneColor="#eb2f96" />
        </span>
      </Tooltip>
    </>
  );
};

export default GlobusToolTip;
