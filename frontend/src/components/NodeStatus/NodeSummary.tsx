import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Divider } from 'antd';
import React from 'react';
import nodeImg from '../../assets/img/nodes.svg';
import { nodeTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import { NodeStatusArray } from './types';

const styles: CSSinJS = {
  headerContainer: { display: 'flex', justifyContent: 'center' },
  summaryHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: { margin: '1em', width: '25%' },
  statistic: { float: 'right' },
};

export type Props = {
  nodeStatus?: NodeStatusArray;
};

const NodeSummary: React.FC<Props> = ({ nodeStatus }) => {
  type NodeStat = number | string;

  let numNodes: NodeStat = 'N/A';
  let numOnline: NodeStat = 'N/A';
  let numOffline: NodeStat = 'N/A';

  if (nodeStatus) {
    numNodes = nodeStatus.length;
    numOnline = nodeStatus.reduce((acc, cur) => acc + Number(cur.isOnline), 0);
    numOffline = numNodes - numOnline;
  }

  return (
    <div
      data-testid="summary"
      className={nodeTourTargets.getClass('nodeStatusSummary')}
    >
      <div style={styles.headerContainer}>
        <img style={styles.image} src={nodeImg} alt="Node" />
      </div>

      <h1 style={styles.summaryHeader}>Node Status Summary</h1>

      <Divider />
      <h1>
        Number of Nodes:{' '}
        <span style={styles.statistic} data-testid="numNodes">
          {numNodes}
        </span>
      </h1>
      <h1>
        Online <CheckCircleTwoTone twoToneColor="#52c41a" />:
        <span style={styles.statistic} data-testid="numOnline">
          {numOnline}
        </span>
      </h1>
      <h1>
        Offline <CloseCircleTwoTone twoToneColor="#eb2f96" />:
        <span style={styles.statistic} data-testid="numOffline">
          {numOffline}
        </span>
      </h1>
      <Divider />
    </div>
  );
};

export default NodeSummary;
