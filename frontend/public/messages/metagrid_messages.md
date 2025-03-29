# Welcome to the Metagrid Release v1.5.x

To view the latest documentation and FAQ, please visit this page:
[https://esgf.github.io/esgf-user-support/metagrid.html](https://esgf.github.io/esgf-user-support/metagrid.html)

## STAC Search API integration

This update includes numerous changes to how the Metagrid application handles search results and includes support for STAC search api requests. STAC and non-STAC search results can both be viewed and are rendered/handled intidivdually in on the Metagrid search results tables.

## U.I Improvements

We added some improvements the the U.I. as part of our overhaul of the frontend when integrating STAC data.

## WGET script reminder

Most data projects (if not all) no longer require any authentication for data access. However the inclusion of authentication was previously assumed to be a default in the WGET script. Users must run the script with the `-s` option to skip the authentication process. For example:

```
$ bash wget-XXXX.sh -s
```
