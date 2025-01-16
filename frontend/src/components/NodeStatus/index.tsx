import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Alert, Table as TableD } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import React from 'react';
import { ResponseError } from '../../api';
import apiRoutes from '../../api/routes';
import { nodeTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import { NodeStatusArray, NodeStatusElement } from './types';

const styles = { headerContainer: { margin: '12px' } } as CSSinJS;

export type Props = {
  nodeStatus?: NodeStatusArray;
  apiError?: ResponseError;
  isLoading: boolean;
};

const NodeStatus: React.FC<React.PropsWithChildren<Props>> = ({
  nodeStatus,
  apiError,
  isLoading,
}) => {
  // If the API returns a response but there is no data, that means the feature
  // is disabled
  const featureIsDisabled = nodeStatus && nodeStatus.length === 0;

  if (isLoading) {
    return (
      <>
        <TableD
          title={() => (
            <div style={styles.headerContainer}>
              <h1>Fetching latest node status...</h1>
            </div>
          )}
          loading={isLoading}
          data-testid="nodeStatusTable"
          size="small"
        />
      </>
    );
  }

  /* istanbul ignore else */
  if (nodeStatus && !featureIsDisabled) {
    // Since the timestamp is the same for all node objects, use the first one
    const { timestamp } = nodeStatus[0];

    const columns = [
      {
        title: <div className={nodeTourTargets.nodeColHeader.class()}>Node</div>,
        dataIndex: 'name',
        align: 'center' as const,
        sortDirections: ['descend'] as SortOrder[],
        sorter: (a: NodeStatusElement, b: NodeStatusElement) => a.name.localeCompare(b.name),
      },
      {
        title: <div className={nodeTourTargets.onlineColHeader.class()}>Online</div>,
        dataIndex: 'isOnline',
        align: 'center' as const,
        width: 50,
        sortDirections: ['descend', 'ascend'] as SortOrder[],
        sorter: (a: NodeStatusElement, b: NodeStatusElement) =>
          String(a.isOnline).localeCompare(String(b.isOnline)),
        render: (isOnline: boolean) =>
          isOnline ? (
            <>
              <CheckCircleTwoTone twoToneColor="#52c41a" /> Yes
            </>
          ) : (
            <>
              <CloseCircleTwoTone twoToneColor="#eb2f96" /> No
            </>
          ),
      },
      {
        title: 'Source (THREDDS Catalog)',
        dataIndex: 'source',
        render: (source: string) => (
          <a
            className={nodeTourTargets.sourceColHeader.class()}
            href={source}
            target="_blank"
            rel="noopener noreferrer"
          >
            Link
          </a>
        ),
      },
    ];

    return (
      <div data-testid="node-status">
        <TableD
          title={() => (
            <div style={styles.headerContainer}>
              <h1 className={nodeTourTargets.updateTime.class()}>Status as of {timestamp}</h1>
              <p>
                The status is automatically refreshed every five minutes. You can also manually
                refresh your browser for the latest update.
              </p>
              <p>If you are attempting to download data hosted on an offline server, you can:</p>
              <ol>
                <li>Try to find a replica dataset</li>
                <li>Wait until the node is back online</li>
                <li>Contact support if the node is offline for more than a day</li>
              </ol>
            </div>
          )}
          data-testid="nodeStatusTable"
          size="small"
          pagination={{
            pageSize: 100,
            position: ['bottomCenter'],
          }}
          columns={columns}
          dataSource={nodeStatus}
          rowKey="name"
        />
      </div>
    );
  }

  let errorMsg: string;

  if (apiError) {
    errorMsg = 'Node status information is currently unavailable.';
  } else if (featureIsDisabled) {
    errorMsg =
      'This feature is not enabled on this node or status information is currently unavailable.';
  } else {
    errorMsg = apiRoutes.nodeStatus.handleErrorMsg('generic');
  }

  return (
    <>
      <TableD
        title={() => <Alert message={errorMsg} type="error" />}
        data-testid="nodeStatusTable"
        size="small"
        rowKey="name"
      />
    </>
  );
};

export default NodeStatus;
