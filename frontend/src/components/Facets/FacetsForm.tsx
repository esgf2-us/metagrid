import {
  CopyOutlined,
  InfoCircleOutlined,
  RightCircleOutlined,
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
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';

import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { CSSinJS } from '../../common/types';
import Button from '../General/Button';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import { ActiveSearchQuery, ResultType, VersionType } from '../Search/types';
import { ActiveFacets, ParsedFacets } from './types';
import { clearCachedSearchResults, showError, showNotice } from '../../common/utils';
import { activeSearchQueryAtom, availableFacetsAtom } from '../../common/atoms';
import { leftSidebarTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

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

const FacetsForm: React.FC = () => {
  // Global states
  const [activeSearchQuery, setActiveSearchQuery] =
    useAtom<ActiveSearchQuery>(activeSearchQueryAtom);

  // Local variables
  const [messageApi, contextHolder] = message.useMessage();

  const [generalFacetsForm] = Form.useForm();
  const [availableFacetsForm] = Form.useForm();
  const [filenameVarForm] = Form.useForm();
  const [filenameVars, setFilenameVar] = React.useState('');
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
  const [activePanels, setActivePanels] = React.useState<
    string | number | (string | number)[] | undefined
  >([]);
  const [expandAll, setExpandAll] = React.useState<boolean>(true);

  const availableFacets: ParsedFacets = useAtomValue(availableFacetsAtom) as ParsedFacets;

  type DatePickerReturnType = [null, null] | [Dayjs, null] | [null, Dayjs] | [Dayjs, Dayjs];

  const facetsByGroup = activeSearchQuery.project.facetsByGroup as {
    [key: string]: string[];
  };

  // Convert using moment.js to for the initial value of the date picker
  const { minVersionDate, maxVersionDate } = activeSearchQuery;
  const initialVersionDateRange = [
    minVersionDate ? formatDate(minVersionDate, false) : (minVersionDate as null),
    maxVersionDate ? formatDate(maxVersionDate, false) : (maxVersionDate as null),
  ];

  const handleOnFinishFilenameVarForm = (values: { [key: string]: string }): void => {
    if (activeSearchQuery.filenameVars.includes(values.filenameVar as never)) {
      showError(messageApi, `Input "${values.filenameVar}" has already been applied`);
    } else {
      setActiveSearchQuery({
        ...activeSearchQuery,
        filenameVars: [...activeSearchQuery.filenameVars, values.filenameVar],
      });
    }

    setFilenameVar('');
    filenameVarForm.setFieldsValue({ filenameVar: '' });
  };

  const handleOnChangeGeneralFacetsForm = (selectedFacets: {
    versionType: VersionType;
    resultType: ResultType;
    versionDateRange: DatePickerReturnType;
    [key: string]: VersionType | ResultType | ActiveFacets | [] | DatePickerReturnType;
  }): void => {
    const {
      versionType: newVersionType,
      resultType: newResultType,
      versionDateRange,
    } = selectedFacets;
    let newMinVersionDate = null;
    let newMaxVersionDate = null;

    /* istanbul ignore else */
    if (versionDateRange) {
      const [minDate, maxDate] = versionDateRange;
      if (minDate) {
        newMinVersionDate = formatDate(minDate, true) as string;
      }
      if (maxDate) {
        newMaxVersionDate = formatDate(maxDate, true) as string;
      }
    }

    setActiveSearchQuery({
      ...activeSearchQuery,
      versionType: newVersionType,
      resultType: newResultType,
      minVersionDate: newMinVersionDate,
      maxVersionDate: newMaxVersionDate,
    });
  };

  const handleOnSelectAvailableFacetsForm = (facet: string, options: string[] | []): void => {
    setActiveDropdownValue([facet, options]);
  };

  const handleOnGlobusReadyChanged = (event: RadioChangeEvent): void => {
    const globusOnly = event.target.value as boolean;
    setGlobusReadyOnly(globusOnly);
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
   * Need to reset the form fields when the active search query updates to
   * capture the correct number of facet counts per option
   */
  React.useEffect(() => {
    generalFacetsForm.resetFields();
    availableFacetsForm.resetFields();
    if (window.METAGRID.GLOBUS_NODES && window.METAGRID.GLOBUS_NODES.length > 0) {
      if (
        activeSearchQuery &&
        activeSearchQuery.activeFacets &&
        activeSearchQuery.activeFacets.data_node &&
        activeSearchQuery.activeFacets.data_node.every((node: string) =>
          window.METAGRID.GLOBUS_NODES.includes(node),
        )
      ) {
        setGlobusReadyOnly(true);
      } else {
        setGlobusReadyOnly(false);
      }
    }
  }, [generalFacetsForm, availableFacetsForm, activeSearchQuery]);

  React.useEffect(() => {
    if (!dropdownIsOpen && activeDropdownValue) {
      const [facet, options] = activeDropdownValue;
      const newActiveFacets: ActiveFacets = activeSearchQuery.activeFacets;
      /* istanbul ignore else */
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

  const generateStacFacetOptions = (
    facet: string,
    facetOptions: string[],
  ): { key: string; value: string; label: JSX.Element }[] => {
    return facetOptions.map((variable) => {
      const optionOutput: string | React.ReactElement = <>{variable}</>;

      return {
        key: variable,
        value: variable,
        label: <span data-testid={`${facet}_${variable}`}>{optionOutput} </span>,
      };
    });
  };

  const generateFacetOptions = (
    facet: string,
    facetOptions: [string, number][] | string[],
  ): { key: string; value: string; label: JSX.Element }[] => {
    if (facetOptions.length > 0 && typeof facetOptions[0] === 'string') {
      return generateStacFacetOptions(facet, facetOptions as string[]);
    }

    // Used to control text length of the drop-down items
    // Tooltip is shown if the length is above this threshold
    const maxItemLength = 22;

    return facetOptions.map((variable) => {
      if (typeof variable[0] !== 'string') {
        clearCachedSearchResults();
      }
      let optionOutput: string | React.ReactNode = (
        <>
          {variable[0]}
          <span style={styles.facetCount}>({variable[1]})</span>
        </>
      );

      // If the option output name is very long, use a tooltip
      const vLength = variable[0].length - 2;
      const cLength = variable[1].toString().length * 1.5 + 2;
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
        label: <span data-testid={`${facet}_${variable[0]}`}>{optionOutput} </span>,
      };
    });
  };

  const generateFacetGroups = (): {
    key: string;
    label: JSX.Element;
    className: string;
    children: (JSX.Element | null)[];
  }[] => {
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

            const isOptionalforDatasets =
              facetOptions.length > 0 && facetOptions[0].includes('none');
            const facetNameHumanized = humanizeFacetNames(facet);
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
                        /* istanbul ignore else */
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
                    ></Button>
                  </div>
                }
                style={{ marginBottom: 0 }}
                tooltip={
                  isOptionalforDatasets
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
  };

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
            <h3>Filter with Facets</h3>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            {expandAll ? (
              <Button
                className={leftSidebarTargets.facetFormExpandAllBtn.class()}
                size="small"
                onClick={() => {
                  setActivePanels(Object.keys(facetsByGroup).map((panel) => panel));
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
              if (change.length === 0) {
                setExpandAll(true);
              } else if (change.length > 1) {
                setExpandAll(false);
              }
            }}
            items={generateFacetGroups()}
          />
        </div>
      </Form>
      <Form
        form={generalFacetsForm}
        layout="horizontal"
        size="small"
        initialValues={{
          ...activeSearchQuery.activeFacets,
          versionType: activeSearchQuery.versionType,
          resultType: activeSearchQuery.resultType,
          versionDateRange: initialVersionDateRange,
        }}
        onValuesChange={(_changedValues, allValues) => {
          // eslint-disable-next-line
          handleOnChangeGeneralFacetsForm(allValues);
        }}
      >
        <Collapse
          defaultActiveKey="additional_properties"
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
                    tooltip={{
                      title: 'By default, only the latest version of a dataset is returned',
                      trigger: 'hover',
                    }}
                  >
                    <Select
                      data-testid="version-type-form-select"
                      options={[
                        { value: 'latest' as ResultType, label: 'Latest' },
                        { value: 'all' as ResultType, label: 'All' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Result Type"
                    name="resultType"
                    tooltip={{
                      title:
                        'Datasets can be replicated from the source node (original) to other nodes (replica)',
                      trigger: 'hover',
                    }}
                  >
                    <Select
                      data-testid="result-type-form-select"
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
                    label="Version Date Range"
                    name="versionDateRange"
                    tooltip={{
                      title:
                        'Specify the versions of datasets using a single min/max date or a date range. ',
                      trigger: 'hover',
                    }}
                  >
                    <DatePicker.RangePicker allowEmpty={[true, true]} />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
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
                        onChange={(e) => setFilenameVar(e.target.value)}
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
      </Form>
    </div>
  );
};

export default FacetsForm;
