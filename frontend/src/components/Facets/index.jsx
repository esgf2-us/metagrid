import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Form, Select, Row } from 'antd';
import { FilterOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Divider from '../General/Divider';
import Popconfirm from '../Feedback/Popconfirm';
import Spin from '../Feedback/Spin';

import { isEmpty, humanize } from '../../utils/utils';
import { fetchBaseFacets, fetchProjects } from '../../utils/api';

const styles = {
  form: { width: '100%' },
  facetCount: { float: 'right' },
};

function Facets({
  activeProject,
  activeFacets,
  availableFacets,
  handleProjectChange,
  setAvailableFacets,
  onSetActiveFacets,
}) {
  const [projectForm] = Form.useForm();
  const [facetsForm] = Form.useForm();

  const {
    data: projectsFetched,
    error: projectsError,
    isLoading: fetchingProjects,
  } = useAsync({
    promiseFn: fetchProjects,
  });

  const {
    data: facetsFetched,
    error: facetsError,
    isLoading: fetchingFacets,
    run,
  } = useAsync({
    deferFn: fetchBaseFacets,
  });

  /**
   * Reset facetsForm based on the activeFacets
   */
  React.useEffect(() => {
    facetsForm.resetFields();
  }, [facetsForm, activeFacets]);

  /**
   * Reset projectForm based on the activeProject
   */
  React.useEffect(() => {
    projectForm.resetFields();
  }, [projectForm, activeProject]);

  /**
   * Fetch facets when the selectedProject changes and there are no results
   */
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      run(activeProject.facets_url);
    }
  }, [run, activeProject]);

  /**
   * Parse facets UI friendly format when facetsFetched updates.
   */
  React.useEffect(() => {
    if (!isEmpty(facetsFetched)) {
      const facetFields = facetsFetched.facet_counts.facet_fields;
      setAvailableFacets(facetFields);
    }
  }, [setAvailableFacets, facetsFetched]);

  /**
   * Handles when the facets form is submitted.
   *
   * The object of applied facets and removes facets that
   * have a value of undefined (no variables applied).
   * @param {Object.<string, [string, number]} selectedFacets
   */
  const handleFacetsForm = (selectedFacets) => {
    Object.keys(selectedFacets).forEach(
      // eslint-disable-next-line no-param-reassign
      (key) => selectedFacets[key] === undefined && delete selectedFacets[key]
    );
    onSetActiveFacets(selectedFacets);
  };

  /**
   * Set the selectedProject by using the projectsFetched object
   * @param {string} name - name of the project
   */
  const handleProjectForm = (values) => {
    const selectedProj = projectsFetched.results.find(
      (obj) => obj.name === values.project
    );
    handleProjectChange(selectedProj);
  };

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
        <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
          Apply Facets
        </Button>
      </>
    );
  }

  return (
    <div data-testid="facets">
      <Row>
        <Form
          style={styles.form}
          form={projectForm}
          layout="vertical"
          initialValues={{ project: activeProject.name }}
          onFinish={handleProjectForm}
          hideRequiredMark
        >
          {projectsError && (
            <Alert
              message="Error"
              description="There was an issue fetching projects. Please contact support for assistance or try again later."
              type="error"
              showIcon
            />
          )}
          {fetchingProjects ? (
            <Spin></Spin>
          ) : (
            !projectsError && (
              <Form.Item
                name="project"
                label="Project"
                rules={[{ required: true, message: 'Project is required' }]}
              >
                <Select style={{ width: '100%' }} showArrow>
                  {projectsFetched.results.map((projectObj) => {
                    return (
                      <Select.Option
                        key={projectObj.name}
                        value={projectObj.name}
                      >
                        {projectObj.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
            )
          )}

          {!isEmpty(activeProject) && !isEmpty(activeFacets) ? (
            <Popconfirm
              title="Your constraints will be cleared."
              onConfirm={() => projectForm.submit()}
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              placement="right"
            >
              <Button
                type="primary"
                htmlType="submit"
                icon={<FilterOutlined />}
              >
                Select Project
              </Button>
            </Popconfirm>
          ) : (
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
              Select Project
            </Button>
          )}
        </Form>
        <Divider />

        <Form
          form={facetsForm}
          style={styles.form}
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
          {fetchingFacets ? <Spin></Spin> : facetSection}
        </Form>
      </Row>
    </div>
  );
}

Facets.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  activeFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)).isRequired,
  availableFacets: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
  ).isRequired,
  handleProjectChange: PropTypes.func.isRequired,
  setAvailableFacets: PropTypes.func.isRequired,
  onSetActiveFacets: PropTypes.func.isRequired,
};

export default Facets;
