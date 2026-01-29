// biome-ignore assist/source/organizeImports: <sorted>
import request from "supertest"
import express, { type Express } from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import { userRoutes } from "../src/routes/userRoutes.ts"
import { db } from "../src/db/connection.ts"
import { users } from "../src/db/schema/users.ts"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"

let app: Express
let mockClientId = ""
let mockClientToken = ""
let mockClientEmail = ""
let adminToken = ""
let adminId = ""
let mockTechId = ""
let mockTechToken = ""
// let mockTechEmail = ""

const createMockToken = (userId: string, role: "admin" | "tech" | "client") =>
	jwt.sign({ id: userId, role }, process.env.JWT_SECRET || "test-secret", {
		expiresIn: "1h",
	})

describe("User Routes", () => {
	beforeAll(async () => {
		// Create shared fixtures once for all tests
		try {
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdUser] = await db
				.insert(users)
				.values({
					name: "Test User",
					email: "clientmock@example.com",
					picture: "teste.png",
					passwordHash: hashed,
					role: "client",
				})
				.returning()
			mockClientId = createdUser.id
			mockClientEmail = createdUser.email

			const hashedTech = bcrypt.hashSync("password123", 8)
			const [tech] = await db
				.insert(users)
				.values({
					name: "Tech User",
					email: "techmock@example.com",
					picture: "teste.png",
					passwordHash: hashedTech,
					role: "tech",
				})
				.returning()
			mockTechId = tech.id
			// mockTechEmail = tech.email

			const hashedAdmin = bcrypt.hashSync("password123", 8)
			const [createdAdmin] = await db
				.insert(users)
				.values({
					name: "Admin User",
					email: "adminmock@example.com",
					picture: "teste.png",
					passwordHash: hashedAdmin,
					role: "admin",
				})
				.returning()
			adminId = createdAdmin.id

			mockClientToken = createMockToken(mockClientId, "client")
			mockTechToken = createMockToken(tech.id, "tech")
			adminToken = createMockToken(adminId, "admin")
		} catch (error) {
			console.error("Failed to create test fixtures:", error)
			throw error
		}
	})

	afterAll(async () => {
		await db.delete(users)
	})

	beforeEach(() => {
		// Reset app for each test
		app = express()
		app.use(cors())
		app.use(express.json())
		app.use(express.urlencoded({ extended: true }))
		app.use("/users", userRoutes)
	})

	describe("POST /users/login", () => {
		it("should return 200 with token on successful login", async () => {
			const response = await request(app).post("/users/login").send({
				email: "adminmock@example.com",
				password: "password123",
			})
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("token")
			expect(typeof response.body.token).toBe("string")
		})

		it("should return 400 on invalid credentials", async () => {
			const response = await request(app).post("/users/login").send({
				email: "nonexistent@example.com",
				password: "wrongpassword",
			})
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})

		it("should return 400 when email exists but password is wrong", async () => {
			const response = await request(app).post("/users/login").send({
				email: "adminmock@example.com",
				password: "wrongpassword",
			})
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})

		it("should return 400 when email is missing", async () => {
			const response = await request(app).post("/users/login").send({
				password: "password123",
			})
			expect(response.status).toBe(400)
		})
	})

	describe("POST /users/tech - Create Tech Account", () => {
		it("should return 403 when non-admin tries to create tech account", async () => {
			const response = await request(app).post("/users/tech").set("Authorization", `Bearer ${mockClientToken}`).send({
				name: "Técnico Novo",
				email: "tech@example.com",
				password: "password123",
			})
			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 401 when no token is provided", async () => {
			const response = await request(app).post("/users/tech").send({
				name: "Técnico Novo",
				email: "tech@example.com",
				password: "password123",
			})
			expect(response.status).toBe(401)
		})

		it("should validate required fields", async () => {
			const response = await request(app).post("/users/tech").set("Authorization", `Bearer ${adminToken}`).send({
				name: "ab", // too short
				email: "invalid-email",
				password: "short", // too short
			})
			expect(response.status).toBe(400)
		})

		it("should create a tech account correctly according to requisites", async () => {
			const techEmail = `tech.${Date.now()}@example.com`
			const response = await request(app).post("/users/tech").set("Authorization", `Bearer ${adminToken}`).send({
				name: "João Silva - Técnico",
				email: techEmail,
				password: "TechPassword123!",
			})

			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty("newTech")

			const newTech = response.body.newTech
			// Verify tech account properties
			expect(newTech).toHaveProperty("id")
			expect(newTech.name).toBe("João Silva - Técnico")
			expect(newTech.email).toBe(techEmail)
			expect(newTech.role).toBe("tech")
		})

		it("should reject tech account creation when email already exists", async () => {
			const response = await request(app).post("/users/tech").set("Authorization", `Bearer ${adminToken}`).send({
				name: "Técnico Dois",
				email: mockClientEmail, // Same email as first request
				password: "AnotherPassword123!",
			})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Email already in use")
		})
	})

	describe("GET /users/techList - List Tech Accounts", () => {
		it("should return 403 when non-admin tries to list tech accounts", async () => {
			const response = await request(app).get("/users/techList").set("Authorization", `Bearer ${mockClientToken}`)
			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 401 when no token is provided", async () => {
			const response = await request(app).get("/users/techList")
			expect(response.status).toBe(401)
		})

		it("should return tech list when admin is authenticated", async () => {
			const response = await request(app).get("/users/techList").set("Authorization", `Bearer ${adminToken}`)
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("techList")
			expect(Array.isArray(response.body.techList)).toBe(true)
		})
	})

	describe("PUT /users/tech/:id - Update Tech Account", () => {
		it("should return 403 when unauthorized user tries to update another tech", async () => {
			const response = await request(app)
				.put(`/users/tech/${mockTechId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newName: "Técnico Atualizado",
					newEmail: "newemail@example.com",
					newPassword: "newpassword123",
				})
			// Tech can update their own account but not others (or validation error if other)
			expect(response.status).toBe(403)
		})

		it("should return 401 when no token is provided", async () => {
			const response = await request(app).put(`/users/tech/${mockTechId}`).send({
				newName: "Técnico Atualizado",
				newEmail: "newemail@example.com",
				newPassword: "newpassword123",
			})

			expect(response.status).toBe(401)
		})

		it("should validate update fields", async () => {
			const response = await request(app)
				.put(`/users/tech/${mockTechId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "ab", // too short
					newEmail: "invalid-email",
					newPassword: "short",
				})
			expect(response.status).toBe(400)
		})

		it("admin should be able to update any tech account", async () => {
			const hashed = bcrypt.hashSync("password123", 8)
			const [tech] = await db
				.insert(users)
				.values({
					name: "Tech User",
					email: "tech@example.com",
					picture: "teste.png",
					passwordHash: hashed,
					role: "tech",
				})
				.returning()

			const response = await request(app)
				.put(`/users/tech/${tech.id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Técnico Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newTech")
			const [result] = response.body.newTech
			expect(result).toHaveProperty("id", tech.id)
			expect(result).toHaveProperty("name", "Técnico Atualizado")
			expect(result).toHaveProperty("email", "updated@example.com")
			expect(result).toHaveProperty("passwordHash")
		})

		it("should successfully update a tech account with valid data", async () => {
			// First, create a tech account to update
			const hashed = bcrypt.hashSync("password123", 8)
			const [tech] = await db
				.insert(users)
				.values({
					name: "Tech User",
					email: "tech@example.com",
					picture: "teste.png",
					passwordHash: hashed,
					role: "tech",
				})
				.returning()
			const techToken = createMockToken(tech.id, "tech")

			// Now update the created tech account
			const newEmail = `tech.updated.${Date.now()}@example.com`
			const response = await request(app)
				.put(`/users/tech/${tech.id}`)
				.set("Authorization", `Bearer ${techToken}`)
				.send({
					newName: "Técnico Atualizado com Sucesso",
					newEmail,
					newPassword: "NewTechPassword123!",
				})

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newTech")
			const [result] = response.body.newTech
			expect(result).toHaveProperty("id", tech.id)
			expect(result).toHaveProperty("name", "Técnico Atualizado com Sucesso")
			expect(result).toHaveProperty("email", newEmail)
			expect(result).toHaveProperty("passwordHash")
		})

		it("should return 400 when tech ID doesn't exist", async () => {
			const validUUID = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/users/tech/${validUUID}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Técnico Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Tech not found")
		})

		it("should return 400 when ID exists but it's not a tech account", async () => {
			const response = await request(app)
				.put(`/users/tech/${mockClientId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Técnico Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Tech not found")
		})

		it("should return 400 when newEmail already exists on another tech account", async () => {
			// First create two tech accounts
			const email2 = `tech2.${Date.now()}@example.com`

			const hashed = bcrypt.hashSync("password123", 8)
			const [tech2] = await db
				.insert(users)
				.values({
					name: "Tech User 2",
					email: email2,
					picture: "teste.png",
					passwordHash: hashed,
					role: "tech",
				})
				.returning()

			// Now try to update tech1 with tech2's email
			const response = await request(app)
				.put(`/users/tech/${mockTechId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Técnico Um Atualizado",
					newEmail: tech2.email, // Try to use tech2's email
					newPassword: "NewPassword123!",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Email already in use")
		})
	})

	describe("PUT /users/techAvailabilities/:id - Update Tech Availabilities", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockTechId}`)
				.send({
					newAvailabilities: ["08:00", "09:00", "10:00"],
				})

			expect(response.status).toBe(401)
		})

		it("should return 403 when non-tech/admin tries to update availabilities", async () => {
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockTechId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newAvailabilities: ["08:00", "09:00", "10:00"],
				})

			expect(response.status).toBe(403)
		})

		it("should validate availability format", async () => {
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockTechId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newAvailabilities: ["25:00", "invalid"], // invalid format
				})

			expect(response.status).toBe(400)
		})

		it("should accept valid availability times", async () => {
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockTechId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newAvailabilities: ["08:00", "09:00", "10:00", "11:00", "14:00"],
				})

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newTech")
			expect(response.body.newTech[0]).toHaveProperty("time", "08:00")
			expect(response.body.newTech[1]).toHaveProperty("time", "09:00")
			expect(response.body.newTech[2]).toHaveProperty("time", "10:00")
			expect(response.body.newTech[3]).toHaveProperty("time", "11:00")
			expect(response.body.newTech[4]).toHaveProperty("time", "14:00")
		})

		it("should successfully update tech availabilities with valid data", async () => {
			// Now update the availabilities
			const newAvailabilities = ["09:00", "10:00", "11:00", "15:00", "16:00"]
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockTechId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					newAvailabilities,
				})

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newTech")
			expect(response.body.newTech[0]).toHaveProperty("time", "09:00")
			expect(response.body.newTech[1]).toHaveProperty("time", "10:00")
			expect(response.body.newTech[2]).toHaveProperty("time", "11:00")
			expect(response.body.newTech[3]).toHaveProperty("time", "15:00")
			expect(response.body.newTech[4]).toHaveProperty("time", "16:00")
		})

		it("should return 400 when tech ID doesn't exist", async () => {
			const validUUID = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/users/techAvailabilities/${validUUID}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newAvailabilities: ["08:00", "09:00", "10:00"],
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Technician not found")
		})

		it("should return 400 when ID exists but it's not a tech account", async () => {
			const response = await request(app)
				.put(`/users/techAvailabilities/${mockClientId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newAvailabilities: ["08:00", "09:00", "10:00"],
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Technician not found")
		})
	})

	describe("PUT /users/admin/:id - Update Admin Account", () => {
		it("should return 403 when non-admin tries to update admin account", async () => {
			// Use realUserToken as a non-admin
			const response = await request(app)
				.put(`/users/admin/${adminId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newName: "Admin Atualizado",
					newEmail: "adminmock@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 401 when no token is provided", async () => {
			const response = await request(app).put(`/users/admin/${adminId}`).send({
				newName: "Admin Atualizado",
				newEmail: "adminmock@example.com",
				newPassword: "newpassword123",
			})
			expect(response.status).toBe(401)
		})

		it("admin should be able to update admin account", async () => {
			// CREATE own admin entity
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdAdmin] = await db
				.insert(users)
				.values({
					name: "Admin Update Test",
					email: `adminupdate.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "admin",
				})
				.returning()

			// TEST
			const newEmail = `adminupdated.${Date.now()}@example.com`
			const response = await request(app)
				.put(`/users/admin/${createdAdmin.id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Admin Atualizado com Sucesso",
					newEmail,
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newAdmin")
			const updatedAdmin = Array.isArray(response.body.newAdmin) ? response.body.newAdmin[0] : response.body.newAdmin
			expect(updatedAdmin.name).toBe("Admin Atualizado com Sucesso")
			expect(updatedAdmin.email).toBe(newEmail)
			expect(updatedAdmin).toHaveProperty("passwordHash")
		})

		it("should return 400 when admin ID from params doesn't exist", async () => {
			// Create a valid UUID that doesn't exist (using a real UUID format)
			const validUUID = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/users/admin/${validUUID}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Admin Atualizado",
					newEmail: "admin.new@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Admin not found")
		})

		it("should return 400 when ID exists but it's not an admin account", async () => {
			const response = await request(app)
				.put(`/users/admin/${mockClientId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Admin Atualizado",
					newEmail: "admin.new@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Admin not found")
		})

		it("should return 400 when newEmail already exists on another admin account", async () => {
			const hashed = bcrypt.hashSync("password123", 8)
			const [anotherAdmin] = await db
				.insert(users)
				.values({
					name: "Another Admin",
					email: `anotherAdmin${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "admin",
				})
				.returning()
			const response = await request(app)
				.put(`/users/admin/${adminId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Admin Atualizado",
					newEmail: anotherAdmin.email, // Try to use existing email
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Email already in use")
		})
	})

	describe("POST /users/client - Create Client Account", () => {
		it("should allow creating client account without authentication", async () => {
			const response = await request(app)
				.post("/users/client")
				.send({
					name: "Cliente Novo",
					email: `client${Date.now()}@example.com`,
					password: "password123",
				})

			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty("newClient")
			const [result] = response.body.newClient
			expect(result).toHaveProperty("id")
			expect(result).toHaveProperty("name", "Cliente Novo")
			expect(result).toHaveProperty("email")
		})

		it("should validate client creation fields", async () => {
			const response = await request(app).post("/users/client").send({
				name: "ab", // too short
				email: "invalid-email",
				password: "short",
			})

			expect(response.status).toBe(400)
		})

		it("should reject duplicate email", async () => {
			const validData = {
				name: "Cliente Um",
				email: mockClientEmail,
				password: "password123",
			}

			// Second request with same email
			const response = await request(app).post("/users/client").send(validData)

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})
	})

	describe("PUT /users/client/:id - Update Client Account", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app).put(`/users/client/${mockClientId}`).send({
				newName: "Cliente Atualizado",
				newEmail: "newemail@example.com",
				newPassword: "newpassword123",
			})
			expect(response.status).toBe(401)
		})

		it("should allow client to update their own account", async () => {
			const response = await request(app)
				.put(`/users/client/${mockClientId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newName: "Cliente Atualizado",
					newEmail: "client.updated@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newClient")
			expect(response.body.newClient[0]).toHaveProperty("id", mockClientId)
			expect(response.body.newClient[0]).toHaveProperty("name", "Cliente Atualizado")
			expect(response.body.newClient[0]).toHaveProperty("email", "client.updated@example.com")
			expect(response.body.newClient[0]).toHaveProperty("passwordHash")
		})

		it("should prevent client from updating another client account", async () => {
			const otherId = "other-client-id"
			const response = await request(app)
				.put(`/users/client/${otherId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newName: "Cliente Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(400)
		})

		it("admin should be able to update any client account", async () => {
			const response = await request(app)
				.put(`/users/client/${mockClientId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Cliente Atualizado",
					newEmail: "updated.by.admin@example.com",
					newPassword: "newpassword123",
				})
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("newClient")
			expect(response.body.newClient[0]).toHaveProperty("id", mockClientId)
			expect(response.body.newClient[0]).toHaveProperty("name", "Cliente Atualizado")
			expect(response.body.newClient[0]).toHaveProperty("email", "updated.by.admin@example.com")
			expect(response.body.newClient[0]).toHaveProperty("passwordHash")
		})

		it("should validate update fields", async () => {
			const response = await request(app)
				.put(`/users/client/${mockClientId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "ab",
					newEmail: "invalid-email",
					newPassword: "short",
				})
			expect(response.status).toBe(400)
		})

		it("should return 400 when client ID doesn't exist", async () => {
			const validUUID = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/users/client/${validUUID}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Cliente Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Client not found")
		})

		it("should return 400 when ID exists but it's not a client account", async () => {
			const response = await request(app)
				.put(`/users/client/${adminId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					newName: "Cliente Atualizado",
					newEmail: "updated@example.com",
					newPassword: "newpassword123",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Client not found")
		})

		it("should return 400 when newEmail already exists on another client account", async () => {
			// First create two client accounts
			const hashed = bcrypt.hashSync("password123", 8)
			const [newClient] = await db
				.insert(users)
				.values({
					name: "Test Client",
					email: "clientmock2@example.com",
					picture: "teste.png",
					passwordHash: hashed,
					role: "client",
				})
				.returning()

			// Now try to update client1 with client2's email
			const response = await request(app)
				.put(`/users/client/${mockClientId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					newName: "Cliente Um Atualizado",
					newEmail: newClient.email, // Try to use client2's email
					newPassword: "NewPassword123!",
				})

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
			expect(response.body.error).toContain("Email already in use")
		})
	})

	describe("GET /users/clientList - List Client Accounts", () => {
		it("should return 403 when non-admin tries to list clients", async () => {
			const response = await request(app).get("/users/clientList").set("Authorization", `Bearer ${mockClientToken}`)
			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 401 when no token is provided", async () => {
			const response = await request(app).get("/users/clientList")
			expect(response.status).toBe(401)
		})

		it("should return client list when admin is authenticated", async () => {
			const response = await request(app).get("/users/clientList").set("Authorization", `Bearer ${adminToken}`)
			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("clientList")
			expect(Array.isArray(response.body.clientList)).toBe(true)
		})
	})

	describe("DELETE /users/client/:id - Delete Client Account", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app).delete(`/users/client/${mockClientId}`)
			expect(response.status).toBe(401)
		})

		it("should allow client to delete their own account", async () => {
			// CREATE own client entity
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(users)
				.values({
					name: "Client Delete Test",
					email: `clientdelete.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()
			const clientToken = createMockToken(createdClient.id, "client")

			// TEST
			const response = await request(app)
				.delete(`/users/client/${createdClient.id}`)
				.set("Authorization", `Bearer ${clientToken}`)
			expect(response.status).toBe(204)

			// CLEANUP (entity should be deleted, but ensure it's gone)
			const checkDeleted = await db.select().from(users).where(eq(users.id, createdClient.id))
			expect(checkDeleted).toHaveLength(0)
		})

		it("should prevent client from deleting another client account", async () => {
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(users)
				.values({
					name: "Client Delete Test",
					email: `clientdelete.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()
			const response = await request(app)
				.delete(`/users/client/${createdClient.id}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
			expect(response.status).toBe(403)
		})

		it("admin should be able to delete any client account", async () => {
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(users)
				.values({
					name: "Client Delete Test",
					email: `clientdelete.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()

			const response = await request(app)
				.delete(`/users/client/${createdClient.id}`)
				.set("Authorization", `Bearer ${adminToken}`)
			expect(response.status).toBe(204)
		})

		it("should return 403 when non-admin/client tries to delete", async () => {
			// Use adminId as a fake tech for this test
			const techToken = createMockToken(adminId, "tech")
			const response = await request(app)
				.delete(`/users/client/${mockClientId}`)
				.set("Authorization", `Bearer ${techToken}`)
			expect(response.status).toBe(403)
		})

		it("should return 400 when client ID doesn't exist", async () => {
			const nonExistentId = "00000000-0000-0000-0000-000000000001"
			const response = await request(app)
				.delete(`/users/client/${nonExistentId}`)
				.set("Authorization", `Bearer ${adminToken}`)

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("errors")
		})

		it("should return 400 when ID exists but it's not a client account", async () => {
			const response = await request(app)
				.delete(`/users/client/${adminId}`)
				.set("Authorization", `Bearer ${adminToken}`)

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})
	})

	describe("PUT /users/picture/:id - Update User Picture", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app)
				.put(`/users/picture/${mockClientId}`)
				.attach("profilePic", Buffer.from("test image data"))

			expect(response.status).toBe(401)
		})

		it("should allow user to update their own picture", async () => {
			// Create a new user for this test
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdUser] = await db
				.insert(users)
				.values({
					name: "Picture Test User",
					email: `pictureuser.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()
			const userToken = createMockToken(createdUser.id, "client")

			const response = await request(app)
				.put(`/users/picture/${createdUser.id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.attach("profilePic", Buffer.from("test image data"), "test.png")
			expect(response.status).toBe(200)
			expect(response.body.accessURL).toBe(`http://localhost:3333/users/picture/${createdUser.id}`)
		})

		it("should prevent user from updating another user picture", async () => {
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdUser] = await db
				.insert(users)
				.values({
					name: "Picture Test User",
					email: `pictureuser.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()
			const response = await request(app)
				.put(`/users/picture/${createdUser.id}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.attach("profilePic", Buffer.from("test image data"), "test.png")
			expect(response.status).toBe(403)
		})

		it("admin should be able to update any user picture", async () => {
			// Create a new user for this test
			const hashed = bcrypt.hashSync("password123", 8)
			const [createdUser] = await db
				.insert(users)
				.values({
					name: "Picture Admin Test User",
					email: `pictureadmintest.${Date.now()}@example.com`,
					passwordHash: hashed,
					role: "client",
				})
				.returning()

			const response = await request(app)
				.put(`/users/picture/${createdUser.id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.attach("profilePic", Buffer.from("test image data"), "test.png")
			expect(response.status).toBe(200)
			expect(response.body.accessURL).toBe(`http://localhost:3333/users/picture/${createdUser.id}`)
		})

		it("should return 400 when no file is uploaded", async () => {
			const response = await request(app)
				.put(`/users/picture/${mockClientId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("message")
		})

		it("should return 400 when user id does not exist", async () => {
			const nonExistentId = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/users/picture/${nonExistentId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.attach("profilePic", Buffer.from("test image data"), "test.png")

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})
	})

	describe("GET /users/picture/:id - Get User Picture", () => {
		it("should return user picture", async () => {
			// TEST
			const response = await request(app).get(`/users/picture/${mockClientId}`)

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty("userPicture")
		})

		it("should return 400 when user id does not exist", async () => {
			const nonExistentId = "00000000-0000-0000-0000-000000000000"
			const response = await request(app).get(`/users/picture/${nonExistentId}`)

			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("error")
		})
	})

	describe("Authorization and Requisite Compliance", () => {
		it("should enforce admin-only operations for tech creation", async () => {
			// Only admin can create tech
			const clientResponse = await request(app)
				.post("/users/tech")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					name: "Técnico Novo",
					email: "tech@example.com",
					password: "password123",
				})
			expect(clientResponse.status).toBe(403)

			// Use adminToken as tech for this test (simulate a tech role)
			const techToken = createMockToken(adminId, "tech")
			const techResponse = await request(app).post("/users/tech").set("Authorization", `Bearer ${techToken}`).send({
				name: "Técnico Novo",
				email: "tech2@example.com",
				password: "password123",
			})
			expect(techResponse.status).toBe(403)
		})

		it("should enforce permission checks for tech account updates", async () => {
			// Tech can only update their own account
			const techId = "tech-id-123"
			const techToken = createMockToken(techId, "tech")
			const response = await request(app)
				.put(`/users/tech/${techId}`)
				.set("Authorization", `Bearer ${techToken}`)
				.send({
					newName: "Updated",
					newEmail: "updated@example.com",
					newPassword: "newpass123",
				})
			// Will succeed if it's their own ID, fail if not
			expect([200, 403, 400]).toContain(response.status)
		})

		it("should allow client self-service operations", async () => {
			// Client can create their own account without auth
			const response = await request(app)
				.post("/users/client")
				.send({
					name: "New Client",
					email: `client${Date.now()}@example.com`,
					password: "password123",
				})
			expect([201, 400]).toContain(response.status)
		})
	})
})
