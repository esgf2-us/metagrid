import React from 'react';
import { Tag as TagD } from 'antd';

const styles = {
  tag: { height: '2em' },
};

type Props = {
  value: string | { [key: string]: string } | (number | string)[];
  onClose?: (
    value: string | { [key: string]: string } | (number | string)[],
    type: string
  ) => void;
  closable?: boolean;
  type: string;
  color?: string;
};

const Tag: React.FC<Props> = ({
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

export default Tag;
