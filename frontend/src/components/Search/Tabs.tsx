import { AutoComplete, Divider, Tabs as TabsD } from 'antd';
import React from 'react';
import { objectHasKey } from '../../common/utils';
import Citation from './Citation';
import FilesTable from './FilesTable';
import { RawSearchResult, TextInputs } from './types';

export type Props = { record: RawSearchResult; filenameVars?: TextInputs | [] };

const Tabs: React.FC<Props> = ({ record, filenameVars }) => {
  const metaData = Object.entries(record).map(([k, v]) => ({
    value: `${k}: ${v as string}`,
  }));

  return (
    <TabsD>
      <TabsD.TabPane tab="Metadata" key="1">
        <h4>Displaying {Object.keys(record).length} keys</h4>
        <AutoComplete
          style={{ width: '100%' }}
          options={metaData}
          placeholder="Lookup a key..."
          filterOption={(inputValue, option) =>
            (option as Record<'value', string>).value
              .toUpperCase()
              .indexOf(inputValue.toUpperCase()) !== -1
          }
        />
        <Divider />
        {Object.keys(record).map((key) => {
          return (
            <p key={key} style={{ margin: 0 }}>
              <span style={{ fontWeight: 'bold' }}>{key}</span>: {record[key]}
            </p>
          );
        })}
      </TabsD.TabPane>
      <TabsD.TabPane tab="Files" key="2">
        <FilesTable
          id={record.id}
          numResults={record.number_of_files}
          filenameVars={filenameVars}
        />
      </TabsD.TabPane>
      {objectHasKey(record, 'citation_url') && (
        <TabsD.TabPane tab="Citation" key="3">
          <Citation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            url={record.citation_url![0]}
          />
        </TabsD.TabPane>
      )}
    </TabsD>
  );
};

export default Tabs;
