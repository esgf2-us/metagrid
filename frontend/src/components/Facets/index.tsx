import { Button, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { fetchProjects, ResponseError } from '../../api';
import { leftSidebarTargets } from '../../common/reactJoyrideSteps';
import { objectIsEmpty } from '../../common/utils';
import Divider from '../General/Divider';
import { NodeStatusArray } from '../NodeStatus/types';
import {
  ActiveSearchQuery,
  ResultType,
  VersionDate,
  VersionType,
} from '../Search/types';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { ActiveFacets, ParsedFacets, RawProject } from './types';

const styles = {
  form: {
    width: '100%',
  },
};

export type Props = {
  activeSearchQuery: ActiveSearchQuery;
  availableFacets: ParsedFacets | Record<string, unknown>;
  nodeStatus?: NodeStatusArray;
  onProjectChange: (selectedProj: RawProject) => void;
  onSetFilenameVars: (filenameVar: string) => void;
  onSetGeneralFacets: (
    versionType: VersionType,
    resultType: ResultType,
    minVersionDate: VersionDate,
    maxVersionDate: VersionDate
  ) => void;
  onSetActiveFacets: (activeFacets: ActiveFacets) => void;
};

const Facets: React.FC<Props> = ({
  activeSearchQuery,
  availableFacets,
  nodeStatus,
  onProjectChange,
  onSetFilenameVars,
  onSetGeneralFacets,
  onSetActiveFacets,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);

  const [curProject, setCurProject] = React.useState<RawProject>();

  const handleSubmitProjectForm = (selectedProject: {
    [key: string]: string;
  }): void => {
    /* istanbul ignore else */
    if (data) {
      const selectedProj: RawProject | undefined = data.results.find(
        (obj: RawProject) => obj.name === selectedProject.project
      );
      /* istanbul ignore else */
      if (selectedProj) {
        onProjectChange(selectedProj);
        setCurProject(selectedProj);
      }
    }
  };

  useEffect(() => {
    /* istanbul ignore else */
    if (activeSearchQuery.project) {
      setCurProject(activeSearchQuery.project as RawProject);
    }
  }, [activeSearchQuery]);

  return (
    <div
      data-testid="facets"
      style={styles.form}
      className={leftSidebarTargets.leftSideBar.class()}
    >
      <h3>Select a Project</h3>
      <div data-testid="projectForm">
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
              {curProject.name} Website
            </Button>
          </Tooltip>
        )}
        <Divider />
      </div>
      {!objectIsEmpty(availableFacets) && (
        <div className={leftSidebarTargets.searchFacetsForm.class()}>
          <FacetsForm
            activeSearchQuery={activeSearchQuery}
            availableFacets={availableFacets as ParsedFacets}
            nodeStatus={nodeStatus}
            onSetFilenameVars={onSetFilenameVars}
            onSetGeneralFacets={onSetGeneralFacets}
            onSetActiveFacets={onSetActiveFacets}
          />
        </div>
      )}
    </div>
  );
};

export default Facets;
