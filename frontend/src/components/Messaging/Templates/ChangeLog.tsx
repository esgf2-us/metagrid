import React from 'react';
import { Card } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { TemplateProps, ChangeLogData } from '../types';

const ChangeLogTemplate: React.FC<TemplateProps> = ({ templateData }) => {
  const props: ChangeLogData = templateData as ChangeLogData;
  return (
    <>
      <h1>What&apos;s New with Metagrid</h1>
      <p>{props.intro}</p>
      <h3>Version {props.version} Changes:</h3>
      <Card style={{ maxHeight: '120px', overflow: 'auto' }}>
        <ol>
          {props.changeList.map((item: string) => {
            const key = uuidv4();
            return <li key={key}>{item}</li>;
          })}
        </ol>
      </Card>
      <br />
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
