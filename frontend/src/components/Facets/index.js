import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Form, Button, Divider, Select, Row, Col, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import { humanize, parseFacets } from '../../utils/utils';
import { fetchFacets, fetchProjects } from '../../utils/api';

const { Option } = Select;

const styles = {
  facetCount: { float: 'right' },
};

function Facets({ project, onProjectChange, onSetFacets }) {
  Facets.propTypes = {
    project: PropTypes.string.isRequired,
    onProjectChange: PropTypes.func.isRequired,
    onSetFacets: PropTypes.func.isRequired,
  };

  const [form] = Form.useForm();
  const [selectedProject, setSelectedProject] = React.useState('');
  const [parsedFacets, setParsedFacets] = React.useState([]);

  const {
    data: loadedProjects,
    error: projectsError,
    isLoading: projectsLoading,
  } = useAsync({
    promiseFn: fetchProjects,
  });

  const {
    data: loadedFacets,
    error: facetsError,
    isLoading: facetsLoading,
    run,
  } = useAsync({
    deferFn: fetchFacets,
  });

  React.useEffect(() => {
    if (project !== '') {
      setSelectedProject(project);
    }
  }, [project]);

  React.useEffect(() => {
    if (selectedProject !== '') {
      run(selectedProject);
    }
  }, [run, selectedProject]);

  React.useEffect(() => {
    if (loadedFacets) {
      setParsedFacets(parseFacets(loadedFacets.facet_counts.facet_fields));
    }
  }, [loadedFacets]);

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
                description="This was an issue fetching projects. Please contact support for assistance or try again later."
                type="error"
                showIcon
              />
            )}
            {projectsLoading ? (
              <Spin></Spin>
            ) : (
              !projectsError && (
                <Form.Item label="Project">
                  <Select
                    value={selectedProject}
                    style={{ width: '100%' }}
                    onChange={(value) => setSelectedProject(value)}
                    tokenSeparators={[',']}
                    showArrow
                  >
                    {loadedProjects.projects.map((projectName) => {
                      return <Option key={projectName}>{projectName}</Option>;
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
                description="This was an issue fetching facets for this project. Please contact support for assistance or try again later"
                type="error"
                showIcon
              />
            )}

            {facetsLoading ? (
              <Spin></Spin>
            ) : (
              !facetsError &&
              parsedFacets &&
              Object.keys(parsedFacets).map((key) => {
                return (
                  <Form.Item
                    style={{ marginBottom: '4px' }}
                    key={key}
                    name={key}
                    label={humanize(key)}
                  >
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      tokenSeparators={[',']}
                      showArrow
                    >
                      {parsedFacets[key].map((value) => {
                        return (
                          <Option key={value} value={value}>
                            {value[0]}
                            <span style={styles.facetCount}>({value[1]})</span>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                );
              })
            )}
            {!facetsError && parsedFacets && (
              <Button type="primary" htmlType="submit">
                <FilterOutlined /> Apply Facets
              </Button>
            )}
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default Facets;
