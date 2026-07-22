import React from 'react';
import { Modal, Table, Empty, Badge, Tag, Alert, Button } from 'antd';
import { BellOutlined, PlusCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { formatBytes } from '../../common/utils';
import { ChangedDataset, ChangeType, UserSearchQuery } from './types';

export type ChangesDialogProps = {
  open: boolean;
  onClose: () => void;
  searchQuery: UserSearchQuery;
  changedDatasets: ChangedDataset[];
  lastCheckedTime?: number | null;
};

const ChangesDialog: React.FC<ChangesDialogProps> = ({
  open,
  onClose,
  searchQuery,
  changedDatasets,
  lastCheckedTime,
}) => {
  const hasChanges = changedDatasets.length > 0;

  const columns: TableColumnsType<ChangedDataset> = [
    {
      title: 'Status',
      key: 'changeType',
      dataIndex: 'changeType',
      width: 100,
      render: (changeType: ChangeType) => {
        if (changeType === 'new') {
          return (
            <Badge
              status="success"
              text={
                <Tag color="green" icon={<PlusCircleOutlined />}>
                  New
                </Tag>
              }
            />
          );
        }
        return (
          <Badge
            status="processing"
            text={
              <Tag color="blue" icon={<SyncOutlined />}>
                Updated
              </Tag>
            }
          />
        );
      },
      filters: [
        { text: 'New', value: 'new' },
        { text: 'Updated', value: 'updated' },
      ],
      onFilter: (value, record) => record.changeType === value,
    },
    {
      title: 'Dataset ID',
      key: 'id',
      dataIndex: 'id',
      ellipsis: true,
      width: 250,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{id}</span>
      ),
    },
    {
      title: 'Version',
      key: 'version',
      dataIndex: 'version',
      width: 120,
      render: (version: string | number | undefined, record: ChangedDataset) => {
        if (record.changeType === 'updated' && record.previousVersion) {
          return (
            <div>
              <div style={{ textDecoration: 'line-through', color: '#999' }}>
                {record.previousVersion}
              </div>
              <div style={{ color: '#52c41a', fontWeight: 'bold' }}>{version}</div>
            </div>
          );
        }
        return <span>{version || 'N/A'}</span>;
      },
    },
    {
      title: 'Size',
      key: 'size',
      dataIndex: 'size',
      width: 100,
      render: (size: number | undefined) => (size ? formatBytes(size) : 'N/A'),
    },
    {
      title: 'Files',
      key: 'numberOfFiles',
      dataIndex: 'numberOfFiles',
      width: 80,
      render: (count: number | undefined) => (count ? count.toLocaleString() : 'N/A'),
    },
  ];

  const getEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No changes detected</p>
          <p style={{ fontSize: '14px', color: '#8c8c8c' }}>
            {lastCheckedTime
              ? `Last checked: ${new Date(lastCheckedTime).toLocaleString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}`
              : 'This feature is not yet configured. Change tracking will be enabled in a future update.'}
          </p>
        </div>
      }
    />
  );

  return (
    <Modal
      title={
        <>
          <BellOutlined style={{ marginRight: '8px' }} />
          Dataset Changes for Search #{searchQuery.uuid.slice(0, 8)}
        </>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ marginBottom: '16px' }}>
        <Alert
          message={
            hasChanges
              ? `${changedDatasets.length} dataset${changedDatasets.length !== 1 ? 's have' : ' has'} changed`
              : 'No changes detected'
          }
          description={
            hasChanges
              ? `Changes detected since ${lastCheckedTime ? new Date(lastCheckedTime).toLocaleString() : 'last check'}`
              : undefined
          }
          type={hasChanges ? 'info' : 'success'}
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div style={{ fontSize: '14px', marginBottom: '16px' }}>
          <strong>Project:</strong> {searchQuery.project.fullName}
        </div>
      </div>

      {hasChanges ? (
        <Table
          columns={columns}
          dataSource={changedDatasets}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} changed datasets`,
          }}
          expandable={{
            expandedRowRender: (record: ChangedDataset) => {
              if (record.changeType === 'updated' && record.changes) {
                return (
                  <div style={{ padding: '12px', background: '#fafafa' }}>
                    <strong>Changes detected:</strong>
                    <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                      {record.changes.map((change) => (
                        <li key={`${record.id}-${change.field}`}>
                          <strong>{change.field}:</strong>{' '}
                          <span style={{ textDecoration: 'line-through', color: '#999' }}>
                            {change.oldValue}
                          </span>
                          {' → '}
                          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                            {change.newValue}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            },
            rowExpandable: (record) =>
              record.changeType === 'updated' &&
              record.changes !== undefined &&
              record.changes.length > 0,
          }}
        />
      ) : (
        getEmptyState()
      )}
    </Modal>
  );
};

export default ChangesDialog;
