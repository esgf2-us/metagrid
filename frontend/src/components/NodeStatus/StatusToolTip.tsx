import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  QuestionCircleTwoTone,
} from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';
import { NodeStatusArray, NodeStatusElement } from './types';

export type Props = {
  nodeStatus?: NodeStatusArray;
  dataNode: string;
  children?: React.ReactNode;
};

const StatusToolTip: React.FC<React.PropsWithChildren<Props>> = ({
  nodeStatus,
  dataNode,
  children,
}) => {
  if (nodeStatus) {
    const node = (nodeStatus.find((obj) =>
      obj.name.includes(dataNode)
    ) as unknown) as NodeStatusElement;

    /* istanbul ignore else*/
    if (node) {
      const { isOnline, timestamp } = node;

      if (children) {
        return (
          <>
            {isOnline ? (
              <Tooltip
                title={
                  <>
                    Data Node:<div>{dataNode}</div>
                    Online as of:<div>{timestamp}</div>
                  </>
                }
                color="green"
              >
                <span>
                  <CheckCircleTwoTone twoToneColor="#52c41a" /> {dataNode}{' '}
                  {children}
                </span>
              </Tooltip>
            ) : (
              <Tooltip
                title={
                  <>
                    Data Node:<div>{dataNode}</div>
                    Offline as of:<div>{timestamp}</div>
                  </>
                }
                color="red"
              >
                <span>
                  <CloseCircleTwoTone twoToneColor="#eb2f96" /> {dataNode}{' '}
                  {children}
                </span>
              </Tooltip>
            )}
          </>
        );
      }

      return (
        <>
          {isOnline ? (
            <Tooltip
              title={
                <>
                  Data Node:<div>{dataNode}</div>
                  Online as of:<div>{timestamp}</div>
                </>
              }
              color="green"
            >
              <span>
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              </span>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                <>
                  Data Node:<div>{dataNode}</div>
                  Offline as of:<div>{timestamp}</div>
                </>
              }
              color="red"
            >
              <span>
                <CloseCircleTwoTone twoToneColor="#eb2f96" />
              </span>
            </Tooltip>
          )}
        </>
      );
    }
  }

  if (children) {
    return (
      <Tooltip
        title={
          <>
            Could not fetch status. Please contact support or try again later.
            Data Node:
            <div>{dataNode}</div>
          </>
        }
      >
        <span>
          <QuestionCircleTwoTone /> {dataNode} {children}
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={
        <>
          Could not fetch status. Please contact support or try again later.
          Data Node:
          <div>{dataNode}</div>
        </>
      }
    >
      <span>
        <QuestionCircleTwoTone />
      </span>
    </Tooltip>
  );
};

export default StatusToolTip;
