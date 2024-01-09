# Document

This project uses [MkDocs](https://www.mkdocs.org/) documentation generator.

If you set up your project by walking through [Getting Started For Local Development](../getting_started_local), run the following command:

     cd docs
     docker compose -p metagrid_docs_dev up

Navigate to port 8001 on your host to see the documentation site locally (e.g. [`localhost:8001`](http://localhost:8001/)).
MkDocs supports hot-reloading, so changes to any of the `.md` files will reload the site.

## Setting up ReadTheDocs

To setup your documentation on [ReadTheDocs](https://readthedocs.org/), you must

1. Go to [ReadTheDocs](https://readthedocs.org/) and login/create an account
2. Add your GitHub repository
3. Trigger a build

Additionally, you can auto-build Pull Request previews, but [you must enable it](https://docs.readthedocs.io/en/latest/guides/autobuild-docs-for-pull-requests.html#autobuild-documentation-for-pull-requests).

Here's a guide specifically for [MkDocs](https://www.mkdocs.org/user-guide/deploying-your-docs/#read-the-docs)
