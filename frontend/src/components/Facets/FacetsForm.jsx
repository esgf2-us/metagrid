import React from 'react';
import PropTypes from 'prop-types';
import { Collapse, Form, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Button from '../General/Button';

import { isEmpty, humanize } from '../../utils/utils';

const styles = {
  content: { height: '660px', width: '100%', overflowY: 'auto' },
  facetCount: { float: 'right' },
  applyBtn: { marginBottom: '5px' },
};

function FacetsForm({ activeFacets, availableFacets, handleFacetsForm }) {
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
   * @param {*} allValues
   */
  const handleValuesChange = (allValues) => {
    const values = Object.keys(allValues).reduce((r, k) => {
      return r.concat(allValues[k]);
    }, []);

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
                    data-testid={`${facet}_form`}
                    style={{ marginBottom: '4px' }}
                    key={facet}
                    name={facet}
                  >
                    <Select
                      size="small"
                      placeholder="Select option(s)"
                      mode="multiple"
                      style={{ width: '100%' }}
                      tokenSeparators={[',']}
                      showArrow
                    >
                      {availableFacets[facet].map((variable) => {
                        return (
                          <Select.Option
                            data-testid={`${facet}_${variable[0]}`}
                            key={variable[0]}
                            value={variable[0]}
                          >
                            {variable[0]}
                            <span style={styles.facetCount}>
                              ({variable[1]})
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
        </Form>
      </div>
    </div>
  );
}

FacetsForm.propTypes = {
  activeFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)),
  availableFacets: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
  ).isRequired,
  handleFacetsForm: PropTypes.func.isRequired,
};

FacetsForm.defaultProps = {
  activeFacets: {},
};
export default FacetsForm;
