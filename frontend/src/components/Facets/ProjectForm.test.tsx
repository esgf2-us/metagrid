import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseError } from '../../api';
import {
  activeSearchQueryFixture,
  projectsFixture,
} from '../../api/mock/fixtures';
import { mapHTTPErrorCodes } from '../../api/routes';
import ProjectsForm, { Props } from './ProjectForm';
import customRender from '../../test/custom-render';
import { showNoticeStatic } from '../../test/jestTestFunctions';

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  projectsFetched: { results: projectsFixture() },
  apiIsLoading: false,
  apiError: undefined,
  onFinish: jest.fn(),
};

const user = userEvent.setup();

it('renders empty form', () => {
  const { queryByRole } = customRender(
    <ProjectsForm {...defaultProps} projectsFetched={undefined} />
  );

  // Check submit button does not exist
  const selectDropdown = queryByRole('form');
  expect(selectDropdown).toBeNull();
});

it('Runs project form submit when changing projects', async () => {
  const { getByRole, getByText } = customRender(
    <ProjectsForm
      {...defaultProps}
      projectsFetched={{ results: projectsFixture() }}
      onFinish={(projName) => {
        showNoticeStatic(`${projName} was selected!`, {
          duration: 1,
          type: 'success',
        });
      }}
    />
  );

  // First project should be selected by default, calling 'onFinish'
  const option1Selected = await waitFor(() => {
    return getByText('test1 was selected!');
  });
  expect(option1Selected).toBeTruthy();

  // Open the project dropdown
  const projectDropDown = getByRole('combobox');
  expect(projectDropDown).toBeTruthy();
  fireEvent.mouseDown(projectDropDown);

  // Select the 3rd project in the drop-down
  const option3 = await waitFor(() => {
    return getByText('test3');
  });

  await act(async () => {
    await user.click(option3);
  });

  // The 3rd project should now be selected
  const option3Selected = getByText('test3 was selected!');
  expect(option3Selected).toBeTruthy();
});

it('renders error message when projects can"t be fetched', () => {
  const { getByRole } = customRender(
    <ProjectsForm
      {...defaultProps}
      apiError={
        new Error(mapHTTPErrorCodes('service', 'generic')) as ResponseError
      }
    />
  );

  const alertComponent = getByRole('img', { name: 'close-circle' });
  expect(alertComponent).toBeTruthy();
});
