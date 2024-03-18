import { mockConfig } from '../test/jestTestFunctions';
import {
  getCurrentAppPage,
  delay,
  elementExists,
  elementHasState,
  clickFirstElement,
  createMainPageTour,
  createCartItemsTour,
  createSearchCardTour,
  createNodeStatusTour,
} from './reactJoyrideSteps';
import { AppPage } from './types';

describe('Test reactJoyrideStep util functions', () => {
  it('returns a promise of specific delay length', async () => {
    const time = Date.now();
    await delay(500);
    const nextTime = Date.now();

    expect(nextTime - time).toBeGreaterThanOrEqual(450);
    expect(nextTime - time).toBeLessThan(1000);
  });

  it('returns appropriate page name based on window location', () => {
    expect(getCurrentAppPage()).toEqual(-1);

    // eslint-disable-next-line
    window = Object.create(window);
    const url = 'https://test.com/search';
    Object.defineProperty(window, 'location', {
      value: {
        href: url,
        pathname: 'testing/search',
      },
      writable: true,
    });
    expect(window.location.href).toEqual(url);
    expect(window.location.pathname).toEqual('testing/search');

    // Test page names
    expect(getCurrentAppPage()).toEqual(AppPage.Main);
    window.location.pathname = 'testing/cart/items';
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);
    window.location.pathname = 'testing/cart/searches';
    expect(getCurrentAppPage()).toEqual(AppPage.SavedSearches);
    window.location.pathname = 'testing/cart/nodes';
    expect(getCurrentAppPage()).toEqual(AppPage.NodeStatus);
    window.location.pathname = 'testing/bad';
    expect(getCurrentAppPage()).toEqual(-1);
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
    expect(
      elementHasState('testElement target-state_testing', 'testing')
    ).toEqual(true);
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
    mockConfig.globusEnabledNodes = [];

    const mainTourNoGlobus = createMainPageTour();
    expect(mainTourNoGlobus).toBeTruthy();

    // Test main tour that includes globus options
    mockConfig.globusEnabledNodes = ['node1', 'node2', 'node3'];

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
});
