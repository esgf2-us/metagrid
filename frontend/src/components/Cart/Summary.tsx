import { Divider } from 'antd';
import React from 'react';
import cartImg from '../../assets/img/cart.svg';
import folderImg from '../../assets/img/folder.svg';
import { formatBytes } from '../../utils/utils';

const styles = {
  headerContainer: { display: 'flex', justifyContent: 'center' },
  summaryHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  } as React.CSSProperties,
  image: { margin: '1em', width: '25%' },
  statistic: { float: 'right' } as React.CSSProperties,
};

export type Props = {
  cart: Cart | [];
};

const Summary: React.FC<Props> = ({ cart }) => {
  let numFiles = 0;
  let totalDataSize = '0';
  if (cart.length > 0) {
    numFiles = (cart as RawSearchResult[]).reduce(
      (acc: number, dataset: RawSearchResult) => acc + dataset.number_of_files,
      0
    );

    const rawDataSize = (cart as RawSearchResult[]).reduce(
      (acc: number, dataset: RawSearchResult) => acc + dataset.size,
      0
    );
    totalDataSize = formatBytes(rawDataSize);
  }

  return (
    <div data-testid="summary">
      <div style={styles.headerContainer}>
        <img style={styles.image} src={cartImg as string} alt="Cart" />
        <img style={styles.image} src={folderImg as string} alt="Folder" />
      </div>

      <h1 style={styles.summaryHeader}>Your Cart Summary</h1>

      <Divider />
      <h1>
        Number of Datasets: <span style={styles.statistic}>{cart.length}</span>
      </h1>
      <h1>
        Number of Files: <span style={styles.statistic}>{numFiles}</span>
      </h1>
      <h1>
        Total File Size: <span style={styles.statistic}>{totalDataSize}</span>
      </h1>
      <Divider />
    </div>
  );
};

export default Summary;
