import React from 'react';
import { useAsync } from 'react-async';
import { fetchProjects } from '../../api';
import { objectIsEmpty } from '../../common/utils';
import Divider from '../General/Divider';
import { NodeStatusArray } from '../NodeStatus/types';
import { ActiveSearchQuery, ResultType } from '../Search/types';
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
  onSetFacets: (resultType: ResultType, activeFacets: ActiveFacets) => void;
};

const Facets: React.FC<Props> = ({
  activeSearchQuery,
  availableFacets,
  nodeStatus,
  onProjectChange,
  onSetFacets,
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

  const handleUpdateFacetsForm = (selectedFacets: {
    resultType: ResultType;
    [key: string]: ResultType | ActiveFacets | [];
  }): void => {
    const { resultType: newResultType, ...newActiveFacets } = selectedFacets;

    // The form keeps a history of all selected facets, including when
    // facet keys change from > 0 elements to 0 elements (none selected) in the
    // array. To avoid including facet keys with 0 elements, iterate through the
    // object and delete them.
    Object.keys(newActiveFacets).forEach((key) => {
      if (
        newActiveFacets[key] === undefined ||
        newActiveFacets[key].length === 0
      ) {
        delete newActiveFacets[key];
      }
    });
    onSetFacets(newResultType, newActiveFacets as ActiveFacets);
  };

  return (
    <div data-testid="facets" style={styles.form}>
      <h2>Select a Project</h2>
      <div data-testid="projectForm">
        <ProjectForm
          activeSearchQuery={activeSearchQuery}
          projectsFetched={data}
          projectsIsLoading={isLoading}
          projectsError={error}
          onFinish={handleSubmitProjectForm}
        />
        <Divider />
      </div>
      {!objectIsEmpty(availableFacets) && (
        <>
          <h2>Filter with Facets</h2>
          <FacetsForm
            activeSearchQuery={activeSearchQuery}
            availableFacets={availableFacets as ParsedFacets}
            nodeStatus={nodeStatus}
            onValuesChange={handleUpdateFacetsForm}
          />
        </>
      )}
    </div>
  );
};

export default Facets;
