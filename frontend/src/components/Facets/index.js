import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Form, Button, Divider, Select, Row, Col, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

import { humanize } from '../../utils/utils';
import dbJson from '../../mocks/db.json';

const { Option } = Select;

const fetchFacets = async (project) => {
  // TODO: Call an API instead of mock data
  return JSON.parse(JSON.stringify(dbJson[project].facet_counts.facet_fields));
};

function Facets({ projects, project, onProjectChange, onSetFacets }) {
  Facets.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    project: PropTypes.string.isRequired,
    onProjectChange: PropTypes.func.isRequired,
    onSetFacets: PropTypes.func.isRequired,
  };

  const [facets, setFacets] = React.useState({});

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
          setFacets(res);
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

  const handleChangeProject = (value) => {
    setSelectedProject(projects[value]);
  };

  const onFinishForm = (obj) => {
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
    <div>
      <Row>
        <Col>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => onFinishForm(values)}
          >
            <Form.Item name="project" label="Project">
              <Select
                defaultValue={selectedProject}
                style={{ width: '100%' }}
                onChange={handleChangeProject}
                tokenSeparators={[',']}
                showArrow
              >
                {projects.map((projectName) => {
                  return <Option key={projectName}>{project}</Option>;
                })}
              </Select>
              <Alert
                message="Switching projects and applying facets will clear all applied constraints"
                type="warning"
                showIcon
              />
            </Form.Item>
            <Divider />
            {Object.keys(facets).map((key) => {
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
                    {facets[key].map((value) => {
                      return (
                        <Option key={value} value={value}>
                          {value}
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
