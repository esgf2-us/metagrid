import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import ToolTip from '../DataDisplay/ToolTip';

export type Props = {
  globusEnabledNodes: string[];
  dataNode: string;
  children?: React.ReactNode;
};

const GlobusToolTip: React.FC<Props> = ({
  globusEnabledNodes,
  dataNode,
  children,
}) => {
  if (globusEnabledNodes) {
    const globusEnabled = globusEnabledNodes.includes(dataNode);

    /* istanbul ignore else*/
    if (globusEnabled) {
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
