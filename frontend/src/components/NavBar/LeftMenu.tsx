import { SearchOutlined } from '@ant-design/icons';
import { Form, Input, Select } from 'antd';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { RawProject, RawProjects } from '../Facets/types';
import Button from '../General/Button';

const styles = {
  searchForm: { marginTop: '1em' },
};

export type Props = {
  activeProject: RawProject | Record<string, unknown>;
  projects: RawProjects;
  onSearch: (text: string) => void;
  onProjectChange: (selectedProj: RawProject) => void;
};

const LeftMenu: React.FC<Props> = ({
  activeProject,
  projects,
  onSearch,
  onProjectChange,
}) => {
  const [form] = Form.useForm();
  const [text, setText] = React.useState('');
  const history = useHistory();

  /**
   * Sets the project and search value using the search form.
   * If the current route is not on search, push route update.
   */
  const onFinish = (values: { [key: string]: string }): void => {
    /* istanbul ignore else */
    if (!history.location.pathname.endsWith('search')) {
      history.push('/search');
    }

    const selectedProj: RawProject | undefined = projects.find(
      (obj) => obj.name === values.project
    );

    /* istanbul ignore else */
    if (selectedProj && activeProject !== selectedProj) {
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
              placeholder="Search for a keyword"
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
