# Project Standards

## Development Environment

If you haven't already, please visit the [Getting Started for Local Development](getting_started_local.md).

## Version Control

The repository uses **GitHub Flow**, a lightweight, branch-based workflow that supports teams and projects where deployments are made regularly.
GitHub Flow aligns with **continuous delivery** of modern web applications where changes are not rolled back and multiple versions of software don't need to be supported.

### How to Use GitHub Flow

![GitHub Flow Diagram](../images/gitflow.png)

1. Fork the repo and create a support branch
   - Forking ensures the upstream repository can only be affected through a pull request (PR)
   - `master` branch is not affected by branching
2. Add commits
   - Make sure `pre-commit` checks pass before each commit because CI/CD enforces them
3. Open a PR
   - Encourages questions or comments from reviewers
   - Check to see if your branch passes the CI/CD build
4. Discuss and review your code
   - You can continue to push to your branch as discussion happens, such as to address bugs
5. Deploy
   - Once your PR has been reviewed and the branch passes the CI/CD build, you can deploy to verify them in production
   - For our case, we use a specifically provisioned testing environment that resembles production
6. Squash and rebase
   - After verification in the test environment, squash your commits into a single buildable commit
   - Rebase your branch on top of master and handle conflicts
7. Merge PR
   - Merge the PR into `master` and delete the branch

Source: [https://guides.github.com/introduction/flow/](https://guides.github.com/introduction/flow/)

### Guidelines

1. `master` must always be deployable
2. Never push directly to `master`
3. Always test your deployments on a test server

### Things to Avoid

1. Don't merge in broken or commented out code
2. Don't commit onto `master` directly
3. Don't merge with conflicts -- handle conflicts upon rebasing

### Pre-commit

The repository uses the `pre-commit` package to manage pre-commit hooks for the quality assurance tools.
These hooks help enforce software standards and identify simple issues at the commit level before submitting code reviews.

![GitHub Flow Diagram](../images/pre-commit-flow.svg)

#### Helpful Commands

Install into your cloned repo

```bash
# Activate virtual environment
source activate backend/venv/bin/activate
# Install into your repo's .git directory
pre-commit install
```

Automatically run all pre-commit hooks (just commit)

```bash
git commit -m '...'
```

![Pre-commit Output](../images/pre-commit-passing.png)

Manually run all pre-commit hooks

```bash
pre-commit run --all-files.
```

Run individual hook

```bash
# Available hook ids: trailing-whitespace, end-of-file-fixer, check-yaml, black, isort, flake8, mypy
pre-commit run <hook_id>.
```

### Branching

#### Types of Support Branches

- `feature/` branches used to develop new features
  - The essence of a feature branch is that it exists as long as the feature is in development, but will eventually be merged back into master.
- `hotfix/` branches arise from the necessity to act immediately upon an undesired state of a live production version
  - When a critical bug in a production version must be resolved immediately, a hotfix branch may be branched off from the master branch.
- `docs/` branches are used when there are only documentation related updates without new features

Source: [https://nvie.com/posts/a-successful-git-branching-model/#supporting-branches](https://nvie.com/posts/a-successful-git-branching-model/#supporting-branches)

#### Branch Naming Convention

Make sure to reference the issue number related to the branch, along with a clear description (use your issue title for reference).

- `feature/181-add-user-auth`
- `hotfix/67-searches-not-saving`
- `docs/91-github-flow`

### Squash and Rebase Commits

Before you merge a support branch back into `master`, your support branch should be squashed down to a single buildable commit, and then rebased from the up-to-date `master` branch.

Why squash and rebase commits?

- Ensures build passes from the commit
- Cleans up Git history for easy navigation
- Makes collaboration process more efficient
- Makes handling conflicts from rebasing simple since you only have to deal with conflicted commits
- Makes `git bisect` easier and more effective to use. For example, it will show the exact commit that introduced a bug since the commit contains a relatively small changeset. On the otherhand, merge commits make it much harder since it includes a large changeset.

#### How to squash and rebase commits

1. Sync `master` with upstream `master`

      git checkout master
      git rebase upstream/master
      git push -f origin master

2. Rebase branch onto `master`

      git checkout branchName
      git rebase master
      git push -f origin branchName

3. Get the SHA of the commit OR number of commits to rebase to

      git log --graph --decorate --pretty=oneline --abbrev-commit

4. Squash commits

      git rebase -i [SHA]

      OR

      git rebase -i HEAD~[NUMBER OF COMMITS]

5. Resolve merge conflicts if they exist
6. Make sure your squashed commit messages are refined
7. Force push to remote branch

      git push -f origin branchName

Source: [https://blog.carbonfive.com/always-squash-and-rebase-your-git-commits/](https://blog.carbonfive.com/always-squash-and-rebase-your-git-commits/)

#### Quality Assurance Tools

| Platform  | Code Formatter                                   | Linter                                           | Type Checker                  |
| --------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------- |
| Back-end  | [black](https://black.readthedocs.io/en/stable/) | [flake8](https://github.com/PyCQA/flake8#flake8) | [mypy](http://mypy-lang.org/) |
| Front-end | [prettier](https://prettier.io/)                 | [ESLint + Airbnb](https://eslint.org/)           | TypeScript (language)         |

---

##### Ways to Run Tools

1. Using `pre-commit` - recommend in most cases, commands found [here](getting_started_local.md#23-helpful-commands)
2. Using IDE/text editor - recommended alongside #1 for integrated linting and formatting, only VSCode `settings.json` file provided for configuration
3. Using terminal to run standalone tool - useful to test configs. Visit the tool's site for a list of commands

## Documenting APIs

In most cases, code should be self-documenting.

If necessary, documentation should explain **why** something is done, its purpose, and its goal. The code shows **how** it is done, so commenting on this can be redundant.

### Guidelines

1. Embrace documentation as an integral part of the overall
   development process
2. Treat documenting as code and follow principles such as _Don't
   Repeat Yourself_ and _Easier to Change_
3. Use comments and docstrings to explain ambigiuity, complexity,
   or to avoid confusion
4. Co-locate API documentation with related code
5. Use Python type annotations and type comments where helpful
6. Be as specific as possible with TypeScript annotations

### Things to Avoid

1. Don't write comments as a crutch for poor code
2. Don't comment _every_ function, data structure, type declaration

## Testing and Continuous Integration (CI)

This project uses [GitHub Actions](https://github.com/aims-group/metagrid/actions) to run the CI/CD build. The build is triggered by Git `pull_request` and `push` (merging PRs) events to the upstream `master`.

1. Pre-commit Checks - runs formatters and linters
2. Back-end CI - runs a `pytest` test suite and uploads coverage report
3. Front-end CI - runs a `jest` + `react-testing-library` test suite and uploads a coverage report

### How do I Know What to Test?

Use code coverage tools to generate a report and see what you should test. Be aware, code coverage tools measure lines of code covered by tests. **You should still write test cases that exceed the base testcases**.

The repository's code coverage tools have minimum threshold percentages for code coverage. If your PR's CI build causes the code coverage percentage to drop below the limit, **your build cannot be merged**.
