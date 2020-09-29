import { Divider } from 'antd';
import React from 'react';
import cartImg from '../../assets/img/cart.svg';
import folderImg from '../../assets/img/folder.svg';
import { CSSinJS } from '../../common/types';
import { formatBytes } from '../../common/utils';
import { RawSearchResult, RawSearchResults } from '../Search/types';
import { UserCart } from './types';

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
  userCart: UserCart | [];
};

const Summary: React.FC<Props> = ({ userCart }) => {
  let numFiles = 0;
  let totalDataSize = '0';
  if (userCart.length > 0) {
    numFiles = (userCart as RawSearchResults).reduce(
      (acc: number, dataset: RawSearchResult) => acc + dataset.number_of_files,
      0
    );

    const rawDataSize = (userCart as RawSearchResults).reduce(
      (acc: number, dataset: RawSearchResult) => acc + dataset.size,
      0
    );
    totalDataSize = formatBytes(rawDataSize);
  }

  return (
    <div data-testid="summary">
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
    </div>
  );
};

export default Summary;
