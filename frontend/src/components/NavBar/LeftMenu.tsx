import { SearchOutlined } from '@ant-design/icons';
import { Alert, Form, Input, Select, Space, Spin } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponseError } from '../../api';
import { navBarTargets } from '../../common/reactJoyrideSteps';
import { RawProject, RawProjects } from '../Facets/types';
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

const LeftMenu: React.FC<React.PropsWithChildren<Props>> = ({
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
        className={navBarTargets.topSearchBar.class()}
      >
        <Form
          initialValues={{
            projectTextInput: projects[0].name,
          }}
          style={styles.searchForm}
          form={form}
          onFinish={onFinish}
        >
          <Space size="small">
            <Form.Item
              name="projectTextInput"
              rules={[{ required: true, message: 'Project is required' }]}
            >
              <Select
                style={{ minWidth: '110px' }}
                options={projects.map((projObj) => {
                  return {
                    key: projObj.name,
                    value: projObj.name,
                    label: projObj.name,
                  };
                })}
              />
            </Form.Item>
            <Form.Item
              name="text"
              rules={[{ required: true, message: 'Text is required' }]}
            >
              <Input
                style={{ minWidth: '200px' }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search for a keyword"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              ></Button>
            </Form.Item>
          </Space>
        </Form>
      </div>
    );
  }

  return null;
};

export default LeftMenu;
