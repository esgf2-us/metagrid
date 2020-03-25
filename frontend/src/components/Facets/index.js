import React from "react";
import PropTypes from "prop-types";
import { Form, Button, Checkbox, Select, Row, Col, Spin } from "antd";
import { FilterOutlined } from "@ant-design/icons";

import facetsJson from "../../facets.json";

const { Option } = Select;
const CheckboxGroup = Checkbox.Group;

function fetchFacets() {
  // TODO: Call an API instead of mock data
  return JSON.parse(JSON.stringify(facetsJson));
}

function Facets({ onAddFacet }) {
  Facets.propTypes = {
    onAddFacet: PropTypes.func.isRequired
  };

  const [facets, setFacets] = React.useState([]);

  // TODO: Combine with facets
  const [checkedList, setCheckedList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [form] = Form.useForm();

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setFacets(() => fetchFacets());
      setLoading(false);
    }, 1000);
    return () => {
      window.clearTimeout(id);
      setLoading(true);
    };

  }, []);

  const handleChange = value => {
    // TODO: Implement this method
    console.log(`selected ${value}`);
  };

  const onChange = checkedList => {
    setCheckedList(checkedList);
  };

  if (loading) {
    return <Spin></Spin>;
  }

  return (
    <div>
      <Row>
        <Col>
          <Form form={form} layout="vertical">
            <Form.Item name="sourceid" label="Source ID">
              <Select
                mode="tags"
                style={{ width: "100%" }}
                onChange={handleChange}
                tokenSeparators={[","]}
                showArrow={true}
              >
                {facets.source_ids.map((child, index) => {
                  return <Option key={index}>{child}</Option>;
                })}
              </Select>
            </Form.Item>

            <Form.Item name="sourceid" label="Source ID">
              <CheckboxGroup
                options={facets.source_ids}
                value={checkedList}
                onChange={onChange}
              />
            </Form.Item>
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
