import React from 'react';
import { Tooltip } from 'antd';
import { DownCircleOutlined, RightCircleOutlined } from '@ant-design/icons';
import { RawSearchResult } from './types';

export interface TableExpandIconProps {
  prefixCls?: string;
  expanded: boolean;
  onExpand: (record: RawSearchResult, e: React.MouseEvent<HTMLElement>) => void;
  record: RawSearchResult;
  expandable: boolean;
  contractClass?: string;
  expandClass?: string;
}

const TableExpandIcon: React.FC<TableExpandIconProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prefixCls: _prefixCls,
  expanded,
  onExpand,
  record,
  expandable,
  contractClass = /* istanbul ignore next */ '',
  expandClass = /* istanbul ignore next */ '',
}) => {
  /* istanbul ignore if -- @preserve */
  if (!expandable) return null;

  return expanded ? (
    <DownCircleOutlined className={contractClass} onClick={(e) => onExpand(record, e)} />
  ) : (
    <Tooltip title="View details" trigger="hover">
      <RightCircleOutlined className={expandClass} onClick={(e) => onExpand(record, e)} />
    </Tooltip>
  );
};

export default TableExpandIcon;
