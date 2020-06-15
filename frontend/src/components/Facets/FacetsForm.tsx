import React from 'react';
import { Checkbox, Collapse, Form, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Button from '../General/Button';

import { humanize } from '../../utils/utils';

const styles: { [key: string]: React.CSSProperties } = {
  content: { height: '660px', width: '100%', overflowY: 'auto' },
  facetCount: { float: 'right' },
  formTitle: { fontWeight: 'bold' },
  applyBtn: { marginBottom: '5px' },
};

export type Props = {
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | {};
  availableFacets: AvailableFacets;
  handleFacetsForm: (allValues: { [key: string]: string[] | [] }) => void;
};

const FacetsForm: React.FC<Props> = ({
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
        <h4 style={styles.formTitle}>Default Facets</h4>
        <Form.Item name="selectedDefaults">
          <Checkbox.Group
            options={[
              { label: 'Latest Data', value: 'latest' },
              { label: 'Include Replica', value: 'replica' },
            ]}
          ></Checkbox.Group>
        </Form.Item>
        <h4 style={styles.formTitle}>Project Facets</h4>

        <div style={styles.content}>
          <Collapse bordered={false}>
            {Object.keys(availableFacets).map((facet) => {
              return (
                <Collapse.Panel header={humanize(facet)} key={facet}>
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
                      {availableFacets[facet].map((variable) => {
                        return (
                          <Select.Option key={variable[0]} value={variable[0]}>
                            <span data-testid={`${facet}_${variable[0]}`}>
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
            })}
          </Collapse>
        </div>
      </Form>
    </div>
  );
};

export default FacetsForm;
