import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Form, Button, Divider, Select, Row, Col, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import humanize from '../../utils/utils';
import { fetchFacets } from '../../utils/api';

const { Option } = Select;

const styles = {
  facetCount: { float: 'right' },
};

function Facets({ projects, project, onProjectChange, onSetFacets }) {
  Facets.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    project: PropTypes.string.isRequired,
    onProjectChange: PropTypes.func.isRequired,
    onSetFacets: PropTypes.func.isRequired,
  };

  const [loadedFacets, setLoadedFacets] = React.useState({});

  const [selectedProject, setSelectedProject] = React.useState(project);
  const [loading, setLoading] = React.useState(true);
  const [form] = Form.useForm();

  React.useEffect(() => {
    setSelectedProject(project);
  }, [project]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      fetchFacets(selectedProject)
        .then((res) => {
          setLoadedFacets(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 1000);
    return () => {
      window.clearTimeout(id);
      setLoading(true);
    };
  }, [selectedProject]);

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

  if (loading) {
    return <Spin></Spin>;
  }

  return (
    <div data-testid="facets">
      <Row>
        <Col>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleOnFinish(values)}
          >
            <Form.Item label="Project">
              <Select
                defaultValue={selectedProject}
                style={{ width: '100%' }}
                onChange={(value) => setSelectedProject(value)}
                tokenSeparators={[',']}
                showArrow
              >
                {projects.map((projectName) => {
                  return <Option key={projectName}>{projectName}</Option>;
                })}
              </Select>
              <Alert
                message="Switching projects and applying facets will clear all applied constraints"
                type="warning"
                showIcon
              />
            </Form.Item>
            <Divider />
            {Object.keys(loadedFacets).map((key) => {
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
                    {loadedFacets[key].map((value) => {
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
            })}
            <Button type="primary" htmlType="submit">
              <FilterOutlined /> Apply Facets
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default Facets;
