// Test selection is manifest-driven: test/config/without-testcontainers.json
// and test/config/with-testcontainers.json list the exact spec paths that run
// in each suite, and a file listed in neither does not run.
//
// The suite is chosen with the TEST_SUITE environment variable, set by the npm
// scripts (`test`, `test:watch`, `test:cov`, `test:debug` -> "without";
// `test:integration` -> "with"). A direct Jest invocation without the variable
// defaults to the "without" suite.
const suite = process.env.TEST_SUITE === 'with' ? 'with' : 'without';
const isIntegration = suite === 'with';
const testMatch = require(`./test/config/${suite}-testcontainers.json`).map(
  (file) => `<rootDir>/${file}`,
);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testMatch,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: !isIntegration,
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@nestjs/mapped-types$': '<rootDir>/test/harness/nestjs-mapped-types.cjs',
  },
  ...(isIntegration ? { testTimeout: 240000, maxWorkers: 1 } : {}),
};
