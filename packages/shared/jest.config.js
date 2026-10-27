/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@pawfectpair/shared$': '<rootDir>/src/index.ts',
    '^@pawfectpair/shared/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  verbose: true
};
