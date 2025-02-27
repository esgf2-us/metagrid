// The init function is where the DOM is manipulated. This is the original module: https://github.com/keycloak/keycloak/blob/0535c76e06cc78fd2e5107274369d0746548e5cf/js/libs/keycloak-js/lib/keycloak.js#L63

const Keycloak = jest.fn(() => ({
  init: jest.fn(() => Promise.resolve(true)),
  login: jest.fn(),
  logout: jest.fn(),
  updateToken: jest.fn(),
  token: 'mock-token',
  authenticated: true,
  // Add any other methods you need to mock
}));

export default Keycloak;
