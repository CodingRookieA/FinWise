/**
 * Security smoke tests do not need MongoMemoryServer (see __tests__/setup.js).
 * Run: npm run test:security
 */
export default {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/unit/security*.test.js'],
    setupFilesAfterEnv: [],
}
