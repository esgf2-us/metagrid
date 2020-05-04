import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import Button from '../General/Button';

const { Option } = Select;
const styles = {
  searchForm: { marginTop: '1em' },
};
function LeftMenu({ project, projects, onSearch, onProjectChange }) {
  const [form] = Form.useForm();
  const [text, setText] = React.useState('');

  /**
   * Sets the project and search value using the search form
   * @param {*} values
   */
  const onFinish = (values) => {
    // TODO: Add catch if not found
    const selectedProj = projects.find((obj) => obj.name === values.project);
    if (project !== selectedProj) {
      onProjectChange(selectedProj);
    }

    onSearch(values.text);

    // Reset the controlled state and form field
    setText('');
    form.setFieldsValue({ text: '' });
  };

  return (
    <div data-testid="left-menu">
      <Form style={styles.searchForm} form={form} onFinish={onFinish}>
        <Input.Group compact>
          <Form.Item
            name="project"
            rules={[{ required: true, message: 'Project is required' }]}
            style={{ width: '15%' }}
          >
            <Select data-testid="project-select" placeholder="Project">
              {projects.map((projObj) => (
                <Option data-testid="project-option" key={projObj.name}>
                  {projObj.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="text"
            rules={[{ required: true, message: 'Text is required' }]}
            style={{ width: '70%' }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search..."
            />
          </Form.Item>

          <Form.Item style={{ width: '15%' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
            ></Button>
          </Form.Item>
        </Input.Group>
      </Form>
    </div>
  );
}

LeftMenu.propTypes = {
  project: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.objectOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ])
    )
  ).isRequired,
  onSearch: PropTypes.func.isRequired,
  onProjectChange: PropTypes.func.isRequired,
};

export default LeftMenu;
