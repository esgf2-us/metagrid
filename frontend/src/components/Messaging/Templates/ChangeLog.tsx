import React from 'react';
import { TemplateProps, ChangeLogData } from '../types';
import MessageCard from '../MessageCard';

const ChangeLogTemplate: React.FC<React.PropsWithChildren<TemplateProps>> = ({
  templateData,
}) => {
  const props: ChangeLogData = templateData as ChangeLogData;
  return (
    <>
      <h1 data-testid="changelogTemplate">
        New with Metagrid v{props.version}
      </h1>
      <div style={{ maxHeight: '650px', overflow: 'auto' }}>
        {props.changesFile && (
          <MessageCard fileName={props.changesFile} title=""></MessageCard>
        )}
      </div>
    </>
  );
};

export default ChangeLogTemplate;
