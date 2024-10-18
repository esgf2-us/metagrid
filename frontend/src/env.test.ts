import { getConfig } from './env';

const PENV = process.env;

beforeEach(() => {
  jest.resetModules();

  const { env } = process;

  try {
    delete env.REACT_APP_METAGRID_API_URL;
  } catch {
    // eslint-disable-next-line no-console
    console.log('REACT_APP_METAGRID_API_URL not defined');
  }

  process.env = env;

  window.ENV = {};
});

afterEach(() => {
  process.env = PENV;
});

describe('Test getConfig', () => {
  it('should be empty', () => {
    expect(getConfig('REACT_APP_METAGRID_API_URL')).toBe('');
  });

  it('should use window.ENV', () => {
    window.ENV = {
      REACT_APP_METAGRID_API_URL: 'https://dummy.io/metagrid',
    };

    expect(getConfig('REACT_APP_METAGRID_API_URL')).toBe(
      'https://dummy.io/metagrid'
    );
  });

  it('should use process.env', () => {
    process.env.REACT_APP_METAGRID_API_URL =
      'https://anotherdummy.io/metagrid2';

    expect(getConfig('REACT_APP_METAGRID_API_URL')).toBe(
      'https://anotherdummy.io/metagrid2'
    );
  });

  it('should ignore process.env when window.ENV is set', () => {
    window.ENV = {
      REACT_APP_METAGRID_API_URL: 'https://dummy.io/metagrid',
    };

    process.env.REACT_APP_METAGRID_API_URL =
      'https://anotherdummy.io/metagrid2';

    expect(getConfig('REACT_APP_METAGRID_API_URL')).toBe(
      'https://dummy.io/metagrid'
    );
  });
});
