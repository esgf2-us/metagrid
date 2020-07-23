"""
This script inserts projects and associated facet models in the database.
It is called automatically using RunPython inside a migration file when
the database is built.

https://docs.djangoproject.com/en/3.0/topics/migrations/#data-migrations
"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from metagrid.projects.models import Facet, Project

# Facets are pulled from ESGF Search API JSON results
projects = [
    {
        "name": "CMIP6",
        "full_name": "Coupled Model Intercomparison Project Phase 6",
        "description": "The Coupled Model Intercomparison Project, which began in 1995 under the auspices of the World Climate Research Programme (WCRP), is now in its sixth phase (CMIP6). CMIP6 coordinates somewhat independent model intercomparison activities and their experiments which have adopted a common infrastructure for collecting, organizing, and distributing output from models performing common sets of experiments. The simulation data produced by models under previous phases of CMIP have been used in thousands of research papers (some of which are listed here), and the multi-model results provide some perspective on errors and uncertainty in model simulations. This information has proved invaluable in preparing high profile reports assessing our understanding of climate and climate change (e.g., the IPCC Assessment Reports).",
        "facets": [
            "mip_era",
            "activity_id",
            "model_cohort",
            "product",
            "source_id",
            "institution_id",
            "source_type",
            "nominal_resolution",
            "experiment_id",
            "sub_experiment_id",
            "variant_label",
            "grid_label",
            "table_id",
            "frequency",
            "realm",
            "variable_id",
            "cf_standard_name",
            "data_node",
        ],
    },
    {
        "name": "CMIP5",
        "full_name": "Coupled Model Intercomparison Project Phase 5",
        "description": "Under the World Climate Research Programme (WCRP) the Working Group on Coupled Modelling (WGCM) established the Coupled Model Intercomparison Project (CMIP) as a standard experimental protocol for studying the output of coupled atmosphere-ocean general circulation models (AOGCMs). CMIP provides a community-based infrastructure in support of climate model diagnosis, validation, intercomparison, documentation and data access. This framework enables a diverse community of scientists to analyze GCMs in a systematic fashion, a process which serves to facilitate model improvement. Virtually the entire international climate modeling community has participated in this project since its inception in 1995. The Program for Climate Model Diagnosis and Intercomparison (PCMDI) archives much of the CMIP data and provides other support for CMIP. PCMDI's CMIP effort is funded by the Regional and Global Climate Modeling (RGCM) Program of the Climate and Environmental Sciences Division of the U.S. Department of Energy's Office of Science, Biological and Environmental Research (BER) program.",
        "facets": [
            "project",
            "product",
            "institute",
            "model",
            "experiment",
            "experiment_family",
            "time_frequency",
            "realm",
            "cmor_table",
            "ensemble",
            "variable",
            "variable_long_name",
            "cf_standard_name",
            "data_node",
        ],
    },
    {
        "name": "E3SM",
        "full_name": "Energy Exascale Earth System Model",
        "description": "The Energy Exascale Earth System Model (E3SM), formerly known as Accelerated Climate Modeling for Energy (ACME) project is an ongoing, state-of-the-science Earth system modeling, simulation, and prediction project, sponsored by the U.S. Department of Energy’s (DOE’s) Office of Biological and Environmental Research (BER), that optimizes the use of DOE laboratory computational resources to meet the science needs of the nation and the mission needs of DOE.",
        "facets": [
            "experiment",
            "science_driver",
            "realm",
            "model_version",
            "regridding",
            "time_frequency",
            "data_type",
            "ensemble_member",
            "tuning",
            "campaign",
            "period",
            "atmos_grid_resolution",
            "ocean_grid_resolution",
            "land_grid_resolution",
            "seaice_grid_resolution",
        ],
    },
    {
        "name": "CMIP3",
        "full_name": "Coupled Model Intercomparison Project Phase 3",
        "description": "n response to a proposed activity of the World Climate Research Programme's (WCRP's) Working Group on Coupled Modelling (WGCM), PCMDI volunteered to collect model output contributed by leading modeling centers around the world. Climate model output from simulations of the past, present and future climate was collected by PCMDI mostly during the years 2005 and 2006, and this archived data constitutes phase 3 of the Coupled Model Intercomparison Project (CMIP3). In part, the WGCM organized this activity to enable those outside the major modeling centers to perform research of relevance to climate scientists preparing the Fourth Asssessment Report (AR4) of the Intergovernmental Panel on Climate Change (IPCC). The IPCC was established by the World Meteorological Organization and the United Nations Environmental Program to assess scientific information on climate change. The IPCC publishes reports that summarize the state of the science.",
        "facets": [
            "variable",
            "model",
            "experiment",
            "realm",
            "institute",
            "time_frequency",
            "ensemble",
        ],
    },
    {
        "name": "input4MIPs",
        "full_name": "input datasets for Model Intercomparison Projects",
        "description": "input4MIPS (input datasets for Model Intercomparison Projects) is an activity to make available via ESGF the boundary condition and forcing datasets needed for CMIP6. Various datasets are needed for the pre-industrial control (piControl), AMIP, and historical simulations, and additional datasets are needed for many of the CMIP6-endorsed model intercomparison projects (MIPs) experiments. Earlier versions of many of these datasets were used in the 5th Coupled Model Intercomparison Project (CMIP5).",
        "facets": [
            "mip_era",
            "target_mip_list",
            "institution_id",
            "source_id",
            "source_version",
            "dataset_category",
            "variable_id",
            "grid_label",
            "nominal_resolution",
            "frequency",
            "realm",
            "data_node",
            "dataset_status",
        ],
    },
    {
        "name": "obs4MIPS",
        "full_name": "observations for Model Intercomparison Projects",
        "description": "Obs4MIPs (Observations for Model Intercomparisons Project) is an activity to make observational products more accessible for climate model intercomparisons via the same searchable distributed system used to serve and disseminate the rapidly expanding set of  simulations made available for community research.",
        "facets": [
            "source_id",
            "product",
            "realm",
            "variable",
            "variable_long_name",
            "cf_standard_name",
            "data_node",
            "institute",
            "time_frequency",
            "institution_id",
            "frequency",
            "grid_label",
            "nominal_resolution",
            "region",
            "source_type",
            "variant_label",
        ],
    },
]


def insert_data(apps, schema_editor):
    # We can't import the Project and Facet models directly as it may be
    # a newer version than this migration expects. We use the historical
    # version.
    ProjectModel = apps.get_model("projects", "Project")  # type: Project
    FacetModel = apps.get_model("projects", "Facet")  # type: Facet

    for project in projects:
        new_project = ProjectModel(
            name=project.get("name"),
            full_name=project.get("full_name"),
            description=project.get("description"),
        )
        new_project.save()

        facets = project.get("facets", [])
        for facet in facets:
            FacetModel(name=facet, project=new_project).save()
