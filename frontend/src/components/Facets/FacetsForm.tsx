import {
  CopyOutlined,
  InfoCircleOutlined,
  // RightCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Tooltip,
  RadioChangeEvent,
  message,
  Space,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';

import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { CSSinJS } from '../../common/types';
import Button from '../General/Button';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import { ActiveSearchQuery, ResultType, VersionType } from '../Search/types';
import { ActiveFacets, ParsedFacets } from './types';
import { objectIsEmpty, showError, showNotice } from '../../common/utils';
import {
  activeSearchQueryAtom,
  availableFacetsAtom,
  currentProjectAtom,
  currentRequestQueryAtom,
} from '../../common/atoms';
import { leftSidebarTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { getAggregationsList, stringifyApiRequest } from '../../common/STAC';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

const styles: CSSinJS = {
  container: {
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  facetCount: { float: 'right' },
  formTitle: { fontWeight: 'bold', textTransform: 'capitalize' },
  applyBtn: { marginBottom: '12px' },
  collapseContainer: { marginTop: '5px' },
};

// Used to control text length of the drop-down items
// Tooltip is shown if the length is above this threshold
const maxItemLength = 75;

/**
 * Converts facet names from snake_case to human readable.
 *
 * It also checks for acronyms to convert to uppercase.
 */
export const humanizeFacetNames = (str: string): string => {
  const acronyms = ['Id', 'Cf', 'Cmor', 'Mip', 'Rcm', 'Pft'];
  const frags = str.split('_');

  for (let i = 0; i < frags.length; i += 1) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);

    if (acronyms.includes(frags[i])) {
      frags[i] = frags[i].toUpperCase();
    }
  }

  return frags.join(' ');
};

export const formatDate = (date: string | Dayjs, toString: boolean): string | Dayjs => {
  const format = 'YYYYMMDD';

  if (toString) {
    return dayjs(date).format(format);
  }
  return dayjs(date, format);
};

export const generateStacFacetOptions = (
  facet: string,
  facetOptions: string[],
): { key: string; value: string; label: JSX.Element }[] => {
  return facetOptions.map((variable) => {
    let optionOutput: string | React.ReactElement = <div>{variable}</div>;

    // If the option output name is very long, use a tooltip
    const varLength = variable.toString().length;
    /* istanbul ignore next -- @preserve */
    if (varLength >= maxItemLength) {
      const innerTitle = variable[0].substring(0, maxItemLength - varLength);
      optionOutput = (
        <Tooltip styles={{ body: { width: 'max-content' } }} title={variable}>
          {innerTitle}...
        </Tooltip>
      );
    }

    return {
      key: variable,
      value: variable,
      label: <span data-testid={`${facet}_${variable}`}>{optionOutput}</span>,
    };
  });
};

export const generateFacetOptions = (
  facet: string,
  facetOptions: [string, number][] | string[],
): { key: string; value: string; label: JSX.Element }[] => {
  /* istanbul ignore next -- @preserve */
  if (facetOptions.length > 0 && typeof facetOptions[0] === 'string') {
    return generateStacFacetOptions(facet, facetOptions as string[]);
  }

  return facetOptions
    .filter((variable) => {
      // Filter out invalid entries - must have string name and valid count
      return (
        variable &&
        variable.length >= 2 &&
        typeof variable[0] === 'string' &&
        variable[1] !== undefined
      );
    })
    .map((variable) => {
      let optionOutput: string | React.ReactNode = (
        <>
          {variable[0]}
          <span style={styles.facetCount}>({variable[1]})</span>
        </>
      );

      // If the option output name is very long, use a tooltip
      const vLength = variable[0].length - 2;
      const cLength = variable[1].toString().length * 1.5 + 2;
      /* istanbul ignore next -- @preserve */
      if (vLength > maxItemLength - cLength) {
        const innerTitle = variable[0].substring(0, maxItemLength - cLength);
        optionOutput = (
          <Tooltip styles={{ body: { width: 'max-content' } }} title={variable[0]}>
            {innerTitle}...
            <span style={styles.facetCount}>({variable[1]})</span>
          </Tooltip>
        );
      }

      // The data node facet has a unique tooltip overlay to show the status of the highlighted node
      if (facet === 'data_node') {
        optionOutput = (
          <StatusToolTip dataNode={variable[0]}>
            <span style={styles.facetCount}>({variable[1]})</span>
          </StatusToolTip>
        );
      }
      return {
        key: variable[0],
        value: variable[0],
        label: <span data-testid={`${facet}_${variable[0]}`}>{optionOutput}</span>,
      };
    });
};

const FacetsForm: React.FC = () => {
  // Global states
  const [activeSearchQuery, setActiveSearchQuery] =
    useAtom<ActiveSearchQuery>(activeSearchQueryAtom);

  const currentProject = useAtomValue(currentProjectAtom);
  const currentRequestURL = useAtomValue(currentRequestQueryAtom);

  // Local variables
  const [messageApi, contextHolder] = message.useMessage();

  // const [filenameVarForm] = Form.useForm();
  // const [filenameVars, setFilenameVars] = React.useState<string>('');
  const [generalFacetsForm] = Form.useForm();
  const [availableFacetsForm] = Form.useForm();
  const [keywordSearchForm] = Form.useForm();
  const [globusReadyOnly, setGlobusReadyOnly] = React.useState(false);

  // Manually handles the state of individual dropdowns to capture all selected
  // options as an array, rather than using the Form component to handle form
  // changes. If the form handles changes, auto-filtering occurs for each single
  // option selected, which results in the user not being able to select multiple
  // options in a single instance. In this case, auto-filtering is performed after
  // the dropdown closes, therefore allowing the user to filter using multiple options.
  const [activeDropdownValue, setActiveDropdownValue] = React.useState<
    [string, string[] | []] | null
  >(null);
  const [dropdownIsOpen, setDropdownIsOpen] = React.useState<boolean>(false);

  // Handles the expand and collapse all feature of the facets panels
  const [expandAll, setExpandAll] = React.useState<boolean>(true);

  const [activePanels, setActivePanels] = React.useState<string[]>([]);
  // Controls the additional_properties and keyword-search Collapse panels
  const [secondaryActivePanels, setSecondaryActivePanels] = React.useState<string[]>([]);

  const [keywordSearch, setKeywordSearch] = React.useState('');

  const availableFacets: ParsedFacets = useAtomValue(availableFacetsAtom) as ParsedFacets;

  type DatePickerReturnType = [null, null] | [Dayjs, null] | [null, Dayjs] | [Dayjs, Dayjs];

  const facetsByGroup = activeSearchQuery.project.facetsByGroup as {
    [key: string]: string[];
  };

  // Convert using moment.js to for the initial value of the date picker
  const { minVersionDate, maxVersionDate, minCreatedDate, maxCreatedDate } = activeSearchQuery;
  const initialVersionDateRange = [
    minVersionDate ? formatDate(minVersionDate, false) : (minVersionDate as null),
    maxVersionDate ? formatDate(maxVersionDate, false) : (maxVersionDate as null),
  ];
  // Created dates use ISO format, not YYYYMMDD
  const initialCreatedDateRange = [
    minCreatedDate ? dayjs(minCreatedDate) : (minCreatedDate as null),
    maxCreatedDate ? dayjs(maxCreatedDate) : (maxCreatedDate as null),
  ];

  // Generate aggregations query string for STAC projects
  const aggregationsQueryString = useMemo(() => {
    if (!currentProject.isSTAC || !currentProject.projectName || !currentRequestURL) {
      return '';
    }

    const aggregationsList = getAggregationsList(currentProject.projectName);
    return stringifyApiRequest(
      currentProject,
      currentRequestURL,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      aggregationsList,
    );
  }, [currentProject, currentRequestURL]);

  // const handleOnFinishFilenameVarForm = (values: { [key: string]: string }): void => {
  //   if (activeSearchQuery.filenameVars.includes(values.filenameVar as never)) {
  //     showError(messageApi, `Input "${values.filenameVar}" has already been applied`);
  //   } else {
  //     setActiveSearchQuery({
  //       ...activeSearchQuery,
  //       filenameVars: [...activeSearchQuery.filenameVars, values.filenameVar],
  //     });
  //   }

  //   setFilenameVars('');
  //   filenameVarForm.setFieldsValue({ filenameVar: '' });
  // };

  const handleOnChangeGeneralFacetsForm = (selectedFacets: {
    versionType: VersionType;
    resultType: ResultType;
    versionDateRange: DatePickerReturnType;
    createdDateRange: DatePickerReturnType;
    [key: string]: VersionType | ResultType | ActiveFacets | [] | DatePickerReturnType;
  }): void => {
    const {
      versionType: newVersionType,
      resultType: newResultType,
      versionDateRange,
      createdDateRange,
    } = selectedFacets;
    let newMinVersionDate = null;
    let newMaxVersionDate = null;
    let newMinCreatedDate = null;
    let newMaxCreatedDate = null;

    /* istanbul ignore else -- @preserve */
    if (versionDateRange) {
      const [minDate, maxDate] = versionDateRange;
      /* istanbul ignore else -- @preserve */
      if (minDate) {
        newMinVersionDate = formatDate(minDate, true) as string;
      }
      /* istanbul ignore else -- @preserve */
      if (maxDate) {
        newMaxVersionDate = formatDate(maxDate, true) as string;
      }
    }

    /* istanbul ignore else -- @preserve */
    if (createdDateRange) {
      const [minDate, maxDate] = createdDateRange;
      /* istanbul ignore else -- @preserve */
      if (minDate) {
        // Convert to ISO format for created dates
        newMinCreatedDate = minDate.toISOString();
      }
      /* istanbul ignore else -- @preserve */
      if (maxDate) {
        // Convert to ISO format for created dates
        newMaxCreatedDate = maxDate.toISOString();
      }
    }

    setActiveSearchQuery({
      ...activeSearchQuery,
      versionType: newVersionType,
      resultType: newResultType,
      minVersionDate: newMinVersionDate,
      maxVersionDate: newMaxVersionDate,
      minCreatedDate: newMinCreatedDate,
      maxCreatedDate: newMaxCreatedDate,
    });
  };

  const handleOnSelectAvailableFacetsForm = (facet: string, options: string[] | []): void => {
    setActiveDropdownValue([facet, options]);
  };

  const handleOnGlobusReadyChanged = (event: RadioChangeEvent): void => {
    const globusOnly = event.target.value as boolean;
    setGlobusReadyOnly(globusOnly);

    /* istanbul ignore if -- @preserve */
    if (currentProject.isSTAC) {
      if (globusOnly) {
        setActiveSearchQuery({
          ...activeSearchQuery,
          globusOnly: true,
        });
      } else {
        setActiveSearchQuery({
          ...activeSearchQuery,
          globusOnly: false,
        });
      }
      return;
    }

    if (globusOnly) {
      setActiveSearchQuery({
        ...activeSearchQuery,
        activeFacets: {
          ...activeSearchQuery.activeFacets,
          data_node: window.METAGRID.GLOBUS_NODES,
        },
      });
      setActiveDropdownValue(['data_node', window.METAGRID.GLOBUS_NODES]);
    } else {
      setActiveSearchQuery({
        ...activeSearchQuery,
        activeFacets: {
          ...activeSearchQuery.activeFacets,
          data_node: [],
        },
      } as ActiveSearchQuery);
      setActiveDropdownValue(['data_node', []]);
    }
  };

  /**
   * Sets the keyword search value using the keyword search form.
   */
  const onKeywordSearch = (values: { [key: string]: string }): void => {
    if (activeSearchQuery.textInputs.includes(values.text as never)) {
      showError(messageApi, `Input "${values.text}" has already been applied`);
    } else {
      setActiveSearchQuery({
        ...activeSearchQuery,
        project: currentProject,
        textInputs: [...activeSearchQuery.textInputs, values.text],
      });
    }

    // Reset the controlled state and form field
    setKeywordSearch('');
    keywordSearchForm.setFieldsValue({ text: '' });
  };

  /**
   * Need to reset the form fields when the active search query updates to
   * capture the correct number of facet counts per option
   */
  React.useEffect(() => {
    generalFacetsForm.resetFields();
    availableFacetsForm.resetFields();
    /* istanbul ignore else -- @preserve */
    if (window.METAGRID.GLOBUS_NODES && window.METAGRID.GLOBUS_NODES.length > 0) {
      /* istanbul ignore else if -- @preserve */
      if (
        activeSearchQuery &&
        activeSearchQuery.activeFacets &&
        activeSearchQuery.activeFacets.data_node &&
        activeSearchQuery.activeFacets.data_node.every((node: string) =>
          window.METAGRID.GLOBUS_NODES.includes(node),
        )
      ) {
        setGlobusReadyOnly(true);
      } else if (activeSearchQuery.globusOnly) {
        setGlobusReadyOnly(activeSearchQuery.globusOnly);
      } else {
        setGlobusReadyOnly(false);
      }
    }
  }, [generalFacetsForm, availableFacetsForm, activeSearchQuery]);

  React.useEffect(() => {
    if (!dropdownIsOpen && activeDropdownValue) {
      const [facet, options] = activeDropdownValue;
      const newActiveFacets: ActiveFacets = activeSearchQuery.activeFacets;
      /* istanbul ignore else -- @preserve */
      if (options.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [facet]: remove, ...updatedFacets } = newActiveFacets;
        setActiveSearchQuery({ ...activeSearchQuery, activeFacets: updatedFacets });
      } else if (options.length > 0) {
        setActiveSearchQuery({
          ...activeSearchQuery,
          activeFacets: {
            ...newActiveFacets,
            [facet]: options,
          },
        });
      }
      setActiveDropdownValue(null);
    }
  }, [dropdownIsOpen, activeDropdownValue, setActiveDropdownValue]);

  function getLongestStringLengthReduce(arr: [string, number][]): number {
    /* istanbul ignore next -- @preserve */
    if (arr.length === 0) {
      return 0; // Handle empty array case
    }
    /* istanbul ignore next -- @preserve */
    return arr.reduce((maxLength, currentString) => {
      if (currentString[0] === undefined || currentString[1] === undefined) {
        return maxLength;
      }
      return Math.max(maxLength, currentString[0].length + currentString[1].toString().length + 1);
    }, 0); // Initialize maxLength to 0
  }

  const generateFacetGroups = useMemo((): {
    key: string;
    label: JSX.Element;
    className: string;
    children: (JSX.Element | null)[];
  }[] => {
    if (!facetsByGroup || objectIsEmpty(facetsByGroup) || objectIsEmpty(availableFacets)) {
      return [];
    }
    return Object.keys(facetsByGroup).map((group) => {
      return {
        key: group,
        label: (
          <div className={leftSidebarTargets.facetFormGeneral.class()}>
            {humanizeFacetNames(group)}
          </div>
        ),
        className: `site-collapse-custom-collapse ${leftSidebarTargets.facetFormFields.class()}`,
        children: Object.keys(availableFacets).map((facet) => {
          if (facetsByGroup[group].includes(facet)) {
            const facetOptions = availableFacets[facet];

            const isOptionalForDatasets =
              facetOptions.length > 0 && facetOptions[0].includes('none');
            const facetNameHumanized = humanizeFacetNames(facet);

            const longestFacetName = getLongestStringLengthReduce(facetOptions);
            const standardWidth = 320;
            const extendedWidth = 600;
            let dropDownStyle: React.CSSProperties = { width: `${standardWidth}px` };
            if (longestFacetName * 8 + 40 > standardWidth) {
              dropDownStyle = { width: `${extendedWidth}px`, position: 'fixed', left: '20px' };
            }

            return (
              <Form.Item
                key={facet}
                name={facet}
                label={
                  <div>
                    {humanizeFacetNames(facet)}
                    <Button
                      size="small"
                      style={{ marginLeft: '5px' }}
                      icon={
                        <Tooltip title={`Copy ${facetNameHumanized}s to clipboard`}>
                          <CopyOutlined style={{ fontSize: '12px' }} />
                        </Tooltip>
                      }
                      onClick={() => {
                        // copy link to clipboard
                        /* istanbul ignore else -- @preserve */
                        if (navigator && navigator.clipboard) {
                          navigator.clipboard.writeText(
                            facetOptions
                              .map((item) => {
                                return `${item[0]} (${item[1]})`;
                              })
                              .join('\n'),
                          );
                          showNotice(messageApi, `${facetNameHumanized}s copied to clipboard!`, {
                            icon: <CopyOutlined style={styles.messageAddIcon} />,
                          });
                        }
                      }}
                    />
                  </div>
                }
                style={{ marginBottom: 0 }}
                tooltip={
                  isOptionalForDatasets
                    ? {
                        title:
                          'Selecting the "none" option filters for datasets that do not use this facet.',
                        icon: <InfoCircleOutlined />,
                      }
                    : undefined
                }
              >
                <Select
                  data-testid={`${facet}-form-select`}
                  size="small"
                  placeholder="Select option(s)"
                  mode="multiple"
                  style={{ width: '100%' }}
                  styles={{
                    popup: {
                      root: dropDownStyle,
                    },
                  }}
                  tokenSeparators={[',']}
                  getPopupContainer={(triggerNode) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
                    triggerNode.parentElement
                  }
                  onOpenChange={(open) => setDropdownIsOpen(open)}
                  onChange={(value: string[] | []) => {
                    handleOnSelectAvailableFacetsForm(facet, value);
                  }}
                  options={generateFacetOptions(facet, facetOptions)}
                />
              </Form.Item>
            );
          }
          return null;
        }),
      };
    });
  }, [activeSearchQuery.project.facetsByGroup, availableFacets, messageApi]);

  return (
    <div data-testid="facets-form">
      {contextHolder}
      <Form
        form={availableFacetsForm}
        initialValues={{
          ...activeSearchQuery.activeFacets,
        }}
      >
        {window.METAGRID.GLOBUS_NODES.length > 0 && (
          <div className={leftSidebarTargets.filterByGlobusTransfer.class()}>
            <h3>Filter By Transfer Options</h3>
            <Row>
              <Col>
                <Radio.Group onChange={handleOnGlobusReadyChanged} value={globusReadyOnly}>
                  <Radio
                    key="any"
                    value={false}
                    className={leftSidebarTargets.filterByGlobusTransferAny.class()}
                  >
                    Any
                  </Radio>
                  <Radio
                    key="globus-ready"
                    value
                    className={leftSidebarTargets.filterByGlobusTransferOnly.class()}
                  >
                    Only Globus Transferrable
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
            <br />
          </div>
        )}
        <Row justify="end" gutter={8}>
          <Col span={16}>
            <h3>
              Filter with Facets
              {currentProject.isSTAC && aggregationsQueryString && (
                <Tooltip
                  title={
                    <Space direction="horizontal" size="small">
                      <span>Copy STAC aggregate request:</span>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          if (navigator && navigator.clipboard) {
                            navigator.clipboard.writeText(aggregationsQueryString);
                            showNotice(messageApi, 'Aggregations query copied to clipboard!');
                          }
                        }}
                      />
                    </Space>
                  }
                  placement="right"
                >
                  <InfoCircleOutlined
                    style={{ marginLeft: '8px', fontSize: '14px', cursor: 'pointer' }}
                  />
                </Tooltip>
              )}
            </h3>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            {expandAll ? (
              <Button
                className={leftSidebarTargets.facetFormExpandAllBtn.class()}
                size="small"
                onClick={() => {
                  const keys = Object.keys(facetsByGroup).map((panel) => panel);
                  setActivePanels(keys);
                  // also expand additional_properties and keyword-search
                  setSecondaryActivePanels(['additional_properties', 'keyword-search']);
                  setExpandAll(false);
                }}
              >
                Expand All
              </Button>
            ) : (
              <Button
                className={leftSidebarTargets.facetFormCollapseAllBtn.class()}
                size="small"
                onClick={() => {
                  setActivePanels([]);
                  // also collapse additional_properties and keyword-search
                  setSecondaryActivePanels([]);
                  setExpandAll(true);
                }}
              >
                Collapse All
              </Button>
            )}
          </Col>
        </Row>
        <div style={styles.container}>
          <Collapse
            activeKey={activePanels}
            onChange={(change) => {
              setActivePanels(change);
              const totalPanels = change.length + secondaryActivePanels.length;
              if (totalPanels === 0) {
                setExpandAll(true);
              } /* istanbul ignore next -- @preserve */ else if (totalPanels > 1) {
                setExpandAll(false);
              }
            }}
            items={generateFacetGroups}
          />
        </div>
      </Form>
      <Form
        form={generalFacetsForm}
        layout="horizontal"
        initialValues={{
          ...activeSearchQuery.activeFacets,
          versionType: activeSearchQuery.versionType,
          resultType: activeSearchQuery.resultType,
          versionDateRange: initialVersionDateRange,
          createdDateRange: initialCreatedDateRange,
        }}
        onValuesChange={(_changedValues, allValues) => {
          // eslint-disable-next-line
          handleOnChangeGeneralFacetsForm(allValues);
        }}
      >
        <div style={styles.container}>
          <Collapse
            activeKey={secondaryActivePanels}
            onChange={(change) => {
              setSecondaryActivePanels(change);
              const totalPanels = change.length + activePanels.length;
              /* istanbul ignore else -- @preserve */
              if (totalPanels === 0) {
                setExpandAll(true);
              } else if (totalPanels > 1) {
                setExpandAll(false);
              }
            }}
            items={[
              {
                key: 'additional_properties',
                className: `site-collapse-custom-collapse ${leftSidebarTargets.facetFormAdditionalFields.class()}`,
                label: (
                  <div className={leftSidebarTargets.facetFormAdditional.class()}>
                    {humanizeFacetNames('additional_properties')}
                  </div>
                ),
                children: (
                  <>
                    <Form.Item
                      label="Version Type"
                      name="versionType"
                      style={{ marginBottom: 0 }}
                      tooltip={{
                        title: 'By default, only the latest version of a dataset is returned',
                        trigger: 'hover',
                      }}
                    >
                      <Select
                        data-testid="version-type-form-select"
                        size="small"
                        options={[
                          { value: 'latest' as ResultType, label: 'Latest' },
                          { value: 'all' as ResultType, label: 'All' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Result Type"
                      name="resultType"
                      hidden={currentProject.isSTAC}
                      style={{ marginBottom: 0 }}
                      tooltip={{
                        title:
                          'Datasets can be replicated from the source node (original) to other nodes (replica)',
                        trigger: 'hover',
                      }}
                    >
                      <Select
                        data-testid="result-type-form-select"
                        size="small"
                        options={[
                          {
                            value: 'all' as ResultType,
                            label: 'Originals and Replicas',
                          },
                          {
                            value: 'originals only' as ResultType,
                            label: 'Originals Only',
                          },
                          {
                            value: 'replicas only' as ResultType,
                            label: 'Replicas Only',
                          },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      data-testid="version-range-datepicker"
                      label="Versions"
                      name="versionDateRange"
                      style={{ marginBottom: 0 }}
                      tooltip={{
                        title:
                          'Specify the versions of datasets using a single min/max date or a date range. ',
                        trigger: 'hover',
                      }}
                    >
                      <DatePicker.RangePicker size="small" allowEmpty={[true, true]} />
                    </Form.Item>
                    {currentProject.isSTAC && (
                      <Form.Item
                        data-testid="created-range-datepicker"
                        label="Publication Date"
                        name="createdDateRange"
                        style={{ marginBottom: 0 }}
                        tooltip={{
                          title:
                            'Filter datasets by when they were published/added to the catalog using a single min/max date or a date range.',
                          trigger: 'hover',
                        }}
                      >
                        <DatePicker.RangePicker size="small" allowEmpty={[true, true]} />
                      </Form.Item>
                    )}
                  </>
                ),
              },
            ]}
          />
        </div>
      </Form>
      {/*
        The filename var filter is currently disabled.
        <Form
        form={filenameVarForm}
        layout="horizontal"
        size="small"
        onFinish={handleOnFinishFilenameVarForm}
        style={styles.filenameVarForm}
      >
        <Collapse
          items={[
            {
              key: 'filename',
              label: (
                <div
                  className={leftSidebarTargets.facetFormFilename.class()}
                  data-testid="filename-collapse"
                >
                  {humanizeFacetNames('filename')}
                </div>
              ),
              className: `site-collapse-custom-collapse ${leftSidebarTargets.facetFormFilenameFields.class()}`,
              children: (
                <Form.Item
                  name="filenameVar"
                  label="Filter by Filename"
                  rules={[{ required: true, message: 'Variable is required' }]}
                  tooltip={{
                    title: (
                      <p>
                        Use file or variable names to filter a dataset&apos;s files under the{' '}
                        <RightCircleOutlined></RightCircleOutlined> icon. For multiple names, add
                        them individually or as a single comma-separated input (e.g. cct, cl).
                      </p>
                    ),
                    trigger: 'hover',
                  }}
                >
                  <Row gutter={5}>
                    <Col>
                      <Input
                        data-testid="filename-search-input"
                        value={filenameVars}
                        style={{ width: '140px' }}
                        onChange={(e) => setFilenameVars(e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SearchOutlined data-testid="filename-search-submit-btn" />}
                      ></Button>
                    </Col>
                  </Row>
                </Form.Item>
              ),
            },
          ]}
        />
      </Form> */}
      <Form
        initialValues={{}}
        style={styles.searchForm}
        form={keywordSearchForm}
        onFinish={onKeywordSearch}
      >
        <Collapse
          activeKey={secondaryActivePanels}
          onChange={(change) => {
            setSecondaryActivePanels(change);
            const totalPanels = change.length + activePanels.length;
            /* istanbul ignore else if -- @preserve */
            if (totalPanels === 0) {
              setExpandAll(true);
            } else if (totalPanels > 1) {
              setExpandAll(false);
            }
          }}
          items={[
            {
              key: 'keyword-search',
              label: <div data-testid="keyword-search-collapse">Keyword Search</div>,
              className: `site-collapse-custom-collapse ${leftSidebarTargets.facetFormKeywordSearch.class()}`,
              children: (
                <Space size="small">
                  <Form.Item
                    name="text"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: 'Text is required' }]}
                  >
                    <Input
                      data-testid="keyword-search-input"
                      size="small"
                      style={{ minWidth: '285px' }}
                      value={keywordSearch}
                      onChange={(e) => setKeywordSearch(e.target.value)}
                      placeholder="Search for a keyword"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SearchOutlined data-testid="left-menu-keyword-search-submit" />}
                    />
                  </Form.Item>
                </Space>
              ),
            },
          ]}
        />
      </Form>
    </div>
  );
};

export default FacetsForm;
