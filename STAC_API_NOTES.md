# STAC API NOTES

## West (https://discovery.west.esgf.io/):

1. properties.latest = true filter is returning 0 results for CMIP6 and CORDEX-CMIP6, but CEDA returns all results (expected behavior)
2. Unsupported facets in aggregation request are simply ignored/return empty, rather than giving a 400 error the way CEDA does
3. CMIP7 aggregations are empty and so are the results, which is expected for now
4. CMIP6 aggregations are all empty when latest = true filter is included (expected since 0 result are returned with that filter right now, see 1. above)

## East (https://api.stac.esgf.ceda.ac.uk/):

1. CMIP7 gives 0 results, as does CMIP6Plus, and therefore there are no aggregations and a 400 error is always given for aggregation requests.
2. CMIP6 aggregations are currently unsupported: ['mip_era','activity_id','source_id','source_type','experiment_id','sub_experiment_id','institution_id','frequency','variable_id','variable_cf_standard_name','table_id','realm','nominal_resolution','grid_label','variant_label']
   Basically all of the facets except 'alternate_name' seem to be unsupported in CMIP6

### Once facets are fixed-added to the api's. The projects.json file can be updated to include them to allow that facet to be used on the frontend. Check: frontend/public/projects/projects.json to look at the current configuration.
