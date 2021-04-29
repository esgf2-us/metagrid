import { AutoComplete, Button, Divider, Popover, Tabs as TabsD } from 'antd';
import React from 'react';
import { objectHasKey, splitStringByChar } from '../../common/utils';
import qualityFlagsImg from '../../assets/img/climate_indicators_table.png';
import Citation from './Citation';
import FilesTable from './FilesTable';
import { RawSearchResult, TextInputs } from './types';
import { CSSinJS } from '../../common/types';

const styles: CSSinJS = {
  qualityFlagsRow: { display: 'flex' },
  flagColorBox: {
    width: '16px',
    height: '16px',
    backgroundColor: '#ccc',
    border: '1px',
    borderStyle: 'solid',
    borderColor: '#666',
    margin: '2px',
  },
};

export type Props = { record: RawSearchResult; filenameVars?: TextInputs | [] };

export type QualityFlagProps = { index: string; color: string };

export const QualityFlag: React.FC<QualityFlagProps> = ({ index, color }) => (
  <div
    data-testid={`qualityFlag${index}`}
    style={{ ...styles.flagColorBox, backgroundColor: color }}
  ></div>
);

const Tabs: React.FC<Props> = ({ record, filenameVars }) => {
  const metaData = Object.entries(record).map(([k, v]) => ({
    value: `${k}: ${v as string}`,
  }));

  // Have to parse and format since 'xlink' attribute is poorly structured
  // in the Search API
  const xlinkTypesToOutput: Record<
    string,
    { label: string; url: null | string }
  > = {
    pid: { label: 'PID', url: null },
    // Some technical notes are published as "summary"
    summary: { label: 'Technical Notes', url: null },
    supdata: { label: 'Supplemental Data', url: null },
    'Tech Note': { label: 'Technical Notes', url: null },
  };
  /* istanbul ignore else */
  if (objectHasKey(record, 'xlink')) {
    const { xlink } = record;

    (xlink as string[]).forEach((link) => {
      const [url, , linkType] = splitStringByChar(link, '|') as string[];

      if (Object.keys(xlinkTypesToOutput).includes(linkType)) {
        xlinkTypesToOutput[linkType].url = url;
      }
    });
  }

  // Have to parse and format since 'quality_control_flags' attribute is
  // poorly structured in the Search API
  const qualityFlags: Record<string, string> = {};
  /* istanbul ignore else */
  if (objectHasKey(record, 'quality_control_flags')) {
    const { quality_control_flags: qcFlags } = record;

    (qcFlags as string[]).forEach((flag) => {
      const [, key, color] = splitStringByChar(flag, ':') as string[];
      // Sometimes colors are snakecase, such as 'light_gray'
      qualityFlags[key] = color.replace('_', '');
    });
  }

  return (
    <TabsD>
      <TabsD.TabPane tab="Files" key="1">
        <FilesTable
          id={record.id}
          numResults={record.number_of_files}
          filenameVars={filenameVars}
        />
      </TabsD.TabPane>
      <TabsD.TabPane tab="Metadata" key="2">
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
        {Object.keys(record).map((key) => (
          <p key={key} style={{ margin: 0 }}>
            <span style={{ fontWeight: 'bold' }}>{key}</span>: {record[key]}
          </p>
        ))}
      </TabsD.TabPane>
      {objectHasKey(record, 'citation_url') && (
        <TabsD.TabPane tab="Citation" key="3">
          <Citation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            url={record.citation_url![0]}
          />
        </TabsD.TabPane>
      )}
      {Object.keys(xlinkTypesToOutput).length > 0 && (
        <TabsD.TabPane tab="Additional" key="4">
          {Object.keys(xlinkTypesToOutput).map((linkType) => {
            const { label, url } = xlinkTypesToOutput[linkType];
            if (url) {
              return (
                <Button type="link" href={url} target="_blank" key={label}>
                  <span>{label}</span>
                </Button>
              );
            }
            return null;
          })}
          {Object.keys(qualityFlags).length > 0 && (
            <Button
              type="link"
              href="https://esgf-node.llnl.gov/projects/obs4mips/DatasetIndicators"
              target="_blank"
            >
              <Popover
                placement="topLeft"
                content={
                  <img
                    src={qualityFlagsImg}
                    alt="Quality Flags Indicator"
                  ></img>
                }
              >
                <span style={styles.qualityFlagsRow}>
                  {Object.keys(qualityFlags).map((key) => (
                    <QualityFlag
                      index={key}
                      color={qualityFlags[key]}
                      key={key}
                    />
                  ))}
                </span>
              </Popover>
            </Button>
          )}
        </TabsD.TabPane>
      )}
    </TabsD>
  );
};

export default Tabs;
