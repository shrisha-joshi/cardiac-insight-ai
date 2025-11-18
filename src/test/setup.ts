// Vitest setup file for extending matchers and test environment
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './msw/server';

// Start MSW for all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Optional: silence console noise in tests (uncomment if desired)
// const originalError = console.error;
// console.error = (...args: unknown[]) => {
//   if (/Warning:.*not wrapped in act/.test(String(args[0]))) return;
//   originalError(...args);
// };
