import { vi } from 'vitest';

// Early setup for Vitest: provide lightweight mocks

// Provide a simple clipboard mock to avoid per-test duplication
if (typeof navigator !== 'undefined') {
  // Some environments disallow direct assignment to navigator.clipboard
  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(() => true),
      },
    });
  } catch (e) {
    // If defineProperty fails, skip defining clipboard to avoid type/assignment errors
  }
}
