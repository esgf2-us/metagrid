"""
This script inserts projects and associated models in the database.
It is called automatically using RunPython inside a migration file when
the database is built.

https://docs.djangoproject.com/en/3.0/topics/migrations/#data-migrations
"""

# Used to organize facets into groups
GROUPS = [
    "General",
    "Identifiers",
    "Resolutions",
    "Labels",
    "Classifications",
    "CMIP5",
    "CMIP6",
]

# Description of the facet group
group_descriptions = {
    GROUPS[0]: "Least verbose, typically returns many results",
    GROUPS[1]: "Activities, sources, institutions and experiments",
    GROUPS[2]: "Simulation resolutions",
    GROUPS[3]: "Variants and grids",
    GROUPS[4]: "Variables and realms",
    GROUPS[5]: "CMIP5 era facets",
    GROUPS[6]: "CMIP6 era facets",
}

# Projects used to populate the database for metagrid

"""NOTES: Each group in a project must have a unique set of facets.
No facets should be in two different groups within the same project,
otherwise the migration may fail due to the unique constraint."""
projects = [
    {
        "name": "CMIP6",
        "full_name": "Coupled Model Intercomparison Project Phase 6",
        "project_url": "https://pcmdi.llnl.gov/CMIP6/",
        "description": (
            "The Coupled Model Intercomparison Project, which began in 1995 under the "
            "auspices of the World Climate Research Programme (WCRP), is now in its sixth "
            "phase (CMIP6). CMIP6 coordinates somewhat independent model intercomparison "
            "activities and their experiments which have adopted a common infrastructure "
            "for collecting, organizing, and distributing output from models performing "
            "common sets of experiments. The simulation data produced by models under "
            "previous phases of CMIP have been used in thousands of research papers (some "
            "of which are listed here), and the multi-model results provide some perspective "
            "on errors and uncertainty in model simulations. This information has proved "
            "invaluable in preparing high profile reports assessing our understanding of "
            "climate and climate change (e.g., the IPCC Assessment Reports)."
        ),
        "facets_by_group": {
            GROUPS[0]: ["activity_id", "data_node"],
            GROUPS[1]: [
                "source_id",
                "institution_id",
                "source_type",
                "experiment_id",
                "sub_experiment_id",
            ],
            GROUPS[2]: ["nominal_resolution"],
            GROUPS[3]: ["variant_label", "grid_label"],
            GROUPS[4]: [
                "table_id",
                "frequency",
                "realm",
                "variable_id",
                "cf_standard_name",
            ],
        },
    },
    {
        "name": "CMIP6Plus",
        "full_name": "Coupled Model Intercomparison Project Phase 6 Plus",
        "project_url": "https://wcrp-cmip.org/cmip-overview/",
        "description": (
            "Follow-up to CMIP6 with closely matching configuration. Description of CMIP6 Plus needed."
        ),
        "facets_by_group": {
            GROUPS[0]: ["activity_id", "data_node"],
            GROUPS[1]: [
                "source_id",
                "institution_id",
                "source_type",
                "experiment_id",
                "sub_experiment_id",
            ],
            GROUPS[2]: ["nominal_resolution"],
            GROUPS[3]: ["variant_label", "grid_label"],
            GROUPS[4]: [
                "table_id",
                "frequency",
                "realm",
                "variable_id",
                "cf_standard_name",
            ],
        },
    },
    {
        "name": "CMIP5",
        "full_name": "Coupled Model Intercomparison Project Phase 5",
        "project_url": "https://pcmdi.llnl.gov/mips/cmip5/",
        "description": (
            "Under the World Climate Research Programme (WCRP) the Working Group on Coupled "
            "Modelling (WGCM) established the Coupled Model Intercomparison Project (CMIP) as "
            "a standard experimental protocol for studying the output of coupled atmosphere-ocean "
            "general circulation models (AOGCMs). CMIP provides a community-based infrastructure "
            "in support of climate model diagnosis, validation, intercomparison, documentation and "
            "data access. This framework enables a diverse community of scientists to analyze GCMs "
            "in a systematic fashion, a process which serves to facilitate model improvement. Virtually "
            "the entire international climate modeling community has participated in this project since "
            "its inception in 1995. The Program for Climate Model Diagnosis and Intercomparison (PCMDI) "
            "archives much of the CMIP data and provides other support for CMIP. PCMDI's CMIP effort is "
            "funded by the Regional and Global Climate Modeling (RGCM) Program of the Climate and Environmental "
            "Sciences Division of the U.S. Department of Energy's Office of Science, Biological and Environmental "
            "Research (BER) program."
        ),
        "facets_by_group": {
            GROUPS[0]: [
                "project",
                "product",
                "institute",
                "model",
                "data_node",
            ],
            GROUPS[1]: ["experiment", "experiment_family"],
            GROUPS[4]: [
                "time_frequency",
                "realm",
                "cmor_table",
                "ensemble",
                "variable",
                "variable_long_name",
                "cf_standard_name",
            ],
        },
    },
    {
        "name": "E3SM",
        "full_name": "Energy Exascale Earth System Model",
        "project_url": "https://e3sm.org/",
        "description": (
            "The Energy Exascale Earth System Model (E3SM), formerly known as Accelerated Climate Modeling for "
            "Energy (ACME) project is an ongoing, state-of-the-science Earth system modeling, simulation, and "
            "prediction project, sponsored by the U.S. Department of Energy's (DOE's) Office of Biological and "
            "Environmental Research (BER), that optimizes the use of DOE laboratory computational resources to "
            "meet the science needs of the nation and the mission needs of DOE."
        ),
        "facets_by_group": {
            GROUPS[0]: ["activity_id", "data_node"],
            GROUPS[1]: [
                "source_id",
                "institution_id",
                "source_type",
                "experiment_id",
                "sub_experiment_id",
            ],
            GROUPS[2]: ["nominal_resolution"],
            GROUPS[3]: ["variant_label", "grid_label"],
            GROUPS[4]: [
                "table_id",
                "frequency",
                "realm",
                "variable_id",
                "cf_standard_name",
            ],
        },
    },
    {
        "name": "CMIP3",
        "full_name": "Coupled Model Intercomparison Project Phase 3",
        "project_url": "https://pcmdi.llnl.gov/mips/cmip3/",
        "description": (
            "In response to a proposed activity of the World Climate Research Programme's (WCRP's) Working Group on "
            "Coupled Modelling (WGCM), PCMDI volunteered to collect model output contributed by leading modeling centers "
            "around the world. Climate model output from simulations of the past, present and future climate was collected "
            "by PCMDI mostly during the years 2005 and 2006, and this archived data constitutes phase 3 of the Coupled Model "
            "Intercomparison Project (CMIP3). In part, the WGCM organized this activity to enable those outside the major "
            "modeling centers to perform research of relevance to climate scientists preparing the Fourth Assessment Report "
            "(AR4) of the Intergovernmental Panel on Climate Change (IPCC). The IPCC was established by the World Meteorological "
            "Organization and the United Nations Environmental Program to assess scientific information on climate change. The "
            "IPCC publishes reports that summarize the state of the science."
        ),
        "facets_by_group": {
            GROUPS[0]: ["model", "experiment", "institute"],
            GROUPS[4]: ["variable", "realm", "time_frequency", "ensemble"],
        },
    },
    {
        "name": "input4MIPs",
        "full_name": "input datasets for Model Intercomparison Projects",
        "project_url": "https://pcmdi.llnl.gov/mips/input4MIPs/",
        "description": (
            "input4MIPS (input datasets for Model Intercomparison Projects) is an activity to make available via ESGF the "
            "boundary condition and forcing datasets needed for CMIP6. Various datasets are needed for the pre-industrial "
            "control (piControl), AMIP, and historical simulations, and additional datasets are needed for many of the "
            "CMIP6-endorsed model intercomparison projects (MIPs) experiments. Earlier versions of many of these datasets "
            "were used in the 5th Coupled Model Intercomparison Project (CMIP5)."
        ),
        "facets_by_group": {
            GROUPS[0]: [
                "mip_era",
                "target_mip_list",
                "dataset_status",
                "data_node",
            ],
            GROUPS[1]: [
                "institution_id",
                "source_id",
                "source_version",
            ],
            GROUPS[4]: [
                "dataset_category",
                "variable_id",
                "grid_label",
                "nominal_resolution",
                "frequency",
                "realm",
            ],
        },
    },
    {
        "name": "obs4MIPs",
        "full_name": "observations for Model Intercomparison Projects",
        "project_url": "https://pcmdi.github.io/obs4MIPs/dataOnESGF.html",
        "description": (
            "Obs4MIPs (Observations for Model Intercomparisons Project) is an activity to make observational products more "
            "accessible for climate model intercomparisons via the same searchable distributed system used to serve and "
            "disseminate the rapidly expanding set of simulations made available for community research."
        ),
        "facets_by_group": {
            GROUPS[0]: ["product", "realm", "data_node"],
            GROUPS[1]: [
                "source_id",
                "institution_id",
                "region",
                "source_type",
            ],
            GROUPS[4]: [
                "variable",
                "variable_long_name",
                "cf_standard_name",
            ],
            GROUPS[3]: [
                "frequency",
                "grid_label",
                "nominal_resolution",
                "variant_label",
            ],
        },
    },
    {
        "name": "CREATE-IP",
        "full_name": "Collaborative REAnalysis Technical Environment",
        "description": (
            "The Collaborative REAnalysis Technical Environment (CREATE) is a NASA Climate Model Data Services (CDS) project to "
            "collect all available global reanalysis data into one centralized location on NASA’s NCCS Advanced Data Analytics "
            "Platform (ADAPT), standardizing data formats, providing analytic capabilities, visualization analysis capabilities, "
            "and overall improved access to multiple reanalysis datasets. The CREATE project encompasses two efforts - CREATE-IP "
            "and CREATE-V. CREATE-IP is the project that collects and formats the reanalyses data. The list of variables currently "
            "available in CREATE-IP is growing over time so please check back frequently."
        ),
        "project_url": "https://reanalyses.org/",
        "facets_by_group": {
            GROUPS[0]: [
                "project",
                "product",
                "institute",
                "model",
                "data_node",
            ],
            GROUPS[1]: [
                "experiment",
                "experiment_family",
                "source_id",
            ],
            GROUPS[2]: [
                "realm",
                "time_frequency",
                "variable",
                "variable_long_name",
            ],
        },
    },
    {
        "name": "DRCDP",
        "description": "Downscaled CMIP data for North America",
        "facets_by_group": {
            "Search Properties": [
                "downscaling_source_id",
                "institution_id",
                "driving_source_id",
                "driving_experiment_id",
                "source_id",
                "version_realization",
                "variable_id",
                "driving_activity_id",
            ]
        },
    },
    {
        "name": "All (except CMIP6)",
        "description": "Cross project search for all projects except CMIP6.",
        "facets_by_group": {
            GROUPS[0]: [
                "project",
                "product",
                "institute",
                "model",
                "data_node",
            ],
            GROUPS[1]: [
                "source_id",
                "experiment",
                "experiment_family",
            ],
            GROUPS[4]: [
                "time_frequency",
                "realm",
                "cmor_table",
                "ensemble",
                "variable",
                "variable_long_name",
                "cf_standard_name",
                "driving_model",
            ],
            "CORDEX": [
                "domain",
                "rcm_name",
                "rcm_version",
            ],
        },
    },
]
