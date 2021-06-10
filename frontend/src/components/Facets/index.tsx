import React from 'react';
import { useAsync } from 'react-async';
import { fetchProjects, ResponseError } from '../../api';
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
      }
    }
  };

  return (
    <div data-testid="facets" style={styles.form}>
      <h3>Select a Project</h3>
      <div data-testid="projectForm">
        <ProjectForm
          activeSearchQuery={activeSearchQuery}
          projectsFetched={data}
          apiIsLoading={isLoading}
          apiError={error as ResponseError}
          onFinish={handleSubmitProjectForm}
        />
        <Divider />
      </div>
      {!objectIsEmpty(availableFacets) && (
        <>
          <h3>Filter with Facets</h3>
          <FacetsForm
            activeSearchQuery={activeSearchQuery}
            availableFacets={availableFacets as ParsedFacets}
            nodeStatus={nodeStatus}
            onSetFilenameVars={onSetFilenameVars}
            onSetGeneralFacets={onSetGeneralFacets}
            onSetActiveFacets={onSetActiveFacets}
          />
        </>
      )}
    </div>
  );
};

export default Facets;
