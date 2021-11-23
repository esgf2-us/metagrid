import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  QuestionCircleTwoTone,
} from '@ant-design/icons';
import React from 'react';
import { addTempStep } from '../../common/reactJoyrideSteps';
import ToolTip from '../DataDisplay/ToolTip';
import { NodeStatusArray, NodeStatusElement } from './types';

export type Props = {
  nodeStatus?: NodeStatusArray;
  dataNode: string;
  children?: React.ReactNode;
};

const StatusToolTip: React.FC<Props> = ({ nodeStatus, dataNode, children }) => {
  if (nodeStatus) {
    const node = (nodeStatus.find(
      (obj) => obj.name === dataNode
    ) as unknown) as NodeStatusElement;

    /* istanbul ignore else*/
    if (node) {
      const { isOnline, timestamp } = node;

      if (children) {
        return (
          <>
            {isOnline ? (
              <ToolTip
                title={
                  <>
                    Data Node:<div>{dataNode}</div>
                    Online as of:<div>{timestamp}</div>
                  </>
                }
                color="green"
              >
                <span>
                  <CheckCircleTwoTone
                    className={addTempStep('StatusToolTip', 42)}
                    twoToneColor="#52c41a"
                  />{' '}
                  {dataNode} {children}
                </span>
              </ToolTip>
            ) : (
              <ToolTip
                title={
                  <>
                    Data Node:<div>{dataNode}</div>
                    Offline as of:<div>{timestamp}</div>
                  </>
                }
                color="red"
              >
                <span>
                  <CloseCircleTwoTone
                    className={addTempStep('StatusToolTip', 60)}
                    twoToneColor="#eb2f96"
                  />{' '}
                  {dataNode} {children}
                </span>
              </ToolTip>
            )}
          </>
        );
      }

      return (
        <>
          {isOnline ? (
            <ToolTip
              title={
                <>
                  Data Node:<div>{dataNode}</div>
                  Online as of:<div>{timestamp}</div>
                </>
              }
              color="green"
            >
              <span>
                <CheckCircleTwoTone
                  className={addTempStep('StatusToolTip', 85)}
                  twoToneColor="#52c41a"
                />
              </span>
            </ToolTip>
          ) : (
            <ToolTip
              title={
                <>
                  Data Node:<div>{dataNode}</div>
                  Offline as of:<div>{timestamp}</div>
                </>
              }
              color="red"
            >
              <span>
                <CloseCircleTwoTone
                  className={addTempStep('StatusToolTip', 102)}
                  twoToneColor="#eb2f96"
                />
              </span>
            </ToolTip>
          )}
        </>
      );
    }
  }

  if (children) {
    return (
      <ToolTip
        title={
          <>
            Could not fetch status. Please contact support or try again later.
            Data Node:<div>{dataNode}</div>
          </>
        }
      >
        <span>
          <QuestionCircleTwoTone
            className={addTempStep('StatusToolTip', 125)}
          />{' '}
          {dataNode} {children}
        </span>
      </ToolTip>
    );
  }

  return (
    <ToolTip
      title={
        <>
          Could not fetch status. Please contact support or try again later.
          Data Node:<div>{dataNode}</div>
        </>
      }
    >
      <span>
        <QuestionCircleTwoTone className={addTempStep('StatusToolTip', 143)} />
      </span>
    </ToolTip>
  );
};

export default StatusToolTip;
