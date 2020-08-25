import { FilterOutlined } from '@ant-design/icons';
import { Checkbox, Collapse, Form, Select } from 'antd';
import React from 'react';
import { humanize } from '../../utils/utils';
import Button from '../General/Button';

const styles: { [key: string]: React.CSSProperties } = {
  facetCount: { float: 'right' },
  formTitle: { fontWeight: 'bold', textTransform: 'capitalize' },
  applyBtn: { marginBottom: '10px' },
  collapseContainer: { marginTop: '10px' },
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
  }, [projectFacetsForm, activeFacets]);

  return (
    <div data-testid="facets-form">
      <div style={styles.applyBtn}>
        <Button
          data-testid="facets-form-btn"
          onClick={() => projectFacetsForm.submit()}
          type="primary"
          htmlType="submit"
          icon={<FilterOutlined />}
        >
          Apply Facets
        </Button>
      </div>

      <Form
        form={projectFacetsForm}
        layout="vertical"
        initialValues={{
          ...activeFacets,
          selectedDefaults: Object.keys(defaultFacets).filter(
            (k) => defaultFacets[k]
          ),
        }}
        onFinish={(values) => handleFacetsForm(values)}
      >
        <Form.Item name="selectedDefaults">
          <Checkbox.Group
            options={[{ label: 'Include Replica', value: 'replica' }]}
          ></Checkbox.Group>
        </Form.Item>
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
      </Form>
    </div>
  );
};

export default FacetsForm;
