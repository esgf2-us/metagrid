import { mockConfig } from '../../test/jestTestFunctions';
import {
  delay,
  elementExists,
  elementHasState,
  clickFirstElement,
  createMainPageTour,
  createCartItemsTour,
  createSearchCardTour,
  createNodeStatusTour,
  defaultTarget,
  hoverFirstElement,
  unHoverFirstElement,
} from './reactJoyrideSteps';

describe('Test reactJoyrideStep util functions', () => {
  it('returns a promise of specific delay length', async () => {
    const time = Date.now();
    await delay(500);
    const nextTime = Date.now();

    expect(nextTime - time).toBeGreaterThanOrEqual(450);
    expect(nextTime - time).toBeLessThan(1000);
  });

  it('returns true if an element exists, otherwise false', () => {
    const newElement = document.createElement('div');
    newElement.className = 'testElement';
    document.body.appendChild(newElement);

    expect(elementExists('blahBlahBadClassName')).toEqual(false);
    expect(elementExists('testElement')).toEqual(true);
  });

  it('returns true if an element exists with specified state, otherwise false', () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    const newElement = document.createElement('div');
    newElement.className = 'testElement target-state_testing';
    document.getElementById('root')?.appendChild(newElement);

    expect(elementExists('testElement')).toEqual(true);
    expect(elementHasState('invalidClass', 'target')).toEqual(false);
    expect(elementHasState('testElement target-state_testing', 'testing')).toEqual(true);
  });

  it('clicks the specified element', () => {
    const newElement = document.createElement('div');
    newElement.className = 'testElement';
    document.body.appendChild(newElement);

    expect(clickFirstElement('.invalidClass')).toEqual(false);
    expect(clickFirstElement('.testElement')).toEqual(true);
  });

  it('Creates basic tours', () => {
    const root = document.createElement('div');
    root.id = 'root';
    const mainTable = document.createElement('div');
    mainTable.className = 'ant-empty-image';
    const cartEmpty = document.createElement('div');
    cartEmpty.className = 'ant-tabs-tabpane-active ant-empty-description';
    document.body.appendChild(root);

    // Test main tour that has no globus nodes
    mockConfig.GLOBUS_NODES = [];

    const mainTourNoGlobus = createMainPageTour();
    expect(mainTourNoGlobus).toBeTruthy();

    // Test main tour that includes globus options
    mockConfig.GLOBUS_NODES = ['node1', 'node2', 'node3'];

    const mainTourWithGlobus = createMainPageTour();
    expect(mainTourWithGlobus).toBeTruthy();
    const cartTour = createCartItemsTour(() => {});
    expect(cartTour).toBeTruthy();
    const searchTour = createSearchCardTour(() => {});
    expect(searchTour).toBeTruthy();
    const nodeTour = createNodeStatusTour();
    expect(nodeTour).toBeTruthy();

    // Made the main table empty
    document.getElementById('root')?.appendChild(mainTable);
  });

  it('defaultTarget should have correct selector', () => {
    expect(defaultTarget.selector()).toBe('#root .navbar-logo');
  });
});

describe('hoverFirstElement and unHoverFirstElement', () => {
  it('should dispatch mouseover event on element', () => {
    const elem = document.createElement('div');
    elem.className = 'hover-test';
    document.body.appendChild(elem);

    const mouseOverSpy = jest.fn();
    elem.addEventListener('mouseover', mouseOverSpy);

    expect(hoverFirstElement('.hover-test')).toBe(true);
    expect(mouseOverSpy).toHaveBeenCalled();
  });

  it('should dispatch mouseout event on element', () => {
    const elem = document.createElement('div');
    elem.className = 'unhover-test';
    document.body.appendChild(elem);

    const mouseOutSpy = jest.fn();
    elem.addEventListener('mouseout', mouseOutSpy);

    expect(unHoverFirstElement('.unhover-test')).toBe(true);
    expect(mouseOutSpy).toHaveBeenCalled();
  });

  it('should return false if element not found', () => {
    expect(hoverFirstElement('.notfound')).toBe(false);
    expect(unHoverFirstElement('.notfound')).toBe(false);
  });
});
