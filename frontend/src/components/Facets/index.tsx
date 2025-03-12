import { Button, Tooltip, Typography } from 'antd';
import React, { useEffect } from 'react';
import { useAsync } from 'react-async';
import { useRecoilState } from 'recoil';
import { fetchProjects, ResponseError } from '../../api';
import { leftSidebarTargets } from '../../common/reactJoyrideSteps';
import { isStacProject, objectIsEmpty, STAC_PROJECTS } from '../../common/utils';
import Divider from '../General/Divider';
import { NodeStatusArray } from '../NodeStatus/types';
import { ActiveSearchQuery, ResultType, VersionDate, VersionType } from '../Search/types';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { ActiveFacets, ParsedFacets, RawProject } from './types';
import { isSTACmodeAtom } from '../App/recoil/atoms';

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

const Facets: React.FC<React.PropsWithChildren<Props>> = ({
  activeSearchQuery,
  availableFacets,
  nodeStatus,
  onProjectChange,
  onSetFilenameVars,
  onSetGeneralFacets,
  onSetActiveFacets,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);
  const [useSTAC, setUseSTAC] = useRecoilState(isSTACmodeAtom);

  const { Title } = Typography;

  const [curProject, setCurProject] = React.useState<RawProject>();

  const handleSubmitProjectForm = (selectedProject: string): void => {
    /* istanbul ignore else */
    if (data) {
      const selectedProj: RawProject | undefined = data.results.find(
        (obj: RawProject) => obj.name === selectedProject
      );
      /* istanbul ignore else */
      if (selectedProj && activeSearchQuery.textInputs) {
        if (isStacProject(selectedProj) && !useSTAC) {
          setUseSTAC(true);
        }
        onProjectChange(selectedProj);
        setCurProject(selectedProj);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && data && data.results.length > 0) {
      // Append STAC projects to fetched projects
      if (useSTAC) {
        data.results = [...STAC_PROJECTS];
      }

      setCurProject(data.results[0]);
      onProjectChange(data.results[0]);
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
          <FacetsForm
            activeSearchQuery={activeSearchQuery}
            availableFacets={availableFacets}
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
