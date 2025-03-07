import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import React from 'react';
import { Tooltip } from 'antd';
import { useRecoilState } from 'recoil';
import { isDarkModeAtom } from '../App/recoil/atoms';
import { lightModeGreen, lightModeRed, darkModeGreen, darkModeRed } from './StatusToolTip';

export type Props = { dataNode: string };

const GlobusToolTip: React.FC<Props> = ({ dataNode }) => {
  const isEnabled = window.METAGRID.GLOBUS_NODES.includes(dataNode);
  const [isDarkMode] = useRecoilState<boolean>(isDarkModeAtom);

  const enabledColor = isDarkMode ? darkModeGreen : lightModeGreen;
  const disabledColor = isDarkMode ? darkModeRed : lightModeRed;

  let title = 'Globus Transfer Unavailable';
  let color = disabledColor;
  let icon = <CloseCircleTwoTone twoToneColor={disabledColor} />;

  if (isEnabled) {
    title = 'Globus Transfer Available';
    color = enabledColor;
    icon = <CheckCircleTwoTone twoToneColor={enabledColor} />;
  }

  return (
    <Tooltip
      color={color}
      title={
        <>
          Data Node:<div>{dataNode}</div>
          {title}
        </>
      }
    >
      <span>{icon}</span>
    </Tooltip>
  );
};

export default GlobusToolTip;
