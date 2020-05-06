import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Form, Select, Row, Col } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Divider from '../General/Divider';
import Button from '../General/Button';
import Spin from '../Feedback/Spin';

import { isEmpty, humanize } from '../../utils/utils';
import { fetchBaseFacets, fetchProjects } from '../../utils/api';

const { Option } = Select;

const styles = {
  facetCount: { float: 'right' },
};

function Facets({
  activeProject,
  activeFacets,
  availableFacets,
  setAvailableFacets,
  onProjectChange,
  onSetActiveFacets,
}) {
  const [form] = Form.useForm();
  const [selectedProject, setSelectedProject] = React.useState({});

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
   * Reset the form fields based on the applied facets
   */
  React.useEffect(() => {
    form.resetFields();
  }, [form, activeFacets]);

  /**
   * Set the component's project state if project was set using the NavBar.
   */
  React.useEffect(() => {
    setSelectedProject(activeProject);
  }, [activeProject]);

  /**
   * Fetch facets when the selectedProject changes and there are no results
   */
  React.useEffect(() => {
    if (!isEmpty(selectedProject)) {
      run(selectedProject.facets_url);
    }
  }, [run, selectedProject]);

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
  const handleOnFinish = (selectedFacets) => {
    onProjectChange(selectedProject);
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
  const onProjectSelect = (name) => {
    const selectedProj = projectsFetched.results.find(
      (obj) => obj.name === name
    );
    setSelectedProject(selectedProj);
  };

  return (
    <div data-testid="facets">
      <Row>
        <Col>
          <Form
            form={form}
            layout="vertical"
            initialValues={activeFacets}
            onFinish={(values) => handleOnFinish(values)}
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
                <Form.Item label="Project">
                  <Select
                    value={activeProject.name}
                    style={{ width: '100%' }}
                    onChange={(value) => onProjectSelect(value)}
                    tokenSeparators={[',']}
                    showArrow
                  >
                    {projectsFetched.results.map((projectObj) => {
                      return (
                        <Option key={projectObj.name}>{projectObj.name}</Option>
                      );
                    })}
                  </Select>
                  <Alert
                    message="Switching projects and applying facets will clear all applied constraints"
                    type="warning"
                    showIcon
                  />
                </Form.Item>
              )
            )}

            <Divider />
            {facetsError && (
              <Alert
                message="Error"
                description="There was an issue fetching facets for this project. Please contact support for assistance or try again later"
                type="error"
                showIcon
              />
            )}

            {fetchingFacets ? (
              <Spin></Spin>
            ) : (
              !facetsError &&
              availableFacets &&
              Object.keys(availableFacets).map((facet) => {
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
                          <Option key={variable[0]} value={variable[0]}>
                            {variable[0]}
                            <span style={styles.facetCount}>
                              ({variable[1]})
                            </span>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                );
              })
            )}
            {!facetsError && !fetchingFacets && (
              <Button
                type="primary"
                htmlType="submit"
                icon={<FilterOutlined />}
              >
                Apply Facets
              </Button>
            )}
          </Form>
        </Col>
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
  setAvailableFacets: PropTypes.func.isRequired,
  onProjectChange: PropTypes.func.isRequired,
  onSetActiveFacets: PropTypes.func.isRequired,
};

export default Facets;
