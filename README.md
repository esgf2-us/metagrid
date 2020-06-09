# MetaGrid

![Front-end CI](https://github.com/aims-group/metagrid/workflows/Front-end%20CI/badge.svg)
![Back-end CI](https://github.com/aims-group/metagrid/workflows/Back-end%20CI/badge.svg)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/aims-group/metagrid/master.svg?style=flat-square)](https://codecov.io/gh/aims-group/metagrid/)

Earth System Grid Federation's (ESGF) next generation search interface.

## Repository Structure

This project is structured as a mono-repo, encompassing two separate sub-projects for the front-end and back-end. Please navigate to their respective directories for more information.

### Getting Started

#### Setup pre-commit

This repo has default integration with precommit, a python package for identifying simple issues before submission to code review. You will need to setup the Python virtual environment to install pre-commit hooks into your local git repo.

The linters and stylers include:

- Code styling: prettier, black
- Linting: ESLint, flake8
- Static Type Checking: TypeScript, mypy

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r config/requirements/local.txt

pre-commit install
```

## Frontend

[![React](frontend/src/assets/img/react_badge.svg)](https://reactjs.org/)
[![TypeScript](frontend/src/assets/img/typescript_badge.svg)](https://www.typescriptlang.org/)

[![dependencies Status](https://david-dm.org/aims-group/metagrid/status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend)
[![devDependencies Status](https://david-dm.org/aims-group/metagrid/dev-status.svg?path=frontend)](https://david-dm.org/aims-group/metagrid?path=frontend&type=dev)

[Getting started](frontend/README.md)

## Backend

[![Made with Django.](https://www.djangoproject.com/m/img/badges/djangomade124x25.gif)](http://www.djangoproject.com)

[![Updates](https://pyup.io/repos/github/aims-group/metagrid/shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Python 3](https://pyup.io/repos/github/aims-group/metagrid/python-3-shield.svg)](https://pyup.io/repos/github/aims-group/metagrid/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Getting started](backend/README.md)
