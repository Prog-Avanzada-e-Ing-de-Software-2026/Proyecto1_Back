module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.int-spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: false,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@nestjs/mapped-types$': '<rootDir>/test/harness/nestjs-mapped-types.cjs',
  },
  testTimeout: 240000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
};
