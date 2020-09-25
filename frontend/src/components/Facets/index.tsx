import React from 'react';
import { useAsync } from 'react-async';
import { fetchProjects } from '../../api';
import { isEmpty } from '../../utils/utils';
import Divider from '../General/Divider';
import FacetsForm from './FacetsForm';
import ProjectForm from './ProjectForm';
import { ActiveFacets, DefaultFacets, ParsedFacets, RawProject } from './types';

const styles = {
  form: {
    width: '100%',
  },
};

export type Props = {
  activeProject: RawProject | Record<string, unknown>;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  availableFacets: ParsedFacets | Record<string, unknown>;
  handleProjectChange: (selectedProj: RawProject) => void;
  onSetFacets: (defaults: DefaultFacets, active: ActiveFacets) => void;
};

const Facets: React.FC<Props> = ({
  activeProject,
  defaultFacets,
  activeFacets,
  availableFacets,
  handleProjectChange,
  onSetFacets,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);

  /**
   * Handles when the facets form is submitted.
   */
  const handleFacetsForm = (selectedFacets: {
    [key: string]: string[] | [];
  }): void => {
    const newActive = selectedFacets;
    const { selectedDefaults } = newActive;
    delete newActive.selectedDefaults;

    const newDefaults: DefaultFacets = { latest: true, replica: false };

    // Test fails because ant design's form initialValues does not work after
    // the initial detection of value changes, so selectedDefaults becomes undefined.
    if (selectedDefaults) {
      selectedDefaults.forEach((facet) => {
        newDefaults[facet] = true;
      });
    }

    // The form keeps a history of all selected facets, including when a
    // previously selected key goes from > 0 elements to 0 elements. Thus,
    // iterate through the object and delete the keys where the array's length
    // is equal to 0.
    Object.keys(newActive).forEach((key) => {
      if (newActive[key] === undefined || newActive[key].length === 0) {
        delete newActive[key];
      }
    });
    onSetFacets(newDefaults, newActive);
  };

  /**
   * Handles the project form by setting the active project
   */
  const handleProjectForm = (selectedProject: {
    [key: string]: string;
  }): void => {
    /* istanbul ignore else */
    if (data) {
      const selectedProj: RawProject | undefined = data.results.find(
        (obj: RawProject) => obj.name === selectedProject.project
      );
      /* istanbul ignore else */
      if (selectedProj) {
        handleProjectChange(selectedProj);
      }
    }
  };

  return (
    <div data-testid="facets" style={styles.form}>
      <h2>Select a Project</h2>
      <div data-testid="projectForm">
        <ProjectForm
          activeProject={activeProject}
          activeFacets={activeFacets}
          projectsFetched={data}
          projectsIsLoading={isLoading}
          projectsError={error}
          handleProjectForm={handleProjectForm}
        />
        <Divider />
      </div>
      {!isEmpty(availableFacets) && (
        <>
          <h2>Filter with Facets</h2>
          <FacetsForm
            facetsByGroup={(activeProject as RawProject).facetsByGroup}
            defaultFacets={defaultFacets}
            activeFacets={activeFacets}
            availableFacets={availableFacets as ParsedFacets}
            handleFacetsForm={handleFacetsForm}
          />
        </>
      )}
    </div>
  );
};

export default Facets;
