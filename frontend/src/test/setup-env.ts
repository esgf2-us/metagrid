// test/setup-env.js
// add this to your setupFilesAfterEnv config in jest so it's imported for every test file
import { server, rest } from './server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export { server, rest };
