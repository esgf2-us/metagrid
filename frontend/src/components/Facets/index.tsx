import React from 'react';
import { useAsync } from 'react-async';

import ProjectForm from './ProjectForm';
import FacetsForm from './FacetsForm';
import Divider from '../General/Divider';

import { fetchProjects } from '../../utils/api';

const styles = {
  form: {
    width: '100%',
  },
};

export type Props = {
  activeProject: Project | {};
  activeFacets: ActiveFacets | {};
  availableFacets: AvailableFacets | {};
  handleProjectChange: (selectedProj: Project) => void;
  onSetActiveFacets: (allValues: ActiveFacets) => void;
};

const Facets: React.FC<Props> = ({
  activeProject,
  activeFacets,
  availableFacets,
  handleProjectChange,
  onSetActiveFacets,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);

  /**
   * Handles when the facets form is submitted.
   */
  const handleFacetsForm = (selectedFacets: {
    [key: string]: string[] | [];
  }): void => {
    Object.keys(selectedFacets).forEach(
      // eslint-disable-next-line no-param-reassign
      (key) => selectedFacets[key] === undefined && delete selectedFacets[key]
    );
    onSetActiveFacets(selectedFacets);
  };

  /**
   * Set the selectedProject by using the projectsFetched object
   */
  const handleProjectForm = (selectedProject: {
    [key: string]: string;
  }): void => {
    if (data) {
      const selectedProj: Project | undefined = data.results.find(
        (obj: Project) => obj.name === selectedProject.project
      );
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
      <FacetsForm
        activeFacets={activeFacets}
        availableFacets={availableFacets}
        handleFacetsForm={handleFacetsForm}
      />
    </div>
  );
};

export default Facets;
