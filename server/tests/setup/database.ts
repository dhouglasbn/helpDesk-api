// biome-ignore assist/source/organizeImports: <sorted>
import { sql } from "../../src/db/connection.ts"
import fs from "node:fs"
import path from "node:path"

/**
 * Run all migrations on the test database
 */
export async function runMigrations() {
	try {
		const migrationsDir = path.resolve(process.cwd(), "src/db/migrations")
		const migrationFiles = fs
			.readdirSync(migrationsDir)
			.filter((file) => file.endsWith(".sql"))
			.sort()

		console.log(`Running ${migrationFiles.length} migrations...`)

		for (const file of migrationFiles) {
			const filePath = path.join(migrationsDir, file)
			let migrationSQL = fs.readFileSync(filePath, "utf-8")

			// Remove Drizzle comments like "--> statement-breakpoint"
			// Important: They can be on the SAME line as the statement
			migrationSQL = migrationSQL.replace(/--> statement-breakpoint/g, ";").trim()

			console.log(`\nExecuting migration: ${file}`)

			// Split statements by semicolon but handle dollar-quoted strings
			// For now, we'll use a simple split and execute method
			// PostgreSQL supports executing multiple statements if they're properly split
			const statements: string[] = []
			let currentStatement = ""
			let inDollarQuote = false
			let dollarQuoteDelimiter = ""

			for (let i = 0; i < migrationSQL.length; i++) {
				const char = migrationSQL[i]
				const remaining = migrationSQL.substring(i)

				// Check for dollar quote start/end
				if (char === "$") {
					const dollarMatch = remaining.match(/^\$\w*\$/)
					if (dollarMatch) {
						const delimiter = dollarMatch[0]
						if (!inDollarQuote) {
							inDollarQuote = true
							dollarQuoteDelimiter = delimiter
							currentStatement += delimiter
							i += delimiter.length - 1
							continue
						} else if (delimiter === dollarQuoteDelimiter) {
							inDollarQuote = false
							currentStatement += delimiter
							i += delimiter.length - 1
							continue
						}
					}
				}

				currentStatement += char

				// Check for statement end (semicolon outside of dollar quotes)
				if (char === ";" && !inDollarQuote) {
					if (currentStatement.trim()) {
						statements.push(currentStatement.trim())
					}
					currentStatement = ""
				}
			}

			// Add any remaining statement
			if (currentStatement.trim()) {
				statements.push(currentStatement.trim())
			}

			console.log(`Found ${statements.length} statements`)

			// Execute each statement individually
			for (let i = 0; i < statements.length; i++) {
				const statement = statements[i]
				const preview = statement.length > 50 ? `${statement.substring(0, 50)}...` : statement
				console.log(`  [${i + 1}/${statements.length}] Executing: ${preview}`)

				try {
					await sql.unsafe(statement)
					console.log(`  [${i + 1}/${statements.length}] SUCCESS`)
				} catch (stmtError) {
					// Log the error but check the code
					// biome-ignore lint/suspicious/noExplicitAny: <error inspection>
					const code = (stmtError as any)?.code
					// biome-ignore lint/suspicious/noExplicitAny: <error inspection>
					const message = (stmtError as any)?.message
					console.error(`  [${i + 1}/${statements.length}] ERROR (code: ${code}): ${message}`)

					// If it's a "type already exists" error (42710), skip it
					if (code === "42710") {
						console.log(`  [${i + 1}/${statements.length}] Skipping (type already exists)`)
						continue
					}
					throw stmtError
				}
			}
		}

		console.log("\nMigrations completed successfully!")
	} catch (error) {
		console.error("Failed to run migrations:", error)
		throw error
	}
}

/**
 * Clear all data from test database
 */
export async function cleanupTestDatabase() {
	try {
		// Try to drop and recreate the database, but if that fails, just clear the schema
		try {
			// Close the current connection first
			const currentSql = sql
			// Reconnect to postgres database (not helpdesk_test) to drop helpdesk_test
			const adminSql = await import("postgres").then((m) =>
				m.default("postgres://docker:docker@localhost:5433/postgres"),
			)

			await adminSql`DROP DATABASE IF EXISTS helpdesk_test`
			await adminSql`CREATE DATABASE helpdesk_test`
			await adminSql.end()

			console.log("Database recreated successfully")
		} catch (dbError) {
			console.warn("Could not recreate database via admin connection, falling back to schema cleanup")

			// Fallback: drop all objects in public schema
			// First, get all tables
			// biome-ignore lint/suspicious/noExplicitAny: <any is ok>
			const tablesResult: any[] = await sql`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `

			const tables = tablesResult.map((row) => row.tablename)

			// Drop all tables with CASCADE to remove foreign keys and types
			for (const table of tables) {
				try {
					await sql.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`)
				} catch (e) {
					// Table might have been dropped already
				}
			}

			// Now drop any orphaned types (enums)
			try {
				// biome-ignore lint/suspicious/noExplicitAny: <any is ok>
				const typesResult: any[] = await sql`
          SELECT typname FROM pg_type 
          WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          AND typtype = 'e'
        `

				for (const typeRow of typesResult) {
					try {
						await sql.unsafe(`DROP TYPE IF EXISTS "public"."${typeRow.typname}" CASCADE`)
					} catch (e) {
						// Type might have been dropped, continue
					}
				}
			} catch (e) {
				// No types to drop
			}
		}

		// Now run migrations to recreate schema
		await runMigrations()
	} catch (error) {
		console.error("Failed to cleanup test database:", error)
		throw error
	}
}

/**
 * Close database connection
 */
export async function closeTestDatabase() {
	try {
		await sql.end()
	} catch (error) {
		console.error("Failed to close test database:", error)
		throw error
	}
}
