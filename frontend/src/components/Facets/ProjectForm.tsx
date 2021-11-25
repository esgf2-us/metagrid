import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import React from 'react';
import { ResponseError } from '../../api';
import { mainTourTargets } from '../../common/reactJoyrideSteps';
import { objectIsEmpty } from '../../common/utils';
import Alert from '../Feedback/Alert';
import Popconfirm from '../Feedback/Popconfirm';
import Spin from '../Feedback/Spin';
import Button from '../General/Button';
import { ActiveSearchQuery } from '../Search/types';
import { RawProject, RawProjects } from './types';

const styles = {
  form: { width: '280px' },
};

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  projectsFetched?: {
    results: RawProjects;
  };
  apiIsLoading: boolean;
  apiError?: ResponseError;
  onFinish: (allValues: { [key: string]: string }) => void;
};

const ProjectsForm: React.FC<Props> = ({
  activeSearchQuery,
  projectsFetched,
  apiIsLoading,
  apiError,
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
  if (apiError) {
    return (
      <Form form={projectForm}>
        <Alert message={apiError.message} type="error" showIcon />
      </Form>
    );
  }

  if (apiIsLoading) {
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
          size="small"
          initialValues={initialValues}
          onFinish={onFinish}
        >
          <Form.Item
            name="project"
            rules={[{ required: true, message: 'Project is required' }]}
          >
            <Select
              data-testid="project-form-select"
              className={mainTourTargets.getClass('selectProjectBtn')}
              style={styles.form}
              showArrow
            >
              {results.map((projectObj: RawProject, index: number) => (
                <Select.Option key={projectObj.name} value={projectObj.name}>
                  <span data-testid={`project_${index}`}>
                    {projectObj.name}
                  </span>
                </Select.Option>
              ))}
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
                    className={mainTourTargets.getClass(
                      'projectSelectLeftSideBtn'
                    )}
                    type="primary"
                    htmlType="submit"
                    icon={<SelectOutlined />}
                  ></Button>
                </span>
              </Popconfirm>
            ) : (
              <Button
                className={mainTourTargets.getClass('projectSelectLeftSideBtn')}
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
