import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import React from 'react';
import { objectIsEmpty } from '../../common/utils';
import Alert from '../Feedback/Alert';
import Popconfirm from '../Feedback/Popconfirm';
import Spin from '../Feedback/Spin';
import Button from '../General/Button';
import { ActiveSearchQuery } from '../Search/types';
import { RawProject, RawProjects } from './types';

const styles = {
  form: { width: '256px' },
};

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  projectsFetched?: {
    results: RawProjects;
  };
  projectsIsLoading: boolean;
  projectsError?: Error;
  onFinish: (allValues: { [key: string]: string }) => void;
};

const ProjectsForm: React.FC<Props> = ({
  activeSearchQuery,
  projectsFetched,
  projectsIsLoading,
  projectsError,
  onFinish,
}) => {
  const [projectForm] = Form.useForm();
  /**
   * Reset projectForm based on the activeProject
   */
  React.useEffect(() => {
    projectForm.resetFields();
  }, [projectForm, activeSearchQuery.project]);

  // Note, have to wrap Alert and Spin with Form to suppress warning about
  // projectForm not being bound to a <Form/></Form> Instance
  if (projectsError) {
    return (
      <Form form={projectForm}>
        <Alert
          message="Error"
          description="There was an issue fetching projects. Please contact support for assistance or try again later."
          type="error"
          showIcon
        />
      </Form>
    );
  }

  if (projectsIsLoading) {
    return (
      <Form form={projectForm}>
        <Spin></Spin>
      </Form>
    );
  }

  if (projectsFetched) {
    const { results } = projectsFetched;
    const initialValues = {
      project:
        (activeSearchQuery.project as RawProject).name || results[0].name,
    };

    return (
      <div data-testid="project-form">
        <Form
          form={projectForm}
          layout="inline"
          initialValues={initialValues}
          onFinish={onFinish}
        >
          <Form.Item
            name="project"
            rules={[{ required: true, message: 'Project is required' }]}
          >
            <Select
              data-testid="project-form-select"
              style={styles.form}
              showArrow
            >
              {results.map((projectObj: RawProject, index: number) => {
                return (
                  <Select.Option key={projectObj.name} value={projectObj.name}>
                    <span data-testid={`project_${index}`}>
                      {projectObj.name}
                    </span>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            {!objectIsEmpty(activeSearchQuery.project) &&
            !objectIsEmpty(activeSearchQuery.activeFacets) ? (
              <Popconfirm
                title="Your filters will be cleared."
                onConfirm={() => projectForm.submit()}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                placement="right"
              >
                <span>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SelectOutlined />}
                  ></Button>
                </span>
              </Popconfirm>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                icon={<SelectOutlined />}
              ></Button>
            )}
          </Form.Item>
        </Form>
      </div>
    );
  }
  // Need to return an empty form to avoid linting errors
  return <Form form={projectForm}></Form>;
};

export default ProjectsForm;
