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

function Facets({ project, onProjectChange, onSetFacets }) {
  Facets.propTypes = {
    project: PropTypes.string.isRequired,
    onProjectChange: PropTypes.func.isRequired,
    onSetFacets: PropTypes.func.isRequired
  };

  const [facets, setFacets] = React.useState({});

  const [selectedProject, setSelectedProject] = React.useState(project);
  const [loading, setLoading] = React.useState(true);
  const projects = useProjects();
  const [form] = Form.useForm();

  React.useEffect(() => {
    setSelectedProject(project);
  }, [project]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      fetchFacets(selectedProject)
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
  }, [selectedProject]);

  const handleChangeProject = value => {
    setSelectedProject(projects[value]);
  };

  const onFinishForm = obj => {
    // TODO: Implement function to update object of applied facets that will
    // be used to run queries
    onProjectChange(selectedProject);

    Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
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
            onFinish={values => onFinishForm(values)}
          >
            <Form.Item name="project" label="Project">
              <Select
                defaultValue={selectedProject}
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
            <Divider />
            {Object.keys(facets).map((key, value) => {
              return (
                <Form.Item key={value} name={key} label={humanize(key)}>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    tokenSeparators={[","]}
                    showArrow={true}
                  >
                    {facets[key].map((value, index) => {
                      return (
                        <Option key={index} value={value}>
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
