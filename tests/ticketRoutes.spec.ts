// biome-ignore assist/source/organizeImports: <sorted>
import request from "supertest"
import express, { type Express } from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { db } from "../src/db/connection.ts"
import { schema } from "../src/db/schema/index.ts"

import { ticketRoutes } from "../src/routes/ticketRoutes.ts"

let app: Express

// Shared fixture IDs (created once in beforeAll)
let realAdminId = ""
let realTechId1 = ""
let realTechId2 = ""
let realClientId = ""
let realClientId2 = ""
let realServiceId1 = ""
let realServiceId2 = ""
let realTicketId = ""

// Mock auth tokens
const createMockToken = (userId: string, role: "admin" | "tech" | "client") =>
	jwt.sign({ id: userId, role }, process.env.JWT_SECRET || "test-secret", {
		expiresIn: "1h",
	})

let mockAdminToken = ""
let mockTechToken = ""
let mockTech2Token = ""
let mockClientToken = ""
let mockClient2Token = ""
const nonExistentUUID = "550e8400-e29b-41d4-a716-446655440000";


describe("Ticket Routes", () => {
	beforeAll(async () => {
		app = express()
		app.use(cors())
		app.use(express.json())
		app.use(express.urlencoded({ extended: true }))
		app.use("/tickets", ticketRoutes)

		// Create shared fixtures once for all tests
		try {
			const hashedAdmin = bcrypt.hashSync("password123", 8)
			const [createdAdmin] = await db
				.insert(schema.users)
				.values({
					name: "Admin User",
					email: `admin.${Date.now()}@test.com`,
					passwordHash: hashedAdmin,
					phone: "1234567890",
					address: "123 Main St",
					role: "admin",
				})
				.returning()
			realAdminId = createdAdmin.id

			const hashedTech1 = bcrypt.hashSync("password123", 8)
			const [createdTech1] = await db
				.insert(schema.users)
				.values({
					name: "Tech User 1",
					email: `tech1.${Date.now()}@test.com`,
					passwordHash: hashedTech1,
					phone: "1234567890",
					address: "123 Main St",
					role: "tech",
				})
				.returning()
			realTechId1 = createdTech1.id

			const currentHour = `${new Date().toTimeString().slice(0, 2)}:00`
			await db.insert(schema.techniciansAvailabilities).values({
				userId: realTechId1,
				time: currentHour,
			})

			const hashedTech2 = bcrypt.hashSync("password123", 8)
			const [createdTech2] = await db
				.insert(schema.users)
				.values({
					name: "Tech User 2",
					email: `tech2.${Date.now()}@test.com`,
					passwordHash: hashedTech2,
					phone: "1234567890",
					address: "123 Main St",
					role: "tech",
				})
				.returning()
			realTechId2 = createdTech2.id

			await db.insert(schema.techniciansAvailabilities).values({
				userId: realTechId2,
				time: currentHour,
			})

			const hashedClient = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Client User",
					email: `client.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()
			realClientId = createdClient.id

			const hashedClient2 = bcrypt.hashSync("password123", 8)
			const [createdClient2] = await db
				.insert(schema.users)
				.values({
					name: "Client User 2",
					email: `client2.${Date.now()}@test.com`,
					passwordHash: hashedClient2,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()
			realClientId2 = createdClient2.id

			const [createdService1] = await db
				.insert(schema.services)
				.values({
					title: "Service 1",
					price: "100.00",
					active: true,
				})
				.returning()
			realServiceId1 = createdService1.id

			const [createdService2] = await db
				.insert(schema.services)
				.values({
					title: "Service 2",
					price: "200.00",
					active: true,
				})
				.returning()
			realServiceId2 = createdService2.id

			const [createdTicket] = await db
				.insert(schema.tickets)
				.values({
					clientId: realClientId,
					techId: realTechId1,
				})
				.returning()
			realTicketId = createdTicket.id

			await db.insert(schema.ticketServices).values([
				{
					ticketId: realTicketId,
					serviceId: realServiceId1,
				},
			])

			mockAdminToken = createMockToken(realAdminId, "admin")
			mockTechToken = createMockToken(realTechId1, "tech")
			mockTech2Token = createMockToken(realTechId2, "tech")
			mockClientToken = createMockToken(realClientId, "client")
			mockClient2Token = createMockToken(realClientId2, "client")
		} catch (error) {
			console.error("Failed to create test fixtures:", error)
			throw error
		}
	})

	afterAll(async () => {
		try {
			await db.delete(schema.ticketServices)
			await db.delete(schema.tickets)
			await db.delete(schema.techniciansAvailabilities)
			await db.delete(schema.services)
			await db.delete(schema.users)
		} catch (_error) {
			// Ignore cleanup errors
		}
	})

	beforeEach(() => {
		// Reset app for each test
		app = express()
		app.use(cors())
		app.use(express.json())
		app.use(express.urlencoded({ extended: true }))
		app.use("/tickets", ticketRoutes)
	})

	// ============================================================
	// POST / - CREATE TICKET
	// ============================================================
	describe("POST /tickets - Create Ticket", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app)
				.post("/tickets")
				.send({
					techId: realTechId1,
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(401)
		})

		it("should return 403 when tech tries to create a ticket", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					techId: realTechId1,
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(403)
		})

		it("should return 403 when admin tries to create a ticket", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					techId: realTechId1,
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(403)
		})

		it("should validate that at least one service is provided", async () => {
			const response = await request(app).post("/tickets").set("Authorization", `Bearer ${mockClientToken}`).send({
				techId: realTechId1,
				servicesIds: [],
			})

			expect(response.status).toBe(400)
		})

		it("should validate that techId is a valid UUID", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: "not-a-uuid",
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(400)
		})

		it("should validate that techId exists", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: nonExistentUUID,
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(400)
		})

		it("should validate that servicesIds contains valid UUIDs", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: realTechId1,
					servicesIds: ["not-a-uuid"],
				})

			expect(response.status).toBe(400)
		})

		it("should return 400 when some services do not exist", async () => {
			const nonExistentServiceId = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: realTechId1,
					servicesIds: [realServiceId1, nonExistentServiceId],
				})

			expect(response.status).toBe(400)
			expect(response.body.error).toContain("serviço informado não existe")
		})

		it("should allow authenticated client to create a ticket", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: realTechId1,
					servicesIds: [realServiceId1],
				})

			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty("id")
			expect(response.body).toHaveProperty("clientId")
			expect(response.body).toHaveProperty("techId", realTechId1)
			expect(response.body).toHaveProperty("createdAt")
			expect(response.body).toHaveProperty("services")
			expect(Array.isArray(response.body.services)).toBeTruthy()
			expect(response.body).toHaveProperty("totalPrice", "100.0")
		})
	})

	// ============================================================
	// GET /tickets/clientHistory - LIST CLIENT TICKETS
	// ============================================================
	describe("GET /tickets/clientHistory - List Client Tickets", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).get("/tickets/clientHistory")

			expect(response.status).toBe(401)
		})

		it("should return 403 when tech user tries to view client history", async () => {
			const response = await request(app).get("/tickets/clientHistory").set("Authorization", `Bearer ${mockTechToken}`)

			expect(response.status).toBe(403)
		})

		it("should return 403 when admin user tries to view client history", async () => {
			const response = await request(app).get("/tickets/clientHistory").set("Authorization", `Bearer ${mockAdminToken}`)

			expect(response.status).toBe(403)
		})

		it("should allow authenticated client to access their history", async () => {
			const response = await request(app)
				.get("/tickets/clientHistory")
				.set("Authorization", `Bearer ${mockClientToken}`)

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBe(true)
		})
	})

	// ============================================================
	// GET /tickets/tech - LIST TECH TICKETS
	// ============================================================
	describe("GET /tickets/tech - List Tech Tickets", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).get("/tickets/tech")

			expect(response.status).toBe(401)
		})

		it("should return 403 when client tries to list tech tickets", async () => {
			const response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockClientToken}`)

			expect(response.status).toBe(403)
			expect(response.body.message).toContain("técnico")
		})

		it("should return 403 when admin tries to list tech tickets", async () => {
			const response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockAdminToken}`)

			expect(response.status).toBe(403)
		})

		it("should allow authenticated technician to list their tickets", async () => {
			const response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockTechToken}`)

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBeTruthy()
		})
	})

	// ============================================================
	// GET /tickets/list - LIST ALL TICKETS
	// ============================================================
	describe("GET /tickets/list - List All Tickets", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).get("/tickets/list")

			expect(response.status).toBe(401)
		})

		it("should return 403 when Client user tries to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockClientToken}`)

			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 403 when Technician tries to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockTechToken}`)

			expect(response.status).toBe(403)
		})

		it("should allow authenticated admin to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockAdminToken}`)

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBeTruthy()
		})
	})

	// ============================================================
	// PUT /tickets/addServices/:ticketId - ADD SERVICES TO TICKET
	// ============================================================
	describe("PUT /tickets/addServices/:ticketId - Add Services to Ticket", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(401)
		})

		it("should return 403 when client tries to add services to a ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(403)
		})

		it("should allow technician to add services to a ticket", async () => {
			// CREATE own ticket
			const hashedClient = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Add Services Test Client",
					email: `addservicesclient.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()

			const [createdTicket] = await db
				.insert(schema.tickets)
				.values({
					clientId: createdClient.id,
					techId: realTechId1,
					status: "aberto",
				})
				.returning()

			// TEST
			const response = await request(app)
				.put(`/tickets/addServices/${createdTicket.id}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBeTruthy()
		})

		it("should allow admin to add services to a ticket", async () => {
			// CREATE own ticket
			const hashedClient = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Add Services Admin Test Client",
					email: `addservicesadmin.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()

			const [createdTicket] = await db
				.insert(schema.tickets)
				.values({
					clientId: createdClient.id,
					techId: realTechId1,
					status: "aberto",
				})
				.returning()

			// TEST
			const response = await request(app)
				.put(`/tickets/addServices/${createdTicket.id}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBeTruthy()
		})

		it("should validate ticketId is a valid UUID", async () => {
			const response = await request(app)
				.put("/tickets/addServices/not-a-uuid")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(400)
		})

		it("should validate ticket exists", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${nonExistentUUID}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(400)
		})

		it("should validate servicesIds is not empty", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [],
				})

			expect(response.status).toBe(400)
		})

		it("should validate servicesIds contains valid UUIDs", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: ["not-a-uuid"],
				})

			expect(response.status).toBe(400)
		})

		it("should validate servicesIds exists", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [nonExistentUUID],
				})

			expect(response.status).toBe(400)
		})

		it("should allow tech to add multiple service IDs", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [realServiceId1, realServiceId2],
				})

			expect(response.status).toBe(200)
			expect(Array.isArray(response.body)).toBeTruthy()
		})

		it("should return 400 when tech tries to add services to another tech's ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTech2Token}`)
				.send({
					servicesIds: [realServiceId2],
				})

			expect(response.status).toBe(400)
			expect(response.body.error).toContain("Acesso negado")
		})

		it("should return 400 when some services do not exist when adding", async () => {
			const nonExistentServiceId = "00000000-0000-0000-0000-000000000000"
			const response = await request(app)
				.put(`/tickets/addServices/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [realServiceId2, nonExistentServiceId],
				})

			expect(response.status).toBe(400)
			expect(response.body.error).toContain("serviço informado não existe")
		})
	})

	// ============================================================
	// PUT /tickets/status/:ticketId - UPDATE TICKET STATUS
	// ============================================================
	describe("PUT /tickets/status/:ticketId - Update Ticket Status", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).put(`/tickets/status/${realTicketId}`).send({
				status: "em_atendimento",
			})

			expect(response.status).toBe(401)
		})

		it("should return 403 when client tries to update ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					status: "em_atendimento",
				})

			expect(response.status).toBe(403)
		})

		it("should allow technician to update ticket status", async () => {
			// CREATE own ticket
			const hashedClient = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Status Update Test Client",
					email: `statusupdateclient.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()

			const [createdTicket] = await db
				.insert(schema.tickets)
				.values({
					clientId: createdClient.id,
					techId: realTechId1,
					status: "aberto",
				})
				.returning()

			// TEST
			const response = await request(app)
				.put(`/tickets/status/${createdTicket.id}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})
			const [result] = response.body

			expect(response.status).toBe(200)
			expect(result).toHaveProperty("id")
			expect(result).toHaveProperty("clientId", createdClient.id)
			expect(result).toHaveProperty("techId", realTechId1)
			expect(result).toHaveProperty("status", "em_atendimento")
		})

		it("should allow admin to update ticket status", async () => {
			// CREATE own ticket
			const hashedClient = bcrypt.hashSync("password123", 8)
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Status Update Admin Test Client",
					email: `statusupdateadmin.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Main St",
					role: "client",
				})
				.returning()

			const [createdTicket] = await db
				.insert(schema.tickets)
				.values({
					clientId: createdClient.id,
					techId: realTechId1,
					status: "aberto",
				})
				.returning()

			// TEST
			const response = await request(app)
				.put(`/tickets/status/${createdTicket.id}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					status: "encerrado",
				})

			const [result] = response.body

			expect(response.status).toBe(200)
			expect(result).toHaveProperty("id")
			expect(result).toHaveProperty("clientId", createdClient.id)
			expect(result).toHaveProperty("techId", realTechId1)
			expect(result).toHaveProperty("status", "encerrado")
		})

		it("should only accept valid status values", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "invalid_status",
				})

			expect(response.status).toBe(400)
		})

		it("should accept 'aberto' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "aberto",
				})

			expect(response.status).toBe(200)
		})

		it("should accept 'em_atendimento' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})

			expect(response.status).toBe(200)
		})

		it("should accept 'encerrado' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "encerrado",
				})

			expect(response.status).toBe(200)
		})

		it("should validate ticketId is a valid UUID", async () => {
			const response = await request(app)
				.put("/tickets/status/not-a-uuid")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})

			expect(response.status).toBe(400)
		})

		it("should validate ticketId exists", async () => {
			const response = await request(app)
				.put(`/tickets/status/${nonExistentUUID}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})

			expect(response.status).toBe(400)
		})

		it("should return 400 when tech tries to update status of another tech's ticket", async () => {
			const response = await request(app)
				.put(`/tickets/status/${realTicketId}`)
				.set("Authorization", `Bearer ${mockTech2Token}`)
				.send({
					status: "em_atendimento",
				})

			expect(response.status).toBe(400)
			expect(response.body.error).toContain("Acesso negado")
		})
	})
})
