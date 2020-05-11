import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Spin from '../Feedback/Spin';

import { isEmpty, humanize } from '../../utils/utils';

const styles = {
  facetCount: { float: 'right' },
};

function FacetsForm({
  activeFacets,
  availableFacets,
  facetsForm,
  facetsError,
  facetsIsLoading,
  handleFacetsForm,
}) {
  let facetSection;

  if (!isEmpty(availableFacets)) {
    facetSection = (
      <>
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
        })}
      </>
    );
  }
  return (
    <>
      <div style={styles.facetsForm}>
        <Form
          form={facetsForm}
          layout="vertical"
          initialValues={{ ...activeFacets }}
          onFinish={(values) => handleFacetsForm(values)}
        >
          {facetsError && (
            <Alert
              message="Error"
              description="There was an issue fetching facets for this project. Please contact support for assistance or try again later"
              type="error"
              showIcon
            />
          )}
          {facetsIsLoading ? <Spin></Spin> : facetSection}
        </Form>
      </div>
      {!isEmpty(availableFacets) && !facetsIsLoading && (
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
  facetsForm: PropTypes.objectOf(PropTypes.any).isRequired,
  facetsIsLoading: PropTypes.bool,
  facetsError: PropTypes.string,
  handleFacetsForm: PropTypes.func.isRequired,
};

FacetsForm.defaultProps = {
  activeFacets: {},
  facetsIsLoading: undefined,
  facetsError: undefined,
};
export default FacetsForm;
