module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'agents/**/*.ts',
    'blueprint/**/*.ts',
    'parsers/**/*.ts',
    'services/**/*.ts',
  ],
  coverageDirectory: 'coverage',
};