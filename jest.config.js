module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				noImplicitAny: true,
				strict: true,
			},
		}],
	},
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
	testPathIgnorePatterns: [
		'<rootDir>/src/__tests__/setup.ts',
		'<rootDir>/src/__tests__/mocks/',
	],
}; 