import React from "react";
import PropTypes from "prop-types";
import { Alert, Form, Button, Divider, Select, Row, Col, Spin } from "antd";
import { FilterOutlined } from "@ant-design/icons";

import { useProjects } from "../NavBar/index";
import { humanize } from "../../utils/utils";
import dbJson from "../../mocks/db.json";

const { Option } = Select;

const fetchFacets = async project => {
  // TODO: Call an API instead of mock data
  return JSON.parse(JSON.stringify(dbJson[project].facet_counts.facet_fields));
};

function Facets({ project, onProjectChange, onAddFacet }) {
  Facets.propTypes = {
    project: PropTypes.string.isRequired,
    onProjectChange: PropTypes.func.isRequired,
    onAddFacet: PropTypes.func.isRequired
  };

  const [facets, setFacets] = React.useState({});

  // TODO: Rename project from parent to currentProject. The facets component
  // should keep it's own project state so that facets dynamically render in the
  // component
  const [currentProject, setCurrentProject] = React.useState(project);
  const [loading, setLoading] = React.useState(true);
  const projects = useProjects();
  const [form] = Form.useForm();

  React.useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      fetchFacets(currentProject)
        .then(res => {
          setFacets(res);
          setLoading(false);
        })
        .catch(e => {
          console.warn("Error fetching data");
          setLoading(false);
        });
    }, 1000);
    return () => {
      window.clearTimeout(id);
      setLoading(true);
    };
  }, [currentProject]);

  const handleChangeProject = value => {
    setCurrentProject(projects[value]);
  };

  const handleSubmitFacets = () => {
    // TODO: Implement function to update object of applied facets that will
    // be used to run queries
    onProjectChange(currentProject);
  };

  if (loading) {
    return <Spin></Spin>;
  }

  return (
    <div>
      <Row>
        <Col>
          <Form form={form} layout="vertical">
            <Form.Item name="project" label="Project">
              <Select
                defaultValue={currentProject}
                style={{ width: "100%" }}
                onChange={handleChangeProject}
                tokenSeparators={[","]}
                showArrow={true}
              >
                {projects.map((project, index) => {
                  return <Option key={index}>{project}</Option>;
                })}
              </Select>
              <Alert
                message="Switching projects and applying facets will clear all applied constraints"
                type="warning"
                showIcon
              />
            </Form.Item>
            <Form.Item name="perPage" label="Results Per Page">
              <Select
                defaultValue={10}
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                showArrow={true}
              >
                {[10, 20, 30, 40, 50].map((project, index) => {
                  return (
                    <Option key={index} value={project}>
                      {project}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Form>
          <Divider />
          <Form form={form} layout="vertical">
            {Object.keys(facets).map((key, value) => {
              return (
                <Form.Item key={value} name={key} label={humanize(key)}>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    tokenSeparators={[","]}
                    showArrow={true}
                  >
                    {facets[key].map((child, index) => {
                      return <Option key={index}>{child}</Option>;
                    })}
                  </Select>
                </Form.Item>
              );
            })}
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => handleSubmitFacets()}
            >
              <FilterOutlined /> Apply Facets
            </Button>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default Facets;
