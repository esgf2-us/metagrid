import { CheckCircleTwoTone, CloseCircleTwoTone, QuestionCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';
import { useRecoilValue } from 'recoil';
import { NodeStatusArray, NodeStatusElement } from './types';
import { isDarkModeAtom, nodeStatusAtom } from '../App/recoil/atoms';

export type Props = {
  dataNode: string;
  children?: React.ReactNode;
};

export const darkModeGreen = '#1a8011';
export const darkModeRed = '#8c0e14';

export const lightModeGreen = '#52c41a';
export const lightModeRed = '#eb2f38';

const StatusToolTip: React.FC<React.PropsWithChildren<Props>> = ({ dataNode, children }) => {
  const nodeStatus = useRecoilValue<NodeStatusArray>(nodeStatusAtom);
  const isDarkMode = useRecoilValue<boolean>(isDarkModeAtom);

  let onlineCol = lightModeGreen;
  let offlineCol = lightModeRed;

  if (isDarkMode) {
    onlineCol = darkModeGreen;
    offlineCol = darkModeRed;
  }

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
                color={onlineCol}
              >
                <span>
                  <CheckCircleTwoTone twoToneColor={onlineCol} /> {dataNode} {children}
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
                color={offlineCol}
              >
                <span>
                  <CloseCircleTwoTone twoToneColor={offlineCol} /> {dataNode} {children}
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
              color={onlineCol}
            >
              <span>
                <CheckCircleTwoTone twoToneColor={onlineCol} />
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
              color={offlineCol}
            >
              <span>
                <CloseCircleTwoTone twoToneColor={offlineCol} />
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
            Could not fetch status. Please contact support or try again later. Data Node:
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
          Could not fetch status. Please contact support or try again later. Data Node:
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
