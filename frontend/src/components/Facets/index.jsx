import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Form, Select, Row, Col } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Divider from '../General/Divider';
import Button from '../General/Button';
import Spin from '../Feedback/Spin';
import { isEmpty, humanize, parseFacets } from '../../utils/utils';
import { fetchFacetsApi, fetchProjects } from '../../utils/api';

const { Option } = Select;

const styles = {
  facetCount: { float: 'right' },
};

function Facets({ project, onProjectChange, onSetFacets }) {
  const [form] = Form.useForm();
  const [selectedProject, setSelectedProject] = React.useState({});
  const [parsedFacets, setParsedFacets] = React.useState({});

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
    deferFn: fetchFacetsApi,
  });

  /**
   * Set the component's project state if project was set using the NavBar
   */
  React.useEffect(() => {
    setSelectedProject(project);
  }, [project]);

  /**
   * Fetch facets when the selectedProject changes
   */
  React.useEffect(() => {
    if (!isEmpty(selectedProject)) {
      run(selectedProject.facets_url);
    }
  }, [run, selectedProject]);

  React.useEffect(() => {
    if (!isEmpty(facetsFetched)) {
      const facetFields = facetsFetched.facet_counts.facet_fields;
      setParsedFacets(parseFacets(facetFields));
    }
  }, [facetsFetched]);

  const handleOnFinish = (obj) => {
    // TODO: Implement function to update object of applied facets that will
    // be used to run queries
    onProjectChange(selectedProject);

    Object.keys(obj).forEach(
      // eslint-disable-next-line no-param-reassign
      (key) => obj[key] === undefined && delete obj[key]
    );
    onSetFacets(obj);
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
                    value={project.name}
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
              parsedFacets &&
              Object.keys(parsedFacets).map((facet) => {
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
                      {parsedFacets[facet].map((variable) => {
                        return (
                          <Option key={variable} value={variable}>
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
  project: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  onProjectChange: PropTypes.func.isRequired,
  onSetFacets: PropTypes.func.isRequired,
};

export default Facets;
