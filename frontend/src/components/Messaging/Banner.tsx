import React, { useState } from 'react';
import { Tag } from 'antd';
import { CloseSquareTwoTone } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { isDarkModeAtom } from '../../common/atoms';
import { darkModeRed, lightModeRed } from '../NodeStatus/StatusToolTip';
import { showBanner, saveBannerText } from '../../common/utils';

const Banner: React.FC = () => {
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [isVisible, setIsVisible] = useState(showBanner());
  const bannerText = window.METAGRID.BANNER_TEXT;

  if (!isVisible) {
    return <></>;
  }

  return (
    <Tag style={{ width: '100%', marginBottom: '10px' }}>
      <h2>
        <CloseSquareTwoTone
          twoToneColor={isDarkMode ? darkModeRed : lightModeRed}
          style={{ fontSize: '20px' }}
          onClick={() => {
            setIsVisible(false);
            // Save the banner text so it doesn't show again
            saveBannerText();
          }}
        />{' '}
        {bannerText}
      </h2>
    </Tag>
  );
};

export default Banner;
