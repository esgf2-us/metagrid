import { Button, Tooltip, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useAtom } from 'jotai';
import { fetchProjects, ResponseError } from '../../api';
import { projectBaseQuery } from '../../common/utils';
import Divider from '../General/Divider';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { RawProject } from './types';
import {
  activeSearchQueryAtom,
  savedSearchQueryAtom,
  currentProjectAtom,
} from '../../common/atoms';
import { leftSidebarTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { useProjectsConfig } from '../../common/useProjectsConfig';

const styles = {
  form: {
    width: '100%',
  },
};

const Facets: React.FC = () => {
  const { config: projectsConfig, loading: configLoading } = useProjectsConfig();
  const { data, error, isLoading, run } = useAsync({
    deferFn: () => fetchProjects(projectsConfig),
  });

  React.useEffect(() => {
    if (!configLoading) {
      run();
    }
  }, [configLoading]);

  const { Title } = Typography;

  const [activeSearchQuery, setActiveSearchQuery] = useAtom(activeSearchQueryAtom);

  const [savedSearchQuery, setSavedSearchQuery] = useAtom(savedSearchQueryAtom);

  const [curProject, setCurProject] = useAtom(currentProjectAtom);

  const handleProjectChange = (selectedProject: RawProject): void => {
    if (savedSearchQuery) {
      setSavedSearchQuery(undefined);
      setCurProject(savedSearchQuery.project);
      setActiveSearchQuery(savedSearchQuery);
      return;
    }

    if (selectedProject.pk !== activeSearchQuery.project.pk) {
      setActiveSearchQuery(projectBaseQuery(selectedProject));
    } else {
      setActiveSearchQuery({ ...activeSearchQuery, project: selectedProject });
    }
    setCurProject(selectedProject);
  };

  const handleSubmitProjectForm = (selectedProject: string): void => {
    /* istanbul ignore else -- @preserve */
    if (data) {
      const selectedProj: RawProject | undefined = data.results.find(
        (obj: RawProject) => obj.name === selectedProject,
      );
      /* istanbul ignore else -- @preserve */
      if (selectedProj && activeSearchQuery.textInputs) {
        handleProjectChange(selectedProj);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && data && data.results.length > 0) {
      const findProj = data.results.find(
        (obj: RawProject) => obj.name === activeSearchQuery.project.name,
      );

      const selectedProj: RawProject = findProj || data.results[0];
      setCurProject(selectedProj);
      handleProjectChange(selectedProj);
    }
  }, [isLoading, data]);

  return (
    <div
      data-testid="search-facets"
      style={styles.form}
      className={leftSidebarTargets.leftSideBar.class()}
    >
      <Title level={5}>Select a Project</Title>
      <ProjectForm
        projectsFetched={data}
        apiIsLoading={isLoading}
        apiError={error as ResponseError}
        onFinish={handleSubmitProjectForm}
      />
      {curProject && curProject.projectUrl && (
        <Tooltip
          style={{ minWidth: '500px', width: '500px' }}
          title={
            <div>
              <b>Project Url</b>:<br />
              {curProject.projectUrl}
              <br />
              <br />
              <b>STAC Api Url</b>:<br /> https://integration-testing.api.stac.esgf-west.org
            </div>
          }
        >
          <Button
            href={curProject.projectUrl}
            className={leftSidebarTargets.projectWebsiteBtn.class()}
            target="_blank"
            style={{ marginTop: '10px' }}
          >
            {curProject.name} Data Info
          </Button>
        </Tooltip>
      )}
      <Divider />
      <div className={leftSidebarTargets.searchFacetsForm.class()}>
        <FacetsForm />
      </div>
    </div>
  );
};

export default Facets;
