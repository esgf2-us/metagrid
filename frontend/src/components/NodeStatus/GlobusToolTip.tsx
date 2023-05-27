import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import ToolTip from '../DataDisplay/ToolTip';
import { globusEnabledNodes } from '../../env';

export type Props = {
  dataNode: string;
  children?: React.ReactNode;
};

export function globusEnabled(node: string | null | undefined): boolean {
  if (node) {
    return globusEnabledNodes.includes(node);
  }
  return false;
}

const GlobusToolTip: React.FC<Props> = ({ dataNode, children }) => {
  /* istanbul ignore else*/
  if (globusEnabled(dataNode)) {
    if (children) {
      return (
        <ToolTip
          title={
            <>
              Data Node:<div>{dataNode}</div>
              Globus Download Available
            </>
          }
          color="green"
        >
          <span>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
            {dataNode}
            {children}
          </span>
        </ToolTip>
      );
    }
    return (
      <ToolTip
        title={
          <>
            Data Node:<div>{dataNode}</div>
            Globus Download Available
          </>
        }
        color="green"
      >
        <span>
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        </span>
      </ToolTip>
    );
  }

  if (children) {
    return (
      <>
        <ToolTip
          title={
            <>
              Data Node:<div>{dataNode}</div>
              Globus Download Unavailable
            </>
          }
          color="red"
        >
          <span>
            <CloseCircleTwoTone twoToneColor="#eb2f96" /> {dataNode} {children}
          </span>
        </ToolTip>
      </>
    );
  }

  return (
    <>
      <ToolTip
        title={
          <>
            Data Node:<div>{dataNode}</div>
            Globus Download Unavailable
          </>
        }
        color="red"
      >
        <span>
          <CloseCircleTwoTone twoToneColor="#eb2f96" />
        </span>
      </ToolTip>
    </>
  );
};

export default GlobusToolTip;
