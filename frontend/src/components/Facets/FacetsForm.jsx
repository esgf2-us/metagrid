import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Button from '../General/Button';

import { isEmpty, humanize } from '../../utils/utils';

const styles = {
  facetCount: { float: 'right' },
};

function FacetsForm({ activeFacets, availableFacets, handleFacetsForm }) {
  const [facetsForm] = Form.useForm();

  /**
   * Reset facetsForm based on the activeFacets
   */
  React.useEffect(() => {
    facetsForm.resetFields();
  }, [facetsForm, activeFacets]);

  return (
    <>
      <div style={styles.facetsForm}>
        <Form
          form={facetsForm}
          layout="vertical"
          initialValues={{ ...activeFacets }}
          onFinish={(values) => handleFacetsForm(values)}
        >
          {Object.keys(availableFacets).map((facet) => {
            return (
              <Form.Item
                style={{ marginBottom: '4px' }}
                key={facet}
                name={facet}
                label={humanize(facet)}
              >
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  tokenSeparators={[',']}
                  showArrow
                >
                  {availableFacets[facet].map((variable) => {
                    return (
                      <Select.Option key={variable[0]} value={variable[0]}>
                        {variable[0]}
                        <span style={styles.facetCount}>({variable[1]})</span>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
            );
          })}{' '}
        </Form>
      </div>
      {!isEmpty(availableFacets) && (
        <Button
          onClick={() => facetsForm.submit()}
          type="primary"
          htmlType="submit"
          icon={<FilterOutlined />}
        >
          Apply Facets
        </Button>
      )}
    </>
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
