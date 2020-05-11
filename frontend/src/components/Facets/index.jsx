import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Form } from 'antd';

import ProjectForm from './ProjectForm';
import FacetsForm from './FacetsForm';

import Divider from '../General/Divider';

import { isEmpty } from '../../utils/utils';
import { fetchBaseFacets, fetchProjects } from '../../utils/api';

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
  setAvailableFacets,
  onSetActiveFacets,
}) {
  const [projectForm] = Form.useForm();
  const [facetsForm] = Form.useForm();

  const {
    data: projectsFetched,
    error: projectsError,
    isLoading: projectsIsLoading,
  } = useAsync({
    promiseFn: fetchProjects,
  });

  const {
    data: facetsFetched,
    error: facetsError,
    isLoading: facetsIsLoading,
    run,
  } = useAsync({
    deferFn: fetchBaseFacets,
  });

  /**
   * Reset facetsForm based on the activeFacets
   */
  React.useEffect(() => {
    facetsForm.resetFields();
  }, [facetsForm, activeFacets]);

  /**
   * Reset projectForm based on the activeProject
   */
  React.useEffect(() => {
    projectForm.resetFields();
  }, [projectForm, activeProject]);

  /**
   * Fetch facets when the selectedProject changes and there are no results
   */
  React.useEffect(() => {
    if (!isEmpty(activeProject)) {
      run(activeProject.facets_url);
    }
  }, [run, activeProject]);

  /**
   * Parse facets UI friendly format when facetsFetched updates.
   */
  React.useEffect(() => {
    if (!isEmpty(facetsFetched)) {
      const facetFields = facetsFetched.facet_counts.facet_fields;
      setAvailableFacets(facetFields);
    }
  }, [setAvailableFacets, facetsFetched]);

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
    const selectedProj = projectsFetched.results.find(
      (obj) => obj.name === values.project
    );
    handleProjectChange(selectedProj);
  };

  return (
    <div data-testid="facets" style={styles.form}>
      <ProjectForm
        activeProject={activeProject}
        activeFacets={activeFacets}
        projectForm={projectForm}
        projectsFetched={projectsFetched}
        projectsIsLoading={projectsIsLoading}
        projectsError={projectsError}
        handleProjectForm={handleProjectForm}
      />
      <Divider />
      <FacetsForm
        availableFacets={availableFacets}
        facetsForm={facetsForm}
        facetsIsLoading={facetsIsLoading}
        facetsError={facetsError}
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
  setAvailableFacets: PropTypes.func.isRequired,
  onSetActiveFacets: PropTypes.func.isRequired,
};

export default Facets;
