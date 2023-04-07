import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import startupDisplayData, { StartPopupData } from '../startupDisplayData';

export type ChangeLogProps = {
  changeList: string[];
};

const ChangeLogTemplate: React.FC<ChangeLogProps> = ({ changeList }) => {
  const startup: StartPopupData = startupDisplayData;
  return (
    <>
      <h1>Latest Changes: {startup.latestVersion}</h1>
      <h2>Change Log</h2>
      <ol>
        {changeList.map((item: string) => {
          const key = uuidv4();
          return <li key={key}>{item}</li>;
        })}
      </ol>

      <h3>Documentation</h3>
      <p style={{ fontSize: '14px' }}>
        To view the latest documentation and FAQ, please visit this page:
        <br />
        <a
          href=" https://esgf.github.io/esgf-user-support/metagrid.html"
          rel="noopener noreferrer"
          target="_blank"
        >
          https://esgf.github.io/esgf-user-support/metagrid.html
        </a>
      </p>
    </>
  );
};

export default ChangeLogTemplate;
