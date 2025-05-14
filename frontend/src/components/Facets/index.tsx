import { Button, Tooltip, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useAtom, useAtomValue } from 'jotai';
import { fetchProjects, ResponseError } from '../../api';
import { objectIsEmpty, projectBaseQuery } from '../../common/utils';
import Divider from '../General/Divider';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { RawProject } from './types';
import {
  availableFacetsAtom,
  activeSearchQueryAtom,
  savedSearchQueryAtom,
} from '../../common/atoms';
import { leftSidebarTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

const styles = {
  form: {
    width: '100%',
  },
};

const Facets: React.FC = () => {
  const { data, error, isLoading } = useAsync(fetchProjects);

  const { Title } = Typography;

  const availableFacets = useAtomValue(availableFacetsAtom);

  const [activeSearchQuery, setActiveSearchQuery] = useAtom(activeSearchQueryAtom);

  const [savedSearchQuery, setSavedSearchQuery] = useAtom(savedSearchQueryAtom);

  const [curProject, setCurProject] = React.useState<RawProject>();

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
    /* istanbul ignore else */
    if (data) {
      const selectedProj: RawProject | undefined = data.results.find(
        (obj: RawProject) => obj.name === selectedProject
      );
      /* istanbul ignore else */
      if (selectedProj && activeSearchQuery.textInputs) {
        handleProjectChange(selectedProj);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && data && data.results.length > 0) {
      const findProj = data.results.find(
        (obj: RawProject) => obj.name === activeSearchQuery.project.name
      );

      const selectedProj: RawProject = findProj || data.results[0];
      setCurProject(selectedProj);
      handleProjectChange(selectedProj);
    }
  }, [isLoading]);

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
        <Tooltip title={curProject.projectUrl}>
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
      {!objectIsEmpty(availableFacets) && (
        <div className={leftSidebarTargets.searchFacetsForm.class()}>
          <FacetsForm />
        </div>
      )}
    </div>
  );
};

export default Facets;
