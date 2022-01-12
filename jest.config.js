module.exports = {
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ["<rootDir>/src"],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
    "^.+\\.ts$": "ts-jest",
    "^.+\\.svg$": "<rootDir>src/tests/core/svgTransform.js",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  // Runs special logic, such as cleaning up components
  // when using React Testing Library and adds special
  // extended assertions to Jest
  // setupFilesAfterEnv: [
  //   "@testing-library/react/cleanup-after-each",
  //   "@testing-library/jest-dom/extend-expect",
  // ],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "<rootDir>/src/**/*.tsx"],
  // Module file extensions for importing
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node",
    "svg",
    "json",
  ],
};
