# Repo Standards

Following development patterns and best practices is essential for developing high quality, manageable software.

This page outlines the standards for version control, styling and formatting, documenting, and testing.

## Version Control

The repository uses **GitHub Flow**, a lightweight, branch-based workflow that supports teams and projects where deployments are made regularly.
GitHub Flow aligns with **continuous delivery** of modern web applications where changes are not rolled back and multiple versions of software does not need to be supported.

### GitHub Flow in a Nutshell

![GitHub Flow Diagram](https://i.stack.imgur.com/ChShh.png)

1. `master` must always be deployable
2. All changes are made through **support** branches. Reference [list below](#type-of-support-branches)
3. Rebase with master to avoid/resolve conflicts
4. Open a pull-request (PR) and follow the PR guidelines
5. Once PR is approved and build passes, **squash and rebase** your commits
6. Merge in to `master` and **delete the branch**

Source: [https://guides.github.com/introduction/flow/](https://guides.github.com/introduction/flow/)

### Branching

#### Types of Support Branches

- `feature/` branches used to develop new features
  - The essence of a feature branch is that it exists as long as the feature is in development, but will eventually be merged back into master.
- `hotfix/` branches arise from the necessity to act immediately upon an undesired state of a live production version
  - When a critical bug in a production version must be resolved immediately, a hotfix branch may be branched off from the master branch.

Source: [https://nvie.com/posts/a-successful-git-branching-model/#supporting-branches](https://nvie.com/posts/a-successful-git-branching-model/#supporting-branches)

#### Branch Naming Convention

Make sure to reference the issue number related to the branch, along with a clear description (use your issue title for reference).

- `feature/181-add-user-auth`
- `hotfix/67-searches-not-saving`

### Squash and Rebase Commits

Before you merge a support branch back into `master`, your support branch should be squashed down to a single buildable commit, and then rebased from the up-to-date `master` branch.

Why?

- Ensures build passes from the commit
- Cleans up Git history for easy navigation
- Makes collaboration process more efficient
- Makes handling conflicts from rebasing simple since you only have to deal with conflicted commits

Source: [https://blog.carbonfive.com/always-squash-and-rebase-your-git-commits/](https://blog.carbonfive.com/always-squash-and-rebase-your-git-commits/)

### Summary

#### DOs for Version Control

- **DO** keep `master` in working order.
- **DO** learn to rebase
- **DO** squash commits
- **DO** rebase your `feature` branches.
- **DO** pull in (rebase on top of) changes
- **DO** push `feature` branches early for discussion
- **DO** name your branches clearly against an issue number
- **DO** delete your branches after a PR is closed/merged, otherwise it makes navigating branches on origin messy

#### DON'Ts for Version Control

- **DON'T** merge in broken or commented out code
- **DON'T** commit onto `master` directly
- **DON'T** rebase `master`
- **DON'T** merge with conflicts. Handle conflicts upon rebasing

Source: [https://gist.github.com/jbenet/ee6c9ac48068889b0912](https://gist.github.com/jbenet/ee6c9ac48068889b0912)

## Style Guide, Linting, Type Checking

This project uses several tools for code formatting, linting, and type checking. These tools can either by run manually through the terminal, through your IDE/text editor, or automatically before each commit using pre-commit hooks.

| Platform | Code Formatting                                  | Linting                                          | Type Checking                 |
| -------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------- |
| Backend  | [black](https://black.readthedocs.io/en/stable/) | [flake8](https://github.com/PyCQA/flake8#flake8) | [mypy](http://mypy-lang.org/) |
| Frontend | [prettier](https://prettier.io/)                 | [ESLint + Airbnb](https://eslint.org/)           | TypeScript                    |

_Tools used in the repository_

The repository uses **pre-commit hooks** to help enforce software standards and identify simple issues at the commit level before submitting code reviews. Instructions on how to get pre-commit setup can be found [here](../getting_started_local#1-set-up-pre-commit).

## Documenting

Code should be self-documenting. Generally, you don't need comments if you write clean code.

However, when necessary, documentation should explain **WHY** something is done, its purpose, and its goal. The code already shows **HOW** it is done, so commenting on this is redundant and should be avoided.

### DOs for Documenting

- **DO** embrace documentation as an integral part of the overall development process
- **DO** treat documenting as code and follow principles such as _Don't Repeat Yourself_ (DRY), _Easier to Change_ (ETC)
- **DO** use comments and docstrings to explain ambigiuity, complexity, or to avoid confusion
- **DO** co-locate documentation with related code -- makes maintenance simpler
- **DO** use type annotations and type comments (for Python)

### DON'Ts for Documenting

- **DON'T** write comments as a crutch for poor code
- **DON'T** comment _every_ function, data structure, type declaration, etc. -- this kind of machanical comment writing actually makes it more difficult to maintain code since two things need to be updated when you make a single update

Source: “A Pragmatic Philosophy.” _The Pragmatic Programmer: Your Journey to Mastery_, by David Thomas and Andrew Hunt, Pearson Education, Inc., 2020, pp. 23–23.

Watch this great video on [The Art of Code Comments](https://www.youtube.com/watch?v=yhF7OmuIILc)

## Testing and Continuous Integration (CI)

Writing high quality tests is essential for high quality software. Pull requests should include tests where applicable. PRs builds are tested using CI.

### How do I Know What to Test?

Use code coverage tools to generate a report and see what you should test. Be aware, code coverage tools measure lines of code covered by tests. **You should still write test cases that exceed the base testcases**.

The repository's code coverage tools have minimum threshold percentages for code coverage. If your PR's CI build causes the code coverage percentage to drop below the limit, **your build cannot be merged**.

### GitHub Actions for CI

MetaGrid uses GitHub Actions to run _workflows_ (aka pipelines) for each side of the stack.
Each workflow for the front-end and back-end run the code formatters, linters, and test suites to check for issues before allowing a PR to be merged.
