import { Tag, Tooltip } from 'antd';
import React from 'react';
import { ClickableFacetConfig } from '../Facets/types';

type Props = {
  value: string;
  clickableConfig?: ClickableFacetConfig;
  closable?: boolean;
  onClose?: () => void;
  onMouseDown?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  count?: number | null;
  color?: string;
  style?: React.CSSProperties;
};

/**
 * A reusable component for rendering facet tags with optional clickable links and counts.
 * Used in both facet dropdowns and the search results filter display.
 */
const FacetTag: React.FC<Props> = ({
  value,
  clickableConfig,
  closable = true,
  onClose,
  onMouseDown,
  count,
  color,
  style = { marginRight: 3 },
}) => {
  const renderContent = () => {
    if (clickableConfig) {
      const url = clickableConfig.urlTemplate.replace('{value}', String(value).toLowerCase());
      return (
        <Tooltip title={`View ${value} documentation`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1890ff',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        </Tooltip>
      );
    }
    return value;
  };

  return (
    <Tag
      onMouseDown={onMouseDown}
      closable={closable}
      onClose={onClose}
      color={color}
      style={style}
    >
      {renderContent()}
      {count !== null && count !== undefined && <span> ({count})</span>}
    </Tag>
  );
};

export default FacetTag;
