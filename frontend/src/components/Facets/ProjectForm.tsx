import { Alert, Form, Select, Spin } from 'antd';
import React from 'react';
import { ResponseError } from '../../api';
import { leftSidebarTargets } from '../../common/reactJoyrideSteps';
import { ActiveSearchQuery } from '../Search/types';
import { RawProject, RawProjects } from './types';

const styles = {
  form: { width: '360px' },
};

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  projectsFetched?: {
    results: RawProjects;
  };
  apiIsLoading: boolean;
  apiError?: ResponseError;
  onFinish: (selection: string) => void;
};

const ProjectsForm: React.FC<React.PropsWithChildren<Props>> = ({
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
    projectForm.submit();
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
    const projectOptions = results.map((project) => {
      return { value: project.name, label: project.name };
    });

    return (
      <div data-testid="project-form">
        <Form
          form={projectForm}
          layout="inline"
          size="small"
          initialValues={initialValues}
          onFinish={() => {
            onFinish(projectForm.getFieldValue('projectDropdown') as string);
          }}
        >
          <Form.Item
            data-testid="project-form-select"
            name="projectDropdown"
            initialValue={initialValues.project}
          >
            <Select
              className={leftSidebarTargets.selectProjectBtn.class()}
              style={styles.form}
              onChange={() => {
                projectForm.submit();
              }}
              options={projectOptions}
            />
          </Form.Item>
        </Form>
      </div>
    );
  }
  // Need to return an empty form to avoid linting errors
  return <Form form={projectForm}></Form>;
};

export default ProjectsForm;
