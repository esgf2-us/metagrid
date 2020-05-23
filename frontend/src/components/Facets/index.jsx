import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';

import ProjectForm from './ProjectForm';
import FacetsForm from './FacetsForm';
import Divider from '../General/Divider';

import { fetchProjects } from '../../utils/api';

const styles = {
  form: {
    width: '100%',
  },
};

function Facets({
  activeProject,
  activeFacets,
  availableFacets,
  handleProjectChange,
  onSetActiveFacets,
}) {
  const { data, error, isLoading } = useAsync({
    promiseFn: fetchProjects,
  });

  /**
   * Handles when the facets form is submitted.
   *
   * The object of applied facets and removes facets that
   * have a value of undefined (no variables applied).
   * @param {Object.<string, [string, number]} selectedFacets
   */
  const handleFacetsForm = (selectedFacets) => {
    Object.keys(selectedFacets).forEach(
      // eslint-disable-next-line no-param-reassign
      (key) => selectedFacets[key] === undefined && delete selectedFacets[key]
    );
    onSetActiveFacets(selectedFacets);
  };

  /**
   * Set the selectedProject by using the projectsFetched object
   * @param {string} name - name of the project
   */
  const handleProjectForm = (values) => {
    const selectedProj = data.results.find(
      (obj) => obj.name === values.project
    );
    handleProjectChange(selectedProj);
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
}

Facets.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  activeFacets: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)).isRequired,
  availableFacets: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any))
  ).isRequired,
  handleProjectChange: PropTypes.func.isRequired,
  onSetActiveFacets: PropTypes.func.isRequired,
};

export default Facets;
