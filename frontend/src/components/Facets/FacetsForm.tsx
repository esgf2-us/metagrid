import { Checkbox, Collapse, Form, Select } from 'antd';
import React from 'react';
import { humanize } from '../../utils/utils';

const styles: CSSinJS = {
  container: { maxHeight: '80vh', overflowY: 'auto' },
  facetCount: { float: 'right' },
  formTitle: { fontWeight: 'bold', textTransform: 'capitalize' },
  applyBtn: { marginBottom: '12px' },
  collapseContainer: { marginTop: '12px' },
};

export type Props = {
  facetsByGroup?: { [key: string]: string[] };
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  availableFacets: ParsedFacets;
  handleFacetsForm: (allValues: { [key: string]: string[] | [] }) => void;
};

const FacetsForm: React.FC<Props> = ({
  facetsByGroup,
  defaultFacets,
  activeFacets,
  availableFacets,
  handleFacetsForm,
}) => {
  const [projectFacetsForm] = Form.useForm();

  /**
   * Reset facetsForm based on the activeFacets
   */
  React.useEffect(() => {
    projectFacetsForm.resetFields();
  }, [projectFacetsForm, activeFacets, defaultFacets]);

  return (
    <div data-testid="facets-form">
      <Form
        form={projectFacetsForm}
        layout="vertical"
        initialValues={{
          ...activeFacets,
          selectedDefaults: Object.keys(defaultFacets).filter(
            (k) => defaultFacets[k]
          ),
        }}
        onValuesChange={(_changedValues, allValues) => {
          handleFacetsForm(allValues);
        }}
      >
        <Form.Item name="selectedDefaults">
          <Checkbox.Group
            options={[{ label: 'Include Replica', value: 'replica' }]}
          ></Checkbox.Group>
        </Form.Item>
        <div style={styles.container}>
          {facetsByGroup &&
            Object.keys(facetsByGroup).map((group) => {
              return (
                <div key={group} style={styles.collapseContainer}>
                  <h4 style={styles.formTitle}>{group}</h4>
                  <Collapse>
                    {Object.keys(availableFacets).map((facet) => {
                      if (facetsByGroup[group].includes(facet)) {
                        const facetOptions = availableFacets[facet];
                        return (
                          <Collapse.Panel
                            header={humanize(facet)}
                            key={facet}
                            disabled={facetOptions.length === 0}
                          >
                            <Form.Item
                              style={{ marginBottom: '4px' }}
                              key={facet}
                              name={facet}
                            >
                              <Select
                                data-testid={`${facet}-form-select`}
                                size="small"
                                placeholder="Select option(s)"
                                mode="multiple"
                                style={{ width: '100%' }}
                                tokenSeparators={[',']}
                                showArrow
                              >
                                {facetOptions.map((variable) => {
                                  return (
                                    <Select.Option
                                      key={variable[0]}
                                      value={variable[0]}
                                    >
                                      <span
                                        data-testid={`${facet}_${variable[0]}`}
                                      >
                                        {variable[0]}
                                        <span style={styles.facetCount}>
                                          ({variable[1]})
                                        </span>
                                      </span>
                                    </Select.Option>
                                  );
                                })}
                              </Select>
                            </Form.Item>
                          </Collapse.Panel>
                        );
                      }
                      return null;
                    })}
                  </Collapse>
                </div>
              );
            })}
        </div>
      </Form>
    </div>
  );
};

export default FacetsForm;
