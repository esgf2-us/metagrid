import React from 'react';
import { Collapse, Form, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Button from '../General/Button';

import { isEmpty, humanize } from '../../utils/utils';

const styles: { [key: string]: React.CSSProperties } = {
  content: { height: '660px', width: '100%', overflowY: 'auto' },
  facetCount: { float: 'right' },
  applyBtn: { marginBottom: '5px' },
};

type Props = {
  activeFacets: ActiveFacets | {};
  availableFacets: AvailableFacets | {};
  handleFacetsForm: (allValues: { [key: string]: string[] | [] }) => void;
};

const FacetsForm: React.FC<Props> = ({
  activeFacets,
  availableFacets,
  handleFacetsForm,
}) => {
  const [facetsForm] = Form.useForm();

  const [btnDisabled, setBtnDisabled] = React.useState(true);

  /**
   * Reset facetsForm based on the activeFacets
   */
  React.useEffect(() => {
    facetsForm.resetFields();
  }, [facetsForm, activeFacets]);

  /**
   * Enables or disables the submit button if any of the facet form items change
   */
  const handleValuesChange = (allValues: {
    [key: string]: string[] | [];
  }): void => {
    // Transforms all of the string array values as a single array
    const values: string[] = Object.keys(allValues).reduce((r, k) => {
      return r.concat(allValues[k]);
    }, [] as string[]);

    if (values.length > 0) {
      setBtnDisabled(false);
    } else {
      setBtnDisabled(true);
    }
  };

  return (
    <div data-testid="facets-form">
      <div style={styles.applyBtn}>
        {!isEmpty(availableFacets) && (
          <Button
            data-testid="facets-form-btn"
            onClick={() => facetsForm.submit()}
            type="primary"
            htmlType="submit"
            icon={<FilterOutlined />}
            disabled={btnDisabled}
          >
            Apply Facets
          </Button>
        )}
      </div>
      <div style={styles.content}>
        {!isEmpty(availableFacets) && (
          <Form
            form={facetsForm}
            layout="vertical"
            initialValues={{ ...activeFacets }}
            onFinish={(values) => handleFacetsForm(values)}
            onValuesChange={(_changedValues, allValues) =>
              handleValuesChange(allValues)
            }
          >
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
                        {(availableFacets as AvailableFacets)[facet].map(
                          (variable) => {
                            return (
                              <Select.Option
                                key={variable[0]}
                                value={variable[0]}
                              >
                                <span data-testid={`${facet}_${variable[0]}`}>
                                  {variable[0]}
                                  <span style={styles.facetCount}>
                                    ({variable[1]})
                                  </span>
                                </span>
                              </Select.Option>
                            );
                          }
                        )}
                      </Select>
                    </Form.Item>
                  </Collapse.Panel>
                );
              })}
            </Collapse>
          </Form>
        )}
      </div>
    </div>
  );
};

export default FacetsForm;
