import { SearchOutlined } from '@ant-design/icons';
import { Form, Input, Select, Spin } from 'antd';
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ResponseError } from '../../api';
import { navBarTargets } from '../../common/reactJoyrideSteps';
import { RawProject, RawProjects } from '../Facets/types';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';

const styles = {
  spin: { display: 'flex', justifyContent: 'center' },
  searchForm: { marginTop: '1em' },
};

export type Props = {
  projects?: RawProjects;
  apiError?: ResponseError;
  apiIsLoading?: boolean;
  onTextSearch: (selectedProject: RawProject, text: string) => void;
};

const LeftMenu: React.FC<Props> = ({
  projects,
  apiError,
  apiIsLoading,
  onTextSearch,
}) => {
  const [form] = Form.useForm();
  const [text, setText] = React.useState('');
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Sets the project and search value using the search form.
   * If the current route is not on search, push route update.
   */
  const onFinish = (values: { [key: string]: string }): void => {
    /* istanbul ignore else */
    if (!location.pathname.endsWith('search')) {
      navigate('/search');
    }

    const selectedProj: RawProject | undefined = (projects as RawProjects).find(
      (obj) => obj.name === values.projectTextInput
    );

    onTextSearch(selectedProj as RawProject, values.text);

    // Reset the controlled state and form field
    setText('');
    form.setFieldsValue({ text: '' });
  };

  if (apiError) {
    return <Alert message={apiError.message} type="error" showIcon />;
  }

  if (apiIsLoading) {
    return (
      <Form form={form}>
        <Spin style={styles.spin}></Spin>
      </Form>
    );
  }

  if (projects) {
    return (
      <div
        data-testid="left-menu"
        className={navBarTargets.getClass('topSearchBar')}
      >
        <Form
          initialValues={{
            projectTextInput: projects[0].name,
          }}
          style={styles.searchForm}
          form={form}
          onFinish={onFinish}
        >
          <Link to="https://esgf.github.io/nodes.html">Federated Nodes</Link>
          &nbsp;
          <Input.Group compact>
            <Form.Item
              name="projectTextInput"
              rules={[{ required: true, message: 'Project is required' }]}
              style={{ width: '15%', minWidth: '100px' }}
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
              style={{ width: '40%' }}
            >
              <Input
                width="50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search for a keyword"
              />
            </Form.Item>
            <Form.Item style={{ width: '15px' }}>
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

  return null;
};

export default LeftMenu;
