import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select } from 'antd';
import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Popconfirm from '../Feedback/Popconfirm';
import Spin from '../Feedback/Spin';

import { isEmpty } from '../../utils/utils';

function ProjectsForm({
  activeProject,
  activeFacets,
  projectForm,
  projectsFetched,
  projectsIsLoading,
  projectsError,
  handleProjectForm,
}) {
  return (
    <div className="projectForm">
      <Form
        form={projectForm}
        layout="vertical"
        initialValues={{ project: activeProject.name }}
        onFinish={handleProjectForm}
        hideRequiredMark
      >
        {projectsError && (
          <Alert
            message="Error"
            description="There was an issue fetching projects. Please contact support for assistance or try again later."
            type="error"
            showIcon
          />
        )}
        {projectsIsLoading ? (
          <Spin></Spin>
        ) : (
          projectsFetched && (
            <Form.Item
              name="project"
              label="Project"
              rules={[{ required: true, message: 'Project is required' }]}
            >
              <Select style={{ width: '100%' }} showArrow>
                {projectsFetched.results.map((projectObj) => {
                  return (
                    <Select.Option
                      key={projectObj.name}
                      value={projectObj.name}
                    >
                      {projectObj.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          )
        )}

        {!isEmpty(activeProject) && !isEmpty(activeFacets) ? (
          <Popconfirm
            title="Your constraints will be cleared."
            onConfirm={() => projectForm.submit()}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            placement="right"
          >
            <Button type="primary" htmlType="submit" icon={<SelectOutlined />}>
              Select Project
            </Button>
          </Popconfirm>
        ) : (
          <Button type="primary" htmlType="submit" icon={<SelectOutlined />}>
            Select Project
          </Button>
        )}
      </Form>
    </div>
  );
}

ProjectsForm.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  activeFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)),
  projectsFetched: PropTypes.objectOf(PropTypes.any),
  projectForm: PropTypes.objectOf(PropTypes.any).isRequired,
  projectsIsLoading: PropTypes.bool,
  projectsError: PropTypes.string,
  handleProjectForm: PropTypes.func.isRequired,
};

ProjectsForm.defaultProps = {
  activeFacets: {},
  projectsFetched: undefined,
  projectsIsLoading: undefined,
  projectsError: undefined,
};
export default ProjectsForm;
