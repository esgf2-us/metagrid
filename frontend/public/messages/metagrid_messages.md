# Welcome to the Metagrid Release v1.6.0

To view the latest documentation and FAQ, please visit this page:
[https://esgf.github.io/esgf-user-support/metagrid.html](https://esgf.github.io/esgf-user-support/metagrid.html)

## Release of ESGF-NG / STAC ; New project data coming soon

Several of our newest data projects namely CMIP7 and CORDEX-CMIP6 use the [STAC](https://stacspec.org/) standards for APIs and Metadata organization.  These project displays will show some differences in appearance and behavior.  Additonal projects will migrate to this standard including CMIP6 and CMIP6Plus.  If you discover any functionality not working, please open the help window and open an issue.

## Pyesgf package deprecation

The ESGF-Pyclient (pyesgf) package is no longer supported and not compatible with the US index going forward (see the item below).
We recommed that users migrate to using the `esgpull` CLI or `intake-esgf` Python package as we have integrated search syntax translation with these tools.

## Changes to US Index search results

The ESGF Search Index has been migrated to Globus Search. As a result of this change in the near term (ESGF-1.5), search results at DOE lab-hosted sites (ANL, LLNL, ORNL) are all included together, yet limited to data published only to those site indexes, including replica data for CMIP5 and 6. On a temporary basis and specifically for data published to other indexes, including non-replica original data: please search at our international partner sites (in Europe/AU), see the Federated Nodes list. Coming soon: CMIP6 data published worldwide will be availabe under a single search interface again.
