import React from 'react';
import { Form, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import Button from '../General/Button';

const styles = {
  searchForm: { marginTop: '1em' },
};

type Props = {
  activeProject: { [key: string]: string | number | [string] | undefined };
  projects: { [key: string]: string | number }[];
  onSearch: (text: string) => void;
  onProjectChange: (selectedProj?: { [key: string]: string | number }) => void;
};

const LeftMenu: React.FC<Props> = ({
  activeProject,
  projects,
  onSearch,
  onProjectChange,
}) => {
  const [form] = Form.useForm();
  const [text, setText] = React.useState('');

  /**
   * Sets the project and search value using the search form
   */
  const onFinish: (values: { [key: string]: string }) => void = (values) => {
    const selectedProj = projects.find((obj) => obj.name === values.project);

    /* istanbul ignore else */
    if (activeProject !== selectedProj) {
      onProjectChange(selectedProj);
    }

    onSearch(values.text);

    // Reset the controlled state and form field
    setText('');
    form.setFieldsValue({ text: '' });
  };

  return (
    <div data-testid="left-menu">
      <Form
        initialValues={{ project: projects[0].name }}
        style={styles.searchForm}
        form={form}
        onFinish={onFinish}
      >
        <Input.Group compact>
          <Form.Item
            name="project"
            rules={[{ required: true, message: 'Project is required' }]}
            style={{ width: '15%' }}
          >
            <Select>
              {projects.map((projObj) => (
                <Select.Option key={projObj.name} value={projObj.name}>
                  {projObj.name}
                </Select.Option>
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
};

export default LeftMenu;
