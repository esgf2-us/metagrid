import React from 'react';
import { Form, Select } from 'antd';
import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Popconfirm from '../Feedback/Popconfirm';
import Spin from '../Feedback/Spin';

import { isEmpty } from '../../utils/utils';

const styles = {
  form: { width: '235px' },
};

type Props = {
  activeProject: { [key: string]: string | string[] };
  activeFacets: { [key: string]: string[] } | {};
  projectsFetched?: {
    results: { [key: string]: string | number }[];
  };
  projectsIsLoading?: boolean;
  projectsError?: Error;
  handleProjectForm: () => void;
};

const ProjectsForm: React.FC<Props> = ({
  activeProject,
  activeFacets,
  projectsFetched,
  projectsIsLoading,
  projectsError,
  handleProjectForm,
}) => {
  const [projectForm] = Form.useForm();
  /**
   * Reset projectForm based on the activeProject
   */
  React.useEffect(() => {
    projectForm.resetFields();
  }, [projectForm, activeProject]);

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
    return (
      <div data-testid="project-form">
        <Form
          form={projectForm}
          layout="inline"
          initialValues={{ project: activeProject.name }}
          onFinish={handleProjectForm}
          hideRequiredMark
        >
          <Form.Item
            name="project"
            rules={[{ required: true, message: 'Project is required' }]}
          >
            <Select
              data-testid="project-form-select"
              placeholder="Select a project"
              style={styles.form}
              showArrow
            >
              {projectsFetched.results.map(
                (
                  projectObj: { [key: string]: string | number },
                  index: number
                ) => {
                  return (
                    <Select.Option
                      key={projectObj.name}
                      value={projectObj.name}
                    >
                      <span data-testid={`project_${index}`}>
                        {projectObj.name}
                      </span>
                    </Select.Option>
                  );
                }
              )}
            </Select>
          </Form.Item>
          <Form.Item>
            {!isEmpty(activeProject) && !isEmpty(activeFacets) ? (
              <Popconfirm
                title="Your constraints will be cleared."
                onConfirm={() => projectForm.submit()}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                placement="right"
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SelectOutlined />}
                ></Button>
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
  return null;
};

export default ProjectsForm;
