import React from 'react';
import { TemplateProps, ChangeLogData } from '../types';
import MessageCard from '../MessageCard';

const ChangeLogTemplate: React.FC<TemplateProps> = ({ templateData }) => {
  const props: ChangeLogData = templateData as ChangeLogData;
  return (
    <>
      <h1>What&apos;s New with Metagrid v{props.version}</h1>
      <p style={{ maxHeight: '650px', overflow: 'auto' }}>
        {props.changesFile && (
          <MessageCard fileName={props.changesFile} title=""></MessageCard>
        )}
      </p>
    </>
  );
};

export default ChangeLogTemplate;
