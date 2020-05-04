# This script inserts projects and default facets into the database
from metagrid.projects.models import Facet, Project

# The default facets are pulled from CoG's JSON results downloader
facets_by_proj = {
    "CMIP6": [
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
    "CMIP5": [
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
    "E3SM": [
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
    "CMIP3": [
        "variable",
        "model",
        "experiment",
        "realm",
        "institute",
        "time_frequency",
        "ensemble",
    ],
    "input4MIPs": [
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
    "obs4MIPs": [
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
}


def main():
    for proj_name, facets in facets_by_proj.items():
        proj = Project(name=proj_name)
        proj.save()
        for facet in facets:
            Facet(name=facet, project=proj).save()


if __name__ == "__main__":
    main()
