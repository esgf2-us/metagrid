import { Tag as TagD } from 'antd';
import React from 'react';

export type TagType = string | { [key: string]: string } | [string, string];

const styles = {
  tag: { height: '2em' },
};

type Props = {
  value: TagType;
  onClose?: (value: TagType, type: string) => void;
  closable?: boolean;
  type: string;
  color?: string;
};

export const Tag: React.FC<Props> = ({
  value,
  onClose,
  closable = true,
  type,
  color,
  children,
}) => {
  return (
    <TagD
      style={styles.tag}
      closable={closable}
      onClose={onClose ? () => onClose(value, type) : undefined}
      color={color}
    >
      {children}
    </TagD>
  );
};
