// jest.setup.js

const CONSOLE_FAIL_TYPES = ["warn", "error"];

// Throw errors when a `console.error` or `console.warn` happens
// by overriding the functions
CONSOLE_FAIL_TYPES.forEach((type) => {
  console[type] = (message) => {};
});
