const { defaults } = require("jest-config");
module.exports = {
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ["<rootDir>/src"],
  verbose: true,
  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
    "^.+\\.ts$": "ts-jest",
    "^.+\\.svg$": "<rootDir>src/tests/core/svgTransform.js",
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "\\.(scss|sass|css)$": "identity-obj-proxy",
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
    ...defaults.moduleFileExtensions,
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node",
    "svg",
    "json",
    "scss",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
