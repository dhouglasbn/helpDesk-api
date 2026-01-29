import { closeTestDatabase } from "./setup/database.ts"

/**
 * Global teardown - runs once after all tests
 */
export default async function globalTeardown() {
	console.log("\n=== Ending Test Suite ===")
	try {
		await closeTestDatabase()
		console.log("Database connection closed successfully")
	} catch (error) {
		console.error("Error during teardown:", error)
		throw error
	}
}
