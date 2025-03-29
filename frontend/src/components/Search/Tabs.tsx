import { AutoComplete, Button, Divider, Popover, Tabs as TabsD } from 'antd';
import React from 'react';
import { objectHasKey, splitStringByChar } from '../../common/utils';
import qualityFlagsImg from '../../assets/img/climate_indicators_table.png';
import Citation from './Citation';
import FilesTable from './FilesTable';
import { RawSearchResult, TextInputs } from './types';
import { CSSinJS } from '../../common/types';
import { innerDataRowTargets } from '../../common/reactJoyrideSteps';
import { checkIsStac } from '../../common/STAC';

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

type DisplayMetaData = {
  key: string;
  display: JSX.Element;
  value: string | string[] | DisplayMetaData[];
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

const buildDisplayData = (
  record: RawSearchResult
): { keys: string[]; displayData: DisplayMetaData[] } => {
  const displayData: DisplayMetaData[] = [];
  const keys: string[] = [];

  const buildElement = (key: string, title: string, value: unknown): JSX.Element => {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return (
        <div key={`top-${key}`}>
          <span style={{ fontWeight: 'bold' }}>{title}</span>:
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={`div-${key}-${subKey}`} style={{ margin: '0 0 0 15px' }}>
              {buildElement(`${key}-${subKey}`, subKey, subValue)}
            </div>
          ))}
        </div>
      );
    }
    if (Array.isArray(value)) {
      return (
        <div key={`top-${key}`} style={{ margin: 0 }}>
          <span style={{ fontWeight: 'bold' }}>{title}</span>:
          <ul
            key={`ul-${key}`}
            style={{
              margin: '0 0 0 15px',
              padding: 0,
              listStyle: 'none',
            }}
          >
            {value.map((item, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={idx}>{buildElement(`${key}-${idx}`, `${title}[${idx}]`, item)}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <p key={key} style={{ margin: 0 }}>
        <span style={{ fontWeight: 'bold' }}>{title}</span>: {String(value)}
      </p>
    );
  };

  const addValues = (
    key: string,
    title: string,
    value: unknown,
    array: DisplayMetaData[]
  ): void => {
    if (value && value !== 'null' && value !== null) {
      keys.push(key);
      const element = buildElement(key, title, value || 'test');
      if (typeof value !== 'object') {
        array.push({ key, display: element, value: String(value) });
      } else if (Array.isArray(value)) {
        const subMetaData: DisplayMetaData[] = [];
        value.forEach((item, idx) => {
          addValues(`${key}-${idx}`, `${title}[${idx}]`, item, subMetaData);
        });
        array.push({ key, display: element, value: subMetaData });
      } else {
        const subMetaData: DisplayMetaData[] = [];
        Object.entries(value).forEach(([subK, subV]) => {
          addValues(`${key}-${subK}`, subK, subV, subMetaData);
        });
        array.push({ key, display: element, value: subMetaData });
      }
    }
  };

  Object.entries(record).forEach(([key, value], idx) => {
    addValues(`${key}-${idx}`, key, value, displayData);
  });

  return { keys, displayData };
};

const Tabs: React.FC<React.PropsWithChildren<Props>> = ({ record, filenameVars }) => {
  const [metaDataDisplayed, setMetaDataDisplayed] = React.useState<DisplayMetaData[]>();

  const { keys, displayData } = buildDisplayData(record);

  React.useEffect(() => {
    setMetaDataDisplayed(displayData);
  }, [record]);

  // Handle selection of metadata
  const handleAutocompleteChange = (value: string): void => {
    if (value === '') {
      setMetaDataDisplayed(displayData);
      return;
    }
    const filteredKeys = keys.filter((item) => {
      return item.toUpperCase().indexOf(value.toUpperCase()) !== -1;
    });
    const filteredDisplayItems: DisplayMetaData[] = [];
    displayData.forEach((item) => {
      if (filteredKeys.includes(item.key)) {
        filteredDisplayItems.push(item);
      } else if (Array.isArray(item.value)) {
        item.value.forEach((val) => {
          if (typeof val !== 'string') {
            if (filteredKeys.includes(val.key)) {
              filteredDisplayItems.push(val);
            }
          }
        });
      }
    });

    setMetaDataDisplayed(filteredDisplayItems);
  };

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

  const showCitation = record.citation_url !== undefined && record.citation_url.length > 0;
  const showESDOC =
    record &&
    record.further_info_url !== undefined &&
    record.further_info_url.length > 0 &&
    record.further_info_url[0] !== '';
  const showQualityFlags = Object.keys(qualityFlags).length > 0;
  const showAdditionalLinks = urlCount > 0;
  const showAdditionalTab = showESDOC || showQualityFlags || showAdditionalLinks;

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
          stacRecord={checkIsStac(record) ? record : undefined}
        />
      ),
    },
    {
      key: '2',
      disabled: record.retracted === true,
      label: <div className={innerDataRowTargets.metadataTab.class()}>Metadata</div>,
      children: (
        <>
          <h4>Displaying {Object.keys(record).length} keys</h4>
          <AutoComplete
            style={{ width: '100%' }}
            className={innerDataRowTargets.metadataLookupField.class()}
            options={keys.map((item, idx) => ({
              key: idx,
              value: item,
            }))}
            placeholder="Lookup a key..."
            filterOption={
              /* istanbul ignore next */ (inputValue, option) => {
                return option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
              }
            }
            onChange={handleAutocompleteChange}
          />
          <Divider />
          {metaDataDisplayed &&
            metaDataDisplayed.map((item) => {
              return item.display;
            })}
        </>
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
          url={record.citation_url![0]}
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
          {showESDOC && ((record.further_info_url as unknown) as string)[0] !== '' && (
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
