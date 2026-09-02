import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import {
  lightModeGreen,
  lightModeRed,
  darkModeGreen,
  darkModeRed,
} from '../NodeStatus/StatusToolTip';
import { isDarkModeAtom } from '../../common/atoms';
import { topDataRowTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

export type Props = { dataNode: string; stacGlobusAvailable?: boolean };

const GlobusToolTip: React.FC<Props> = ({ dataNode, stacGlobusAvailable }) => {
  const isEnabled = window.METAGRID.GLOBUS_NODES.includes(dataNode);
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const enabledColor = isDarkMode ? darkModeGreen : lightModeGreen;
  const disabledColor = isDarkMode ? darkModeRed : lightModeRed;

  let title = 'Globus Transfer Unavailable';
  let color = disabledColor;
  let icon = <CloseCircleTwoTone twoToneColor={disabledColor} />;

  if (isEnabled || stacGlobusAvailable) {
    title = 'Globus Transfer Available';
    color = enabledColor;
    icon = <CheckCircleTwoTone twoToneColor={enabledColor} />;
  }

  return (
    <Tooltip
      color={color}
      title={
        <>
          {dataNode && (
            <>
              Data Node:<div>{dataNode}</div>
            </>
          )}
          {title}
        </>
      }
    >
      <span className={topDataRowTargets.globusReadyStatusIcon.class()}>{icon}</span>
    </Tooltip>
  );
};

export default GlobusToolTip;
