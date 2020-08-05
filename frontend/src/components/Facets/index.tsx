import React from 'react';
import { useAsync } from 'react-async';
import { message } from 'antd';

import ProjectForm from './ProjectForm';
import FacetsForm from './FacetsForm';
import Divider from '../General/Divider';

import { fetchProjects } from '../../api';
import { isEmpty, shallowCompare } from '../../utils/utils';

const styles = {
  form: {
    width: '100%',
  },
};

export type Props = {
  activeProject: Project | Record<string, unknown>;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  availableFacets: ParsedFacets | Record<string, unknown>;
  handleProjectChange: (selectedProj: Project) => void;
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

    const newDefaults: DefaultFacets = { latest: true, replica: false };
    const { selectedDefaults } = newActive;
    // Pop selectedDefault keys from newActive since its values are declared
    // separately in a newDefaults
    delete newActive.selectedDefaults;

    selectedDefaults.forEach((facet) => {
      newDefaults[facet] = true;
    });

    // The form keeps a history of all selected facets, including when a
    // previously selected key goes from > 0 elements to 0 elements. Thus,
    // iterate through the object and delete the keys where the array's length
    // is equal to 0.
    Object.keys(newActive).forEach((key) => {
      if (newActive[key] === undefined || newActive[key].length === 0) {
        delete newActive[key];
      }
    });
    if (
      shallowCompare(newDefaults, defaultFacets) &&
      shallowCompare(newActive, activeFacets)
    ) {
      // eslint-disable-next-line no-void
      void message.error({
        content: 'Constraints already applied',
      });
    } else {
      onSetFacets(newDefaults, newActive);
    }
  };

  /**
   * Set the selectedProject by using the projectsFetched object
   */
  const handleProjectForm = (selectedProject: {
    [key: string]: string;
  }): void => {
    /* istanbul ignore else */
    if (data) {
      const selectedProj: Project | undefined = data.results.find(
        (obj: Project) => obj.name === selectedProject.project
      );
      /* istanbul ignore else */
      if (selectedProj) {
        handleProjectChange(selectedProj);
      }
    }
  };

  return (
    <div data-testid="facets" style={styles.form}>
      <div data-testid="projectForm">
        <ProjectForm
          activeProject={activeProject}
          activeFacets={activeFacets}
          projectsFetched={data}
          projectsIsLoading={isLoading}
          projectsError={error}
          handleProjectForm={handleProjectForm}
        />
      </div>
      <Divider />
      {!isEmpty(availableFacets) && (
        <FacetsForm
          defaultFacets={defaultFacets}
          activeFacets={activeFacets}
          availableFacets={availableFacets as ParsedFacets}
          handleFacetsForm={handleFacetsForm}
        />
      )}
    </div>
  );
};

export default Facets;
