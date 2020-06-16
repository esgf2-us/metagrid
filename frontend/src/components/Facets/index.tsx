import React from 'react';
import { useAsync } from 'react-async';
import { message } from 'antd';

import ProjectForm from './ProjectForm';
import FacetsForm from './FacetsForm';
import Divider from '../General/Divider';

import { fetchProjects } from '../../utils/api';
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
  availableFacets: AvailableFacets | Record<string, unknown>;
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

    const newDefaults: DefaultFacets = { latest: false, replica: false };
    const { selectedDefaults } = newActive;
    // Pop selectedDefaults key since that sets the state for defaultFacets separately
    delete newActive.selectedDefaults;

    selectedDefaults.forEach((facet) => {
      newDefaults[facet] = true;
    });

    Object.keys(newActive).forEach(
      // eslint-disable-next-line no-param-reassign
      (key) => selectedFacets[key] === undefined && delete selectedFacets[key]
    );

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
          availableFacets={availableFacets as AvailableFacets}
          handleFacetsForm={handleFacetsForm}
        />
      )}
    </div>
  );
};

export default Facets;
