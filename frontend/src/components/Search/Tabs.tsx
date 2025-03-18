import { AutoComplete, Button, Divider, Popover, Tabs as TabsD } from 'antd';
import React from 'react';
import { useRecoilValue } from 'recoil';
import { objectHasKey, splitStringByChar } from '../../common/utils';
import qualityFlagsImg from '../../assets/img/climate_indicators_table.png';
import Citation from './Citation';
import FilesTable from './FilesTable';
import { RawSearchResult, RawSTACSearchResult, TextInputs } from './types';
import { CSSinJS } from '../../common/types';
import { innerDataRowTargets } from '../../common/reactJoyrideSteps';
import { isSTACmodeAtom } from '../App/recoil/atoms';
import FilesTableSTAC from './FilesTableSTAC';

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

export type Props = {
  record: RawSearchResult | RawSTACSearchResult;
  filenameVars?: TextInputs | [];
};

export type QualityFlagProps = { index: string; color: string };

export const QualityFlag: React.FC<
  React.PropsWithChildren<QualityFlagProps>
> = /* istanbul ignore next */ ({ index, color }) => (
  <div
    data-testid={`qualityFlag${index}`}
    style={{ ...styles.flagColorBox, backgroundColor: color }}
  ></div>
);

const Tabs: React.FC<React.PropsWithChildren<Props>> = ({ record, filenameVars }) => {
  const useSTAC = useRecoilValue<boolean>(isSTACmodeAtom);

  const metaData: { key: string; value: string }[] = [];

  Object.entries(record).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        const value = { key: `${idx}-${item}`, value: `${idx}: ${item}` };
        metaData.push(value);
      });

      return { key: k, value: `${k}:` };
    }

    if (typeof v === 'object') {
      if (v) {
        Object.entries(v).forEach(([k2, v2]) => {
          const value = { key: `${k}-${k2}`, value: `${k2}: ${v2}` };
          metaData.push(value);
        });
      }

      return { key: k, value: `${k}:` };
    }

    if (typeof v === 'string') {
      return { key: k, value: `${k}: ${v}` };
    }

    return { key: k, value: `${k}: ${v as string}` };
  });

  // Have to parse and format since 'xlink' attribute is poorly structured
  // in the Search API
  const xlinkTypesToOutput: Record<string, { label: string; url: null | string }> = {
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
    objectHasKey(record, 'further_info_url') && (record.further_info_url as string)[0] !== '';
  const showQualityFlags = Object.keys(qualityFlags).length > 0;
  const showAdditionalLinks = urlCount > 0;
  const showAdditionalTab = showESDOC || showQualityFlags || showAdditionalLinks;

  let numberOfFiles = 0;
  if (useSTAC) {
    const { assets } = record as RawSTACSearchResult;
    Object.keys(assets).forEach((key) => {
      const asset = assets[key];
      if (asset.type === 'application/netcdf') {
        numberOfFiles += 1;
      }
    });
  } else {
    numberOfFiles = record.number_of_files as number;
  }

  let citationUrl = '';
  if (useSTAC) {
    const { properties } = record as RawSTACSearchResult;
    if (properties.citation_url) {
      citationUrl = properties.citation_url;
    }
  } else if ((record as RawSearchResult).citation_url) {
    citationUrl = record.citation_url as string;
  }

  let furtherInfoUrl = '';
  if (useSTAC) {
    const { properties } = record as RawSTACSearchResult;
    if (properties.further_info_url) {
      furtherInfoUrl = properties.further_info_url;
    }
  } else if ((record as RawSearchResult).further_info_url) {
    furtherInfoUrl = record.further_info_url as string;
  }

  const tabList = [
    {
      key: '1',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.filesTab.class()}>Files</div>,
      children: useSTAC ? (
        <FilesTableSTAC inputRecord={record as RawSTACSearchResult} />
      ) : (
        <FilesTable id={record.id} numResults={numberOfFiles} filenameVars={filenameVars} />
      ),
    },
    {
      key: '2',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.metadataTab.class()}>Metadata</div>,
      children: (
        <div key={record.id}>
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
          {Object.entries(record).map(([k, v]) => {
            if (k === 'assets') {
              return null;
            }
            if (typeof v === 'object') {
              if (v !== null && v !== undefined) {
                return (
                  <div key={k}>
                    <p style={{ margin: 0 }}>
                      <span style={{ fontWeight: 'bold' }}>{k}</span>:
                    </p>
                    <ol style={{ margin: 0, listStyleType: 'none' }}>
                      {Object.entries(v).map((item) => {
                        const newKey = `${k}-${item[0]}`;
                        return (
                          <li key={newKey}>
                            <span style={{ fontWeight: 'bold' }}>{item[0]}</span>:{' '}
                            {JSON.stringify(item[1])}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              }
            }

            if (typeof v === 'string') {
              return (
                <p key={k} style={{ margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>{k}</span>: {v}
                </p>
              );
            }

            return (
              <p key={k} style={{ margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>{k}</span>: {JSON.stringify(v)}
              </p>
            );
          })}
        </div>
      ),
    },
  ];

  if (showCitation) {
    tabList.push({
      key: '3',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.citationTab.class()}>Citation</div>,
      children: (
        <Citation
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          url={citationUrl}
        />
      ),
    });
  }

  if (showAdditionalTab) {
    tabList.push({
      key: '4',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.additionalTab.class()}>Additional</div>,
      children: (
        <>
          {showAdditionalLinks && additionalLinks}
          {showESDOC && furtherInfoUrl !== '' && (
            <Button
              type="link"
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              href={furtherInfoUrl}
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
                content={<img src={qualityFlagsImg} alt="Quality Flags Indicator"></img>}
              >
                <span style={styles.qualityFlagsRow}>
                  {Object.keys(qualityFlags).map((key) => (
                    <QualityFlag index={key} color={qualityFlags[key]} key={key} />
                  ))}
                </span>
              </Popover>
            </Button>
          )}
        </>
      ),
    });
  }

  return <TabsD activeKey={record.retracted === true ? '2' : undefined} items={tabList} />;
};

export default Tabs;
