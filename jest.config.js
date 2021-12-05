module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'test',
    setupFilesAfterEnv: ['@alex_neo/jest-expect-message'],
};
