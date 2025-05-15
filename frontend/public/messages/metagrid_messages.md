# Welcome to the Metagrid Release v1.5.x

To view the latest documentation and FAQ, please visit this page:
[https://esgf.github.io/esgf-user-support/metagrid.html](https://esgf.github.io/esgf-user-support/metagrid.html)

## Changes to US Index search results

The ESGF Search Index has been migrated to Globus Search. As a result of this change in the near term (ESGF-1.5), search results at DOE lab-hosted sites (ANL, LLNL, ORNL) are all included together, yet limited to data published only to those site indexes, including replica data for CMIP5 and 6. On a temporary basis and specifically for data published to other indexes, including non-replica original data: please search at our international partner sites (in Europe/AU), see the Federated Nodes list. Coming soon: CMIP6 data published worldwide will be availabe under a single search interface again.

## Deployment Process Updated

This update includes numerous changes to how the Metagrid application is deployed, with enhancements to security, improvements to the configuration process and consolidation of configuration files.

## Light and Dark Themes

If you checkout the top-right corner, you'll see we now have a switch to allow you to choose the display theme from Light to Dark.

## Upcoming changes to ESGF @LLNL

We are excited to be planning to have an official release of the Metagrid platform onto scalable infrastructure. In the meantime we will be testing new features.

- Improved redundancy and backend deployment enhancements utilizing our Kubernetes cluster.

## WGET script reminder

Most data projects (if not all) no longer require any authentication for data access. However the inclusion of authentication was previously assumed to be a default in the WGET script. Users must run the script with the `-s` option to skip the authentication process. For example:

```
$ bash wget-XXXX.sh -s
```
