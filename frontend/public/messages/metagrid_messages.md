# Welcome to the Metagrid Release v1.5.4

To view the latest documentation and FAQ, please visit this page:
[https://esgf.github.io/esgf-user-support/metagrid.html](https://esgf.github.io/esgf-user-support/metagrid.html)

## Pyesgf package deprecation

The ESGF-Pyclient (pyesgf) package is no longer supported and not compatible with the US index going forward (see the item below).
We recommed that users migrate to using the `esgpull` CLI or `intake-esgf` Python package as we have integrated search syntax translation with these tools.

## Changes to US Index search results

The ESGF Search Index has been migrated to Globus Search. As a result of this change in the near term (ESGF-1.5), search results at DOE lab-hosted sites (ANL, LLNL, ORNL) are all included together, yet limited to data published only to those site indexes, including replica data for CMIP5 and 6. On a temporary basis and specifically for data published to other indexes, including non-replica original data: please search at our international partner sites (in Europe/AU), see the Federated Nodes list. Coming soon: CMIP6 data published worldwide will be availabe under a single search interface again.


## Sortable Columns and Cached Search Results

Starting in v1.4.0, Metagrid now includes several improvements to the user experience including sortable columns (sorted on a per-page basis) and cached search results. Loading time between navigation is significantly reduced by caching and new searches are only performed when a search parameter is changed. The cache has a limited lifespan of an hour, so that results will be refreshed after an hour.
