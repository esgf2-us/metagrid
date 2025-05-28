import { Button, Tooltip, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { fetchProjects, ResponseError } from '../../api';
import { leftSidebarTargets } from '../../common/reactJoyrideSteps';
import { objectIsEmpty } from '../../common/utils';
import Divider from '../General/Divider';
import { ActiveSearchQuery } from '../Search/types';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { RawProject } from './types';
import {
  activeSearchQueryAtom,
  availableFacetsAtom,
  isSTACAtom,
  projectBaseQuery,
  savedSearchQueryAtom,
} from '../App/recoil/atoms';

const styles = {
  form: {
    width: '100%',
  },
};

const Facets: React.FC = () => {
  const { data, error, isLoading } = useAsync(fetchProjects);

  const { Title } = Typography;

  const availableFacets = useRecoilValue(availableFacetsAtom);

  const setIsStac = useSetRecoilState<boolean>(isSTACAtom);

  const [activeSearchQuery, setActiveSearchQuery] = useRecoilState<ActiveSearchQuery>(
    activeSearchQueryAtom
  );

  const [savedSearchQuery, setSavedSearchQuery] = useRecoilState<ActiveSearchQuery | null>(
    savedSearchQueryAtom
  );

  const [curProject, setCurProject] = React.useState<RawProject>();

  const handleProjectChange = (selectedProject: RawProject): void => {
    if (selectedProject.isSTAC) {
      setIsStac(true);
    }

    if (savedSearchQuery) {
      setSavedSearchQuery(null);
      setActiveSearchQuery(savedSearchQuery);
      return;
    }

    if (selectedProject.pk !== activeSearchQuery.project.pk) {
      setActiveSearchQuery(projectBaseQuery(selectedProject));
    } else {
      setActiveSearchQuery({ ...activeSearchQuery, project: selectedProject });
    }
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
        setCurProject(selectedProj);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && data && data.results.length > 0) {
      setCurProject(data.results[0]);
      handleProjectChange(data.results[0]);
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
        activeSearchQuery={activeSearchQuery}
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
