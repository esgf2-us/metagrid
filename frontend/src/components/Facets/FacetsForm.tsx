import {
  InfoCircleOutlined,
  RightCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Col, Collapse, DatePicker, Form, Input, Row, Select } from 'antd';
import moment from 'moment';
import React from 'react';
import { addTempStep } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Button from '../General/Button';
import StatusToolTip from '../NodeStatus/StatusToolTip';
import { NodeStatusArray } from '../NodeStatus/types';
import {
  ActiveSearchQuery,
  ResultType,
  VersionDate,
  VersionType,
} from '../Search/types';
import { ActiveFacets, ParsedFacets } from './types';

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

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  availableFacets: ParsedFacets;
  nodeStatus?: NodeStatusArray;
  onSetFilenameVars: (filenameVar: string) => void;
  onSetGeneralFacets: (
    versionType: VersionType,
    resultType: ResultType,
    minVersionDate: VersionDate,
    maxVersionDate: VersionDate
  ) => void;
  onSetActiveFacets: (activeFacets: ActiveFacets) => void;
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

export const formatDate = (
  date: string | moment.Moment,
  toString: boolean
): string | moment.Moment => {
  const format = 'YYYYMMDD';

  if (toString) {
    return moment(date).format(format);
  }
  return moment(date, format);
};

const FacetsForm: React.FC<Props> = ({
  activeSearchQuery,
  availableFacets,
  nodeStatus,
  onSetFilenameVars,
  onSetGeneralFacets,
  onSetActiveFacets,
}) => {
  const [generalFacetsForm] = Form.useForm();
  const [availableFacetsForm] = Form.useForm();
  const [filenameVarForm] = Form.useForm();
  const [filenameVars, setFilenameVar] = React.useState('');

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

  type DatePickerReturnType =
    | [null, null]
    | [moment.Moment, null]
    | [null, moment.Moment]
    | [moment.Moment, moment.Moment];

  // Convert using moment.js to for the initial value of the date picker
  const { minVersionDate, maxVersionDate } = activeSearchQuery;
  const initialVersionDateRange = [
    minVersionDate
      ? formatDate(minVersionDate, false)
      : (minVersionDate as null),
    maxVersionDate
      ? formatDate(maxVersionDate, false)
      : (maxVersionDate as null),
  ];

  const handleOnFinishFilenameVarForm = (values: {
    [key: string]: string;
  }): void => {
    onSetFilenameVars(values.filenameVar);

    setFilenameVar('');
    filenameVarForm.setFieldsValue({ filenameVar: '' });
  };

  const handleOnChangeGeneralFacetsForm = (selectedFacets: {
    versionType: VersionType;
    resultType: ResultType;
    versionDateRange: DatePickerReturnType;
    [key: string]:
      | VersionType
      | ResultType
      | ActiveFacets
      | []
      | DatePickerReturnType;
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
      newMinVersionDate = minDate
        ? (formatDate(minDate, true) as string)
        : minDate;
      newMaxVersionDate = maxDate
        ? (formatDate(maxDate, true) as string)
        : maxDate;
    }

    onSetGeneralFacets(
      newVersionType,
      newResultType,
      newMinVersionDate,
      newMaxVersionDate
    );
  };

  const handleOnSelectAvailableFacetsForm = (
    facet: string,
    options: string[] | []
  ): void => {
    setActiveDropdownValue([facet, options]);
  };

  /**
   * Need to reset the form fields when the active search query updates to
   * capture the correct number of facet counts per option
   */
  React.useEffect(() => {
    generalFacetsForm.resetFields();
    availableFacetsForm.resetFields();
  }, [generalFacetsForm, availableFacetsForm, activeSearchQuery]);

  React.useEffect(() => {
    if (!dropdownIsOpen && activeDropdownValue) {
      const [facet, options] = activeDropdownValue;
      const newActiveFacets = activeSearchQuery.activeFacets as ActiveFacets;
      /* istanbul ignore else */
      if (options.length === 0) {
        delete newActiveFacets[facet];
        onSetActiveFacets(newActiveFacets);
      } else if (options.length > 0) {
        onSetActiveFacets({
          ...newActiveFacets,
          [facet]: options,
        } as ActiveFacets);
      }
      setActiveDropdownValue(null);
    }
  }, [
    dropdownIsOpen,
    onSetActiveFacets,
    activeSearchQuery,
    activeDropdownValue,
    setActiveDropdownValue,
  ]);

  const facetsByGroup = activeSearchQuery.project.facetsByGroup as {
    [key: string]: string[];
  };
  return (
    <div data-testid="facets-form">
      <Form
        className={addTempStep('FacetsForm', 212)}
        form={availableFacetsForm}
        initialValues={{
          ...activeSearchQuery.activeFacets,
        }}
      >
        <div style={styles.container}>
          <Collapse accordion>
            {facetsByGroup &&
              Object.keys(facetsByGroup).map((group) => (
                <Collapse.Panel
                  header={humanizeFacetNames(group)}
                  key={group}
                  className="site-collapse-custom-collapse"
                >
                  {Object.keys(availableFacets).map((facet) => {
                    if (facetsByGroup[group].includes(facet)) {
                      const facetOptions = availableFacets[facet];

                      const isOptionalforDatasets =
                        facetOptions.length > 0 &&
                        facetOptions[0].includes('none');
                      return (
                        <Form.Item
                          key={facet}
                          name={facet}
                          className={addTempStep('FacetsForm', 238)}
                          label={
                            humanizeFacetNames(facet) +
                            (isOptionalforDatasets ? ' (Optional)' : '')
                          }
                          style={{ marginBottom: '0px' }}
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
                            showArrow
                            getPopupContainer={(triggerNode) =>
                              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
                              triggerNode.parentElement
                            }
                            onDropdownVisibleChange={(open) =>
                              setDropdownIsOpen(open)
                            }
                            onChange={(value: string[] | []) => {
                              handleOnSelectAvailableFacetsForm(facet, value);
                            }}
                          >
                            {facetOptions.map((variable) => {
                              let optionOutput: string | React.ReactElement = (
                                <>
                                  {variable[0]}
                                  <span style={styles.facetCount}>
                                    ({variable[1]})
                                  </span>
                                </>
                              );
                              // The data node facet has a unique tooltip overlay to show the status of the highlighted node
                              if (facet === 'data_node') {
                                optionOutput = (
                                  <StatusToolTip
                                    nodeStatus={nodeStatus}
                                    dataNode={variable[0]}
                                  >
                                    <span style={styles.facetCount}>
                                      ({variable[1]})
                                    </span>
                                  </StatusToolTip>
                                );
                              }
                              return (
                                <Select.Option
                                  key={variable[0]}
                                  value={variable[0]}
                                >
                                  <span data-testid={`${facet}_${variable[0]}`}>
                                    {optionOutput}
                                  </span>
                                </Select.Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                      );
                    }
                    return null;
                  })}
                </Collapse.Panel>
              ))}
          </Collapse>
        </div>
      </Form>
      <Form
        className={addTempStep('FacetsForm', 317)}
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
          handleOnChangeGeneralFacetsForm(allValues);
        }}
      >
        <Collapse>
          <Collapse.Panel
            header={humanizeFacetNames('additional_properties')}
            key="additional_properties"
            className="site-collapse-custom-collapse"
          >
            <Form.Item
              label="Version Type"
              name="versionType"
              tooltip={{
                title:
                  'By default, only the latest version of a dataset is returned',
                trigger: 'hover',
              }}
            >
              <Select data-testid="version-type-form-select">
                <Select.Option value={'latest' as ResultType}>
                  Latest
                </Select.Option>
                <Select.Option value={'all' as ResultType}>All</Select.Option>
              </Select>
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
              <Select data-testid="result-type-form-select">
                <Select.Option value={'all' as ResultType}>
                  Originals and Replicas
                </Select.Option>
                <Select.Option value={'originals only' as ResultType}>
                  Originals only
                </Select.Option>
                <Select.Option value={'replicas only' as ResultType}>
                  Replicas only
                </Select.Option>
              </Select>
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
          </Collapse.Panel>
        </Collapse>
      </Form>
      <Form
        className={addTempStep('FacetsForm', 390)}
        form={filenameVarForm}
        layout="horizontal"
        size="small"
        onFinish={handleOnFinishFilenameVarForm}
        style={styles.filenameVarForm}
      >
        <Collapse>
          <Collapse.Panel
            header={humanizeFacetNames('filename')}
            key="filename"
            className="site-collapse-custom-collapse"
          >
            <Form.Item
              name="filenameVar"
              label="Filter by Filename"
              rules={[{ required: true, message: 'Variable is required' }]}
              tooltip={{
                title: (
                  <p>
                    Use file or variable names to filter a dataset&apos;s files
                    under the <RightCircleOutlined></RightCircleOutlined> icon.
                    For multiple names, add them individually or as a single
                    comma-separated input (e.g. cct, cl).
                  </p>
                ),
                trigger: 'hover',
              }}
            >
              <Row gutter={5}>
                <Col>
                  <Input
                    className={addTempStep('FacetsForm', 422)}
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
                    icon={<SearchOutlined />}
                  ></Button>
                </Col>
              </Row>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </div>
  );
};

export default FacetsForm;
