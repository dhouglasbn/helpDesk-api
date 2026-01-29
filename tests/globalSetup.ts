import { cleanupTestDatabase, closeTestDatabase } from "./setup/database.ts"

/**
 * Global setup - runs once before all tests
 */
export default async function globalSetup() {
	console.log("\n=== Starting Test Suite ===\n")
	await cleanupTestDatabase()
}
