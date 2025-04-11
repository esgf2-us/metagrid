import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import React from 'react';
import { useAtomValue } from 'jotai';
import nodeImg from '../../assets/img/nodes.svg';
import { CSSinJS } from '../../common/types';
import { NodeStatusArray } from './types';
import { lightModeGreen, lightModeRed, darkModeGreen, darkModeRed } from './StatusToolTip';
import { nodeStatusAtom, isDarkModeAtom } from '../../common/atoms';
import { nodeTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

const { Title } = Typography;
const styles: CSSinJS = {
  headerContainer: { display: 'flex', justifyContent: 'center' },
  summaryHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    margin: '1em',
    width: '25%',
  },
  statistic: { float: 'right' },
};

const NodeSummary: React.FC = () => {
  const nodeStatus = useAtomValue<NodeStatusArray>(nodeStatusAtom);
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  type NodeStat = number | string;

  let numNodes: NodeStat = 'N/A';
  let numOnline: NodeStat = 'N/A';
  let numOffline: NodeStat = 'N/A';

  if (nodeStatus && nodeStatus.length > 0) {
    numNodes = nodeStatus.length;
    numOnline = nodeStatus.reduce((acc, cur) => acc + Number(cur.isOnline), 0);
    numOffline = numNodes - numOnline;
  }

  let onlineCol = lightModeGreen;
  let offlineCol = lightModeRed;

  if (isDarkMode) {
    onlineCol = darkModeGreen;
    offlineCol = darkModeRed;
  }

  return (
    <div data-testid="summary" className={nodeTourTargets.nodeStatusSummary.class()}>
      <div style={styles.headerContainer}>
        <img style={styles.image} src={nodeImg} alt="Node" />
      </div>

      <Title level={3} style={styles.summaryHeader}>
        Node Status Summary
      </Title>

      <Divider />
      <Title level={3}>
        Number of Nodes:{' '}
        <span style={styles.statistic} data-testid="numNodes">
          {numNodes}
        </span>
      </Title>
      <Title level={3}>
        Online <CheckCircleTwoTone twoToneColor={onlineCol} />:
        <span style={styles.statistic} data-testid="numOnline">
          {numOnline}
        </span>
      </Title>
      <Title level={3}>
        Offline <CloseCircleTwoTone twoToneColor={offlineCol} />:
        <span style={styles.statistic} data-testid="numOffline">
          {numOffline}
        </span>
      </Title>
      <Divider />
    </div>
  );
};

export default NodeSummary;
