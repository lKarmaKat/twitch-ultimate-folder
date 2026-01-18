export default  {
    transform: {
    '^.+\\.ts$': 'babel-jest'
    },
  transformIgnorePatterns: [
    'node_modules/(?!(svelte)/)'
  ],
  extensionsToTreatAsEsm: ['.svelte'],
  testEnvironment: 'jsdom',
    testMatch: ['**/tests/**/*test*'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1'
    },

}