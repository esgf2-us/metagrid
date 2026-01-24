// Lightweight early setup to ensure Vitest global timeout is applied ASAP
// This file must be imported before other setup files to override the default 5s timeout.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, no-underscore-dangle */

// Use the global `vi` if available in the setup environment.
const _globalVi = (globalThis as any).vi;
if (_globalVi && typeof _globalVi.setTimeout === 'function') {
  _globalVi.setTimeout(120000);
}
