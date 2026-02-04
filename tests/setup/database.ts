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
		await sql.unsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;

        -- Drop enums
        FOR r IN (
          SELECT typname FROM pg_type
          WHERE typtype = 'e'
          AND typnamespace = 'public'::regnamespace
        ) LOOP
          EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `)

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
