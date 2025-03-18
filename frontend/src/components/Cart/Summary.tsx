import React from 'react';
import { Card, Collapse, Divider, List, Typography } from 'antd';
import { useRecoilState, useRecoilValue } from 'recoil';
import Button from '../General/Button';
import cartImg from '../../assets/img/cart.svg';
import folderImg from '../../assets/img/folder.svg';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import { formatBytes } from '../../common/utils';
import { RawSearchResult, RawSearchResults } from '../Search/types';
import { UserCart } from './types';
import { GlobusTaskItem } from '../Globus/types';
import { globusTaskItemsAtom } from '../Globus/recoil/atom';
import { cartItemSelectionsAtom } from './recoil/atoms';

const styles: CSSinJS = {
  headerContainer: { display: 'flex', justifyContent: 'center' },
  summaryHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: { margin: '1em', width: '25%' },
  statistic: { float: 'right' },
  taskListContainer: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
};

export type Props = {
  userCart: UserCart;
};

const { Title, Link } = Typography;

const Summary: React.FC<React.PropsWithChildren<Props>> = ({ userCart }) => {
  const cartItems = useRecoilValue<RawSearchResults>(cartItemSelectionsAtom);
  const [taskItems, setTaskItems] = useRecoilState<GlobusTaskItem[]>(globusTaskItemsAtom);

  let numSelectedFiles = 0;
  let totalSelectedDataSize = '0';
  if (cartItems.length > 0) {
    numSelectedFiles = cartItems.reduce(
      (acc: number, dataset: RawSearchResult) => acc + (dataset.number_of_files || 0),
      0
    );

    const rawDataSize = cartItems.reduce(
      (acc: number, dataset: RawSearchResult) => acc + (dataset.size || 0),
      0
    );
    totalSelectedDataSize = formatBytes(rawDataSize);
  }

  let numFiles = 0;
  let totalDataSize = '0';
  if (userCart.length > 0) {
    numFiles = userCart.reduce(
      (acc: number, dataset: RawSearchResult) => acc + (dataset.number_of_files || 0),
      0
    );

    const rawDataSize = userCart.reduce(
      (acc: number, dataset: RawSearchResult) => acc + (dataset.size || 0),
      0
    );
    totalDataSize = formatBytes(rawDataSize);
  }

  const clearAllTasks = (): void => {
    setTaskItems([]);
  };

  return (
    <div data-testid="summary" className={cartTourTargets.cartSummary.class()}>
      <div style={styles.headerContainer}>
        <img style={styles.image} src={cartImg} alt="Cart" />
        <img style={styles.image} src={folderImg} alt="Folder" />
      </div>

      <Title level={3} style={styles.summaryHeader}>
        Your Cart Summary
      </Title>

      <Divider />

      <Title level={4}>
        Total Number of Datasets: <span style={styles.statistic}>{userCart.length}</span>
      </Title>
      <Title level={4}>
        Total Number of Files: <span style={styles.statistic}>{numFiles}</span>
      </Title>
      <Title level={4}>
        Total Cart File Size: <span style={styles.statistic}>{totalDataSize}</span>
      </Title>

      <Divider />

      <Title level={4}>
        Selected Number of Datasets: <span style={styles.statistic}>{cartItems.length}</span>
      </Title>
      <Title level={4}>
        Selected Number of Files: <span style={styles.statistic}>{numSelectedFiles}</span>
      </Title>
      <Title level={4}>
        Selected Files Size: <span style={styles.statistic}>{totalSelectedDataSize}</span>
      </Title>
      <Divider />

      {taskItems.length > 0 && (
        <>
          <Collapse
            items={[
              {
                key: '1',
                label: (
                  <Title level={5} style={{ margin: 0 }}>
                    Task Submit History
                    <Button size="small" danger style={{ float: 'right' }} onClick={clearAllTasks}>
                      <span data-testid="clear-all-submitted-globus-tasks">Clear All</span>
                    </Button>
                  </Title>
                ),
                children: (
                  <List
                    itemLayout="vertical"
                    dataSource={taskItems}
                    style={styles.taskListContainer}
                    renderItem={(task) => (
                      <List.Item key={task.taskId} style={{ padding: '5px' }}>
                        <Card size="small">
                          <List.Item.Meta
                            title={`Submitted: ${task.submitDate}`}
                            description={
                              <Link href={task.taskStatusURL} target="_blank" rel="noreferrer">
                                View Task In Globus
                              </Link>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  );
};

export default Summary;
