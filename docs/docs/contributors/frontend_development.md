# Getting Started with Front-end Development

This walkthrough will show you how to contribute to MetaGrid's front-end. You'll learn about the technologies used, the file scaffolding scheme, and the style guide. Resources are also provided to get new contributors up to speed in the technologies.

## Technologies

### Core

- [ReactJS](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

### React UI Library

- [Ant Design](https://ant.design/)

### Styler and Linting

- Styler: [Prettier](https://prettier.io/)
- Linter: [ESLint](https://eslint.org/) + [Airbnb config](https://www.npmjs.com/package/eslint-config-airbnb)

### Testing/QA

- [Jest](https://jestjs.io/) (with code coverage via [Istanbul](https://istanbul.js.org/docs/tutorials/jest/))
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### DevOps

- [Docker](https://www.docker.com/)
- [Docker-Compose](https://docs.docker.com/compose/)

## File Scaffold

Adapted from sources:

- [An Opinionated Guide to React Folder Structure & File Naming](https://dev.to/farazamiruddin/an-opinionated-guide-to-react-folder-structure-file-naming-1l7i)
- [Optimal File Structure for React Applications](https://charles-stover.medium.com/optimal-file-structure-for-react-applications-f3e35ad0a145)

### Root

```scaffold
frontend
├── .envs
│ ├── .local
│ └── .production
├── cors-proxy
├── docker
│ ├── local
│ └── production
├── public
│ ├── favicon.ico
│ ├── index.html
│ └── manifest.json
├── src
│ ├── api
│ │ ├── mock
│ │ │ ├── fixtures.ts
│ │ │ ├── server-handlers.test.ts
│ │ │ ├── server-handlers.ts
│ │ │ ├── server.ts
│ │ │ └── setup-env.ts
│ │ ├── index.test.ts
│ │ ├── index.ts
│ │ └── routes.ts
│ ├── assets
│ │ └── img
│ ├── common
│ │ ├── types.ts
│ │ ├── utils.test.ts
│ │ └── utils.ts
│ ├── components
│ │ ├── App
│ │ │ ├── App.css
│ │ │ ├── App.tsx
│ │ │ └── App.test.tsx
│ │ ├── index.js
│ │ └── ...
│ ├── contexts
│ │ ├── AuthContext.test.ts
│ │ ├── AuthContext.tsx
│ │ └── types.ts
│ ├── lib
│ │ ├── axios
│ │ │ ├── axios.d.ts
│ │ │ └── index.ts
│ │ ├── keycloak
│ │ │ └── index.ts
│ ├── test
│ │ └── custom-render.tsx
│ ├── env.ts
│ ├── index.css
│ ├── index.tsx
│ └── setupTests.ts
├── .dockerignore
├── .eslintrc.js
├── .gitignore
├── .prettierignore
├── .prettierrc
├── docker-compose.prod.yml
├── docker-compose.yml
├── package.json
├── README.md
├── tsconfig.json
└── yarn.lock
```

- `.envs/` - stores environment variables for each microservice found in the docker-compose files, separated by environment and service
- `cors-proxy/` - the cors-proxy microservice it its own self-contained folder
- `docker/` - stores files used by each microservice found in the docker-compose files, including DockerFiles, start scripts, etc, separated by environment and service
- `public/` - stores static files used before app is compiled [https://create-react-app.dev/docs/using-the-public-folder/#when-to-use-the-public-folder](https://create-react-app.dev/docs/using-the-public-folder/#when-to-use-the-public-folder)
- `src/` - where dynamic files reside, the **bulk of your work is done here**
  - `api/` - contains API related files
    - `mock/` - API mocking using [_mock-service-worker_](https://mswjs.io/docs/) package to avoid making real requests in test suites. More info [here](https://kentcdodds.com/blog/stop-mocking-fetch)
      - `fixtures.ts` - stores objects that resemble API response data
      - `server-handlers.ts` - handles requests to routes by mapping fixtures as responses to each route endpoint
      - `server.ts` - sets up mock service worker server with server-handlers for tests. Essentially, it creates a mock server that intercepts all requests and handle it as if it were a real server
      - `setup-envs.ts` - imports the mock service worker server to all tests before initialization
    - `index.ts` - contains promise-based HTTP client request functions to APIs, references `routes.ts` for API URL endpoints
    - `routes.ts` - contains routes to APIs and error-handling
  - `assets/` - stores assets used when the app is compiled
  - `common/` - stores common code used between components such as utility functions
  - `components/` - contains React components and related files.
    Follow [React Components Scaffolding](#react-components-scaffolding)
  - `contexts/` - stores React [Context](https://reactjs.org/docs/context.html) components, such as for authentication state
  - `lib/` - stores initialized instances of third party library that are exported for use in the codebase (e.g. Axios, Keycloak)
  - `test/` - contains related files and functions shared among tests
    - `custom-render.tsx` - wraps the react-testing-library render method with contexts from `/context`
  - `env.ts` - converts environment variables into constants for reusability
  - `setupTests.ts` - configuration for additional test environment settings for jest
- `.dockerignore` - files and folders to ignore when building docker containers
- `eslintrc.js` - configuration file for ESLint
- `.prettierignore` - files and folders to ignore when running prettier
- `.prettierrc` - configuration file for prettier
- `docker-compose.prod.yml` - the production build of docker-compose
- `docker-compose.yml` - the local development build of docker-compose
- `tsconfig.json` - configuration file for TypeScript
- `yarn.lock` - the purpose of a lock file is to lock down the versions of the dependencies specified in a package.json file. This means that in a yarn.lock file, there is an identifier for every dependency and sub dependency that is used for a project

### React Components

[What are React Components?](https://reactjs.org/docs/components-and-props.html)

Below is an example of how MetaGrid scaffolds React components.

```scaffold
frontend
└── src
    └── components
        ├── AComponentWithoutChildren.tsx
        └── Facets
            ├── FacetsForm.test.tsx
            ├── FacetsForm.tsx
            ├── index.test.tsx
            ├── index.tsx
            ├── ProjectForm.test.tsx
            ├── ProjectForm.tsx
            └── types.ts

```

#### File Naming

- React component file names should be PascalCase, descriptive, and relate to the parent component if applicable
- Use named exports over default exports to make searching easier

#### Grouping/Nesting

- Use a folder to nest child components related to a parent component (e.g. `FacetsForm.tsx` is under `Facets`)
- Use `index.tsx` as the file name for the parent component in the group components. This allows you to import the component just by referencing the folder.

  - If you named the parent component `Facets.tsx`, you have to import using:
    `import Facets from '../Facets/Facets.tsx';` **Avoid this**.

  - Otherwise, you avoid redundancy by naming the parent component `index.tsx`:
    `import Facets from '../Facets';`

- Why not nest child components even further in their own directories? Because too much nesting makes the `/components` directory complicated to navigate.

#### Test Files

- Each testable file and component typically has an associated `.ts/.tsx` file (e.g. `FacetsForm.test.tsx`). This is determined by what you need to test via the code coverage report.

## Style Guide

The MetaGrid front-end follows the Airbnb JavaScript and React/JSX style guides, which are one of the most popular and comprehensive. Please spend some time to read through the style guides.

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)

Since ESLint is configured with Airbnb's style guide, your code can be **automatically reformatted** through your IDE/text editor or by using [pre-commit](../getting_started_local#1-set-up-precommit).

The ESLint and Prettier config files are located in root, so your IDE/text editor will use them. This means you don't have to worry about manually styling your code for every commit, and you can focus on the architecture of change. Automation is the key.

**Style guide and linting rules are enforced in CI test builds.**

## Useful React Commands

Run a command inside the docker container:

```bash
docker-compose -p metagrid_local_frontend run --rm react [command]
```

### `yarn start:local`

Runs the app in the development mode using `.local` environment settings.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn start:production`

Runs the app in the development mode using `.production` environment settings.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner for a single run without coverage report.<br />
See the section about [running tests](https://create-react-app.dev/docs/running-tests/) for more information.

### `yarn test:coverage`

Launches the test runner for a single run with coverage reporting.<br />
See the section about [running tests with coverage](https://create-react-app.dev/docs/running-tests/#coverage-reporting) for more information.

### `yarn test:watch`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://create-react-app.devv/docs/running-tests/) for more information.

### `yarn lint`

Runs linters to display violations.<br />

### `yarn precommit`

Runs linters against staged git files and attempts to fix as many issues as possible.<br />
https://github.com/okonet/lint-staged

### `yarn run build:local`

Builds the app for production to the `build` folder using `.local` environment settings.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn run build:production`

Builds the app for production to the `build` folder using `.production` environment settings.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## New Contributor Resources

Here are some resources to get you up to speed with the technologies.

### Documentation

- [Official React Docs](https://reactjs.org/docs/getting-started.html)
- [Official TypeScript Docs](https://www.typescriptlang.org/docs/)

### Courses

- [Free React Bootcamp](https://ui.dev/free-react-bootcamp/) - a four day course that covers the in's and out's of React, starting from a high level overview
- [React team's recommended courses list](https://reactjs.org/community/courses.html)

### Tutorials and Cheatsheets

- [Official React tutorial](https://reactjs.org/tutorial/tutorial.html)
- [React+TypeScript tutorial](https://www.youtube.com/watch?v=Z5iWr6Srsj8)
- [React+TypeScript cheatsheet](https://github.com/typescript-cheatsheets/react)
