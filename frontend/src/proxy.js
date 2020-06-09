require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const corsProxy = require('cors-anywhere');

// The protocol of the HOST
const protocol = process.env.REACT_APP_PROXY_PROTOCOL;
// Listen on a specific host via the HOST environment variable
const host = process.env.REACT_APP_PROXY_HOST;
// Listen on a specific port via the PORT environment variable
const port = process.env.REACT_APP_PROXY_PORT;

corsProxy
  .createServer({
    originWhitelist: process.env.REACT_APP_PROXY_ORIGIN_WHITELIST.split(' '),
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
  })
  .listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Running CORS Anywhere on ${protocol}${host}:${port}`);
  });
