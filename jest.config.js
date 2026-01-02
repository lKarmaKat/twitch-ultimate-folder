export default  {

    setupFilesAfterEnv: ['./jest.setup.js'],
    transform: {
        '^.+\\.ts$': 'babel-jest',
    },
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1',
    },

}