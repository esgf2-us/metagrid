import { AutoComplete, Button, Divider, Popover, Tabs as TabsD } from 'antd';
import React from 'react';
import { objectHasKey, splitStringByChar } from '../../common/utils';
import qualityFlagsImg from '../../assets/img/climate_indicators_table.png';
import Citation from './Citation';
import FilesTable from './FilesTable';
import { RawSearchResult, TextInputs } from './types';
import { CSSinJS } from '../../common/types';
import { innerDataRowTargets } from '../../common/reactJoyrideSteps';

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

export const QualityFlag: React.FC<
  React.PropsWithChildren<QualityFlagProps>
> = /* istanbul ignore next */ ({ index, color }) => (
  <div
    data-testid={`qualityFlag${index}`}
    style={{ ...styles.flagColorBox, backgroundColor: color }}
  ></div>
);

const Tabs: React.FC<React.PropsWithChildren<Props>> = ({
  record,
  filenameVars,
}) => {
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
      /* istanbul ignore else */
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

  let urlCount = 0;
  const additionalLinks = Object.keys(xlinkTypesToOutput).map((linkType) => {
    const { label, url } = xlinkTypesToOutput[linkType];
    if (url) {
      urlCount += 1;
      return (
        <Button type="link" href={url} target="_blank" key={label}>
          <span>{label}</span>
        </Button>
      );
    }
    return null;
  });

  const showCitation = objectHasKey(record, 'citation_url');
  const showESDOC =
    objectHasKey(record, 'further_info_url') &&
    ((record.further_info_url as unknown) as string)[0] !== '';
  const showQualityFlags = Object.keys(qualityFlags).length > 0;
  const showAdditionalLinks = urlCount > 0;
  const showAdditionalTab =
    showESDOC || showQualityFlags || showAdditionalLinks;

  const tabList = [
    {
      key: '1',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.filesTab.class()}>Files</div>,
      children: (
        <FilesTable
          id={record.id}
          numResults={record.number_of_files}
          filenameVars={filenameVars}
        />
      ),
    },
    {
      key: '2',
      disabled: record.retracted === true,
      label: (
        <div className={innerDataRowTargets.metadataTab.class()}>Metadata</div>
      ),
      children: (
        <>
          <h4>Displaying {Object.keys(record).length} keys</h4>
          <AutoComplete
            style={{ width: '100%' }}
            className={innerDataRowTargets.metadataLookupField.class()}
            options={metaData}
            placeholder="Lookup a key..."
            filterOption={
              /* istanbul ignore next */ (inputValue, option) =>
                (option as Record<'value', string>).value
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
            }
          />
          <Divider />
          {Object.keys(record).map((key) => (
            <p key={key} style={{ margin: 0 }}>
              <span style={{ fontWeight: 'bold' }}>{key}</span>:{' '}
              {String(record[key])}
            </p>
          ))}
        </>
      ),
    },
  ];

  if (showCitation) {
    tabList.push({
      key: '3',
      disabled: record.retracted === true,
      label: (
        <div className={innerDataRowTargets.citationTab.class()}>Citation</div>
      ),
      children: (
        <Citation
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          url={record.citation_url![0]}
        />
      ),
    });
  }

  if (showAdditionalTab) {
    tabList.push({
      key: '4',
      disabled: record.retracted === true,
      label: (
        <div className={innerDataRowTargets.additionalTab.class()}>
          Additional
        </div>
      ),
      children: (
        <>
          {showAdditionalLinks && additionalLinks}
          {showESDOC &&
            ((record.further_info_url as unknown) as string)[0] !== '' && (
              <Button
                type="link"
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                href={record.further_info_url![0]}
                target="_blank"
              >
                ES-DOC
              </Button>
            )}
          {showQualityFlags && (
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
        </>
      ),
    });
  }

  return (
    <TabsD
      activeKey={record.retracted === true ? '2' : undefined}
      items={tabList}
    />
  );
  // Disable all tabs excep metadata if the record is retracted
  /* <TabsD activeKey={record.retracted === true ? '2' : undefined} />;
  <TabsD.TabPane
        disabled={record.retracted === true}
        tab={<div className={innerDataRowTargets.filesTab.class()}>Files</div>}
        key="1"
      >
        <FilesTable
          id={record.id}
          numResults={record.number_of_files}
          filenameVars={filenameVars}
        />
      </TabsD.TabPane>
  <TabsD.TabPane
        tab={
          <div className={innerDataRowTargets.metadataTab.class()}>
            Metadata
          </div>
        }
        key="2"
      >
        <h4>Displaying {Object.keys(record).length} keys</h4>
        <AutoComplete
          style={{ width: '100%' }}
          className={innerDataRowTargets.metadataLookupField.class()}
          options={metaData}
          placeholder="Lookup a key..."
          filterOption={
            /* istanbul ignore next  (inputValue, option) =>
              (option as Record<'value', string>).value
                .toUpperCase()
                .indexOf(inputValue.toUpperCase()) !== -1
          }
        />
        <Divider />
        {Object.keys(record).map((key) => (
          <p key={key} style={{ margin: 0 }}>
            <span style={{ fontWeight: 'bold' }}>{key}</span>:{' '}
            {String(record[key])}
          </p>
        ))}
      </TabsD.TabPane>
  {showCitation && (
        <TabsD.TabPane
          disabled={record.retracted === true}
          tab={
            <div className={innerDataRowTargets.citationTab.class()}>
              Citation
            </div>
          }
          key="3"
        >
          <Citation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            url={record.citation_url![0]}
          />
        </TabsD.TabPane>
      )}
  {showAdditionalTab && (
        <TabsD.TabPane
          disabled={record.retracted === true}
          tab={
            <div className={innerDataRowTargets.additionalTab.class()}>
              Additional
            </div>
          }
          key="4"
        >
          {showAdditionalLinks && additionalLinks}
          {showESDOC &&
            ((record.further_info_url as unknown) as string)[0] !== '' && (
              <Button
                type="link"
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                href={record.further_info_url![0]}
                target="_blank"
              >
                ES-DOC
              </Button>
            )}
          {showQualityFlags && (
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
      )}*/
};

export default Tabs;
