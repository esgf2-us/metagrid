/**
 * CORS Anywhere NodeJS proxy configuration
 * https://github.com/Rob--W/cors-anywhere
 *
 * Note: ESLint rules are disabled to follow the configuration format outlined by the docs.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const corsProxy = require('cors-anywhere');

// The protocol of the HOST
const protocol = process.env.PROXY_PROTOCOL || 'http://';
// Listen on a specific host via the HOST environment variable
const host = process.env.PROXY_HOST || 'localhost';
// Listen on a specific port via the PORT environment variable
const port = process.env.PROXY_PORT || 8080;
// If set, requests whose origin is not listed are blocked.
// If the frontend is performing a same-site request (origin is the same),
// the list can be empty to allow origins.
let originWhitelist = process.env.PROXY_ORIGIN_WHITELIST;
if (originWhitelist) {
  originWhitelist = originWhitelist.split(',');
} else {
  originWhitelist = [];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
corsProxy
  .createServer({
    originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
  })
  .listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Running CORS Anywhere on ${protocol}${host}:${port}`);
  });
