import React from 'react';
import { Card, Collapse, Divider, List } from 'antd';
import { useRecoilState } from 'recoil';
import Button from '../General/Button';
import cartImg from '../../assets/img/cart.svg';
import folderImg from '../../assets/img/folder.svg';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import { formatBytes } from '../../common/utils';
import { RawSearchResult, RawSearchResults } from '../Search/types';
import { UserCart } from './types';
import { GlobusTaskItem } from '../Globus/types';
import GlobusStateKeys, { globusTaskItems } from '../Globus/recoil/atom';
import { saveSessionValue } from '../../api';

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
  userCart: UserCart | [];
};

const Summary: React.FC<React.PropsWithChildren<Props>> = ({ userCart }) => {
  const [taskItems, setTaskItems] = useRecoilState<GlobusTaskItem[]>(
    globusTaskItems
  );

  let numFiles = 0;
  let totalDataSize = '0';
  if (userCart.length > 0) {
    numFiles = (userCart as RawSearchResults).reduce(
      (acc: number, dataset: RawSearchResult) =>
        acc + (dataset.number_of_files || 0),
      0
    );

    const rawDataSize = (userCart as RawSearchResults).reduce(
      (acc: number, dataset: RawSearchResult) => acc + (dataset.size || 0),
      0
    );
    totalDataSize = formatBytes(rawDataSize);
  }

  const clearAllTasks = (): void => {
    setTaskItems([]);
    saveSessionValue(GlobusStateKeys.globusTaskItems, []);
  };

  return (
    <div data-testid="summary" className={cartTourTargets.cartSummary.class()}>
      <div style={styles.headerContainer}>
        <img style={styles.image} src={cartImg} alt="Cart" />
        <img style={styles.image} src={folderImg} alt="Folder" />
      </div>

      <h1 style={styles.summaryHeader}>Your Cart Summary</h1>

      <Divider />

      <h1>
        Number of Datasets:{' '}
        <span style={styles.statistic}>{userCart.length}</span>
      </h1>
      <h1>
        Number of Files: <span style={styles.statistic}>{numFiles}</span>
      </h1>
      <h1>
        Total File Size: <span style={styles.statistic}>{totalDataSize}</span>
      </h1>
      <Divider />

      {taskItems.length > 0 && (
        <>
          <Collapse
            items={[
              {
                key: '1',
                label: (
                  <h3 style={{ margin: 0 }}>
                    Task Submit History
                    <Button
                      size="small"
                      danger
                      style={{ float: 'right' }}
                      onClick={clearAllTasks}
                    >
                      Clear All
                    </Button>
                  </h3>
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
                              <a
                                href={task.taskStatusURL}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Task In Globus
                              </a>
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
