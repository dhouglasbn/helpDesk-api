import { z } from "zod"

const isTest = process.env.NODE_ENV === "test"

const envSchema = z.object({
	PORT: z.coerce.number().default(3333),
	DATABASE_URL: isTest
		? z.string().default("postgres://docker:docker@localhost:5433/helpdesk_test")
		: z.url().startsWith("postgres://"),
	JWT_SECRET: z
		.string()
		.min(8)
		.default(isTest ? "test-secret-key-for-testing" : ""),
})

export const env = envSchema.parse(process.env)
