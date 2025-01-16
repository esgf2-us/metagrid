# Welcome to the Metagrid Release v1.3.0

To view the latest documentation and FAQ, please visit this page:
[https://esgf.github.io/esgf-user-support/metagrid.html](https://esgf.github.io/esgf-user-support/metagrid.html)

## Deployment Process Updated

This update includes numerous changes to how the Metagrid application is deployed, with enhancements to security, improvements to the configuration process and consolidation of configuration files.

## Globus Transfers enhanced

This version of Metagrid enhances the user of Globus to transfer ESGF datasets to your institutional or personal endpoint. The feature can be accessed at the bottom of the Data Cart page. At present only data published at DOE sites: ANL, ORNL, or LLNL are available for Globus Transfer via Metagrid. The enhancement allows users to save frequently used Globus Collections and destination pathnames.

For more information about Globus Transfers please see: https://app.globus.org/help

## WGET script reminder

Most data projects (if not all) no longer require any authentication for data access. However the inclusion of authentication was previously assumed to be a default in the WGET script. Users must run the script with the `-s` option to skip the authentication process. For example:

```
$ bash wget-XXXX.sh -s
```

## Upcoming changes to ESGF @LLNL

We are excited to be planning to have an official release of the Metagrid platform onto scalable infrastructure. In the meantime we will be testing new features.

- Improved redundancy and backend deployment enhancements utilizing our Kubernetes cluster.
