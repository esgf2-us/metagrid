// eslint-disable-next-line @typescript-eslint/no-var-requires
const corsProxy = require('cors-anywhere');

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 8080;

corsProxy
  .createServer({
    originWhitelist: ['http://localhost:3000'],
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
  })
  .listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Running CORS Anywhere on ${host}:${port}`);
  });
