import { sql } from "./connection.ts"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const seedPath = path.resolve(__dirname, "seed.sql")
const seedSql = readFileSync(seedPath, "utf-8")

console.log("Executando seed.sql...")

await sql.unsafe(seedSql)
await sql.end()

console.log("🌱 Seed executado com sucesso!")
