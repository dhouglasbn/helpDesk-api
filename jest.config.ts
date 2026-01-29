export default {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/tests/**/*.spec.ts"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/db/seed.ts"],
	testTimeout: 10_000,
	setupFiles: ["<rootDir>/tests/setup.ts"],
	globalSetup: "<rootDir>/tests/globalSetup.ts",
	globalTeardown: "<rootDir>/tests/globalTeardown.ts",
	forceExit: true,
	detectOpenHandles: true,
}
