/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render } from '@testing-library/react';

import Search, {
  parseFacets,
  stringifyConstraints,
  checkConstraintsExist,
} from './index';

const defaultProps = {
  activeProject: {},
  textInputs: [],
  activeFacets: {},
  cart: [],
  onRemoveTag: jest.fn(),
  onClearTags: jest.fn(),
  onAddCart: jest.fn(),
  handleCart: jest.fn(),
  setAvailableFacets: jest.fn(),
};

test('renders without crashing', async () => {
  const { getByTestId } = render(<Search {...defaultProps} />);
  expect(getByTestId('search')).toBeTruthy();
});

test('successfully shows results', async () => {
  test.todo('placeholder');
});

test('successfully shows applied constraints', async () => {
  test.todo('placeholder');
});

describe('test parseFacets()', () => {
  it('successfully parses an object of arrays into an array of tuples', () => {
    const facets = {
      facet1: ['option1', 1, 'option2', 2],
      facet2: ['option1', 1, 'option2', 2],
    };

    const result = {
      facet1: [
        ['option1', 1],
        ['option2', 2],
      ],
      facet2: [
        ['option1', 1],
        ['option2', 2],
      ],
    };

    const parsedFacets = parseFacets(facets);
    expect(parsedFacets).toEqual(result);
  });
});

describe('test stringifyConstraints()', () => {
  let activeFacets;
  let textInputs;

  beforeEach(() => {
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('successfully generates a stringified version of the active constraints', () => {
    const strConstraints = stringifyConstraints(activeFacets, textInputs);
    expect(strConstraints).toEqual(
      '(Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o textInputs', () => {
    const strConstraints = stringifyConstraints(activeFacets, []);
    expect(strConstraints).toEqual(
      '(facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o activeFacets', () => {
    const strConstraints = stringifyConstraints({}, textInputs);
    expect(strConstraints).toEqual('(Text Input = foo OR bar)');
  });
});

describe('test checkConstraintsExist()', () => {
  let activeFacets;
  let textInputs;

  beforeEach(() => {
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('returns true when activeFacets and textInputs exist', () => {
    const constraintsExist = checkConstraintsExist(activeFacets, textInputs);
    expect(constraintsExist).toBeTruthy();
  });
  it('returns true when only textInputs exist', () => {
    const constraintsExist = checkConstraintsExist({}, textInputs);
    expect(constraintsExist).toBeTruthy();
  });

  it('returns true when only activeFacets exist', () => {
    const constraintsExist = checkConstraintsExist(activeFacets, []);
    expect(constraintsExist).toBeTruthy();
  });

  it('returns false if constraints do not exist', () => {
    const constraintsExist = checkConstraintsExist({}, []);
    expect(constraintsExist).toBeFalsy();
  });
});
