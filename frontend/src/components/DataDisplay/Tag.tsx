import { Tag as TagD } from 'antd';
import React from 'react';

export type TagValue = string | { [key: string]: string } | [string, string];
export type TagType = 'filenameVar' | 'text' | 'facet' | 'close all';

const styles = {
  tag: { height: '2em' },
};

type Props = {
  value: TagValue;
  onClose?: (value: TagValue, type: TagType) => void;
  closable?: boolean;
  type: TagType;
  color?: string;
};

export const Tag: React.FC<React.PropsWithChildren<Props>> = ({
  value,
  onClose,
  closable = true,
  type,
  color,
  children,
}) => (
  <TagD
    style={styles.tag}
    closable={closable}
    onClose={onClose ? () => onClose(value, type) : undefined}
    color={color}
  >
    {children}
  </TagD>
);
