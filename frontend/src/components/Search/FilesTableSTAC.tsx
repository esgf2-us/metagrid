import { DownCircleOutlined, DownloadOutlined, RightCircleOutlined } from '@ant-design/icons';
import { Table as TableD, Tooltip } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { TablePaginationConfig } from 'antd/lib/table';
import React from 'react';
import { openDownloadURL } from '../../api';
import { innerDataRowTargets } from '../../common/reactJoyrideSteps';
import Button from '../General/Button';
import { FeatureAssetSTAC, Pagination, RawSTACSearchResult } from './types';

export type DownloadUrls = {
  HTTPServer: string;
  OPENDAP: string;
};

export type Props = {
  inputRecord: RawSTACSearchResult;
};

const FilesTableSTAC: React.FC<React.PropsWithChildren<Props>> = ({ inputRecord }) => {
  const [paginationOptions, setPaginationOptions] = React.useState<Pagination>({
    page: 1,
    pageSize: 5,
  });

  const handlePageChange = (page: number, pageSize: number): void => {
    setPaginationOptions({ page, pageSize });
  };

  const handlePageSizeChange = (pageSize: number): void => {
    setPaginationOptions({ page: 1, pageSize });
  };

  // Add options to this constant as needed.
  // This variable populates the download drop downs and is used in conditionals.
  const metadataKeysToDisplay = ['name', 'description', 'href', 'type'];

  const { assets } = inputRecord;
  let numberOfFiles = 0;
  Object.keys(assets).forEach((key) => {
    if (assets[key].type === 'application/netcdf') {
      numberOfFiles += 1;
    }
  });

  const tableConfig = {
    dataSource: Object.values(assets),
    size: 'small' as SizeType,
    scroll: { y: 1000 },
    rowKey: (stacFile: FeatureAssetSTAC) => {
      return `${inputRecord.id}-${stacFile.name}`;
    },
    pagination: {
      total: numberOfFiles,
      position: ['bottomCenter'],
      options: [
        {
          label: '5 / page',
          value: '5',
        },
        {
          label: '10 / page',
          value: '10',
        },
        {
          label: '15 / page',
          value: '15',
        },
      ],
      showSizeChanger: {
        optionRender: (option) => {
          return <span data-testid={`pageSize-option-${option.value}`}>{option.label}</span>;
        },
      },
      onChange: (page: number, pageSize: number) => handlePageChange(page, pageSize),
      onShowSizeChange: (_current: number, size: number) => handlePageSizeChange(size),
      pageSize: paginationOptions.pageSize,
      current: paginationOptions.page,
    } as TablePaginationConfig,
    expandable: {
      expandedRowRender: (record: FeatureAssetSTAC) =>
        Object.keys(record).map((key) => {
          if (metadataKeysToDisplay.includes(key)) {
            return (
              <p key={`${record.name}-${key}`} style={{ margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>{key}</span>: {record[key] as string}
              </p>
            );
          }
          return null;
        }),

      expandIcon: ({
        expanded,
        onExpand,
        record,
      }: {
        expanded: boolean;
        onExpand: (
          rowRecord: FeatureAssetSTAC,
          e: React.MouseEvent<HTMLSpanElement, MouseEvent>
        ) => void;
        record: FeatureAssetSTAC;
      }): React.ReactElement =>
        expanded ? (
          <DownCircleOutlined onClick={(e) => onExpand(record, e)} />
        ) : (
          <Tooltip title="View this file's metadata" trigger="hover">
            <RightCircleOutlined onClick={(e) => onExpand(record, e)} />
          </Tooltip>
        ),
    },
  };

  const columns = [
    {
      title: 'File Title',
      dataIndex: 'name',
      size: 400,
      key: 'title',
      render: (title: string) => {
        return <div className={innerDataRowTargets.filesTitle.class()}>{title}</div>;
      },
    },
    {
      title: 'Download URL',
      key: 'assets',
      width: 200,
      render: (asset: FeatureAssetSTAC) => {
        return (
          <Tooltip key={asset.name} title="Download the data file via Http." trigger="hover">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => openDownloadURL(asset.href)}
            />
          </Tooltip>
        );
      },
    },
  ];

  return (
    <TableD
      data-testid="filesTable"
      {...tableConfig}
      columns={columns}
      onRow={(record, rowIndex) => {
        return {
          id: `search-items-row-${rowIndex}`,
          'data-testid': `search-items-row-${rowIndex}`,
        };
      }}
    />
  );
};

export default FilesTableSTAC;
