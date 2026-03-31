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
  contractClass,
  expandClass,
}) => {
  /* istanbul ignore if -- @preserve */
  if (!expandable) return null;

  /* istanbul ignore next -- @preserve */
  const contractCls = contractClass ?? '';
  /* istanbul ignore next -- @preserve */
  const expandCls = expandClass ?? '';

  return expanded ? (
    <DownCircleOutlined className={contractCls} onClick={(e) => onExpand(record, e)} />
  ) : (
    <Tooltip title="View details" trigger="hover">
      <RightCircleOutlined className={expandCls} onClick={(e) => onExpand(record, e)} />
    </Tooltip>
  );
};

export default TableExpandIcon;
