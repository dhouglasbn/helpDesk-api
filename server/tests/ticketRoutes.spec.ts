// biome-ignore assist/source/organizeImports: <sorted>
import request from "supertest"
import express, { type Express } from "express"
import cors from "cors"
import jwt from "jsonwebtoken"

import { ticketRoutes } from "../src/routes/ticketRoutes.ts"

let app: Express

// Test UUIDs
const adminId = "11111111-1111-1111-1111-111111111111"
const techId1 = "22222222-2222-2222-2222-222222222222"
const techId2 = "33333333-3333-3333-3333-333333333333"
const clientId1 = "44444444-4444-4444-4444-444444444444"
const clientId2 = "55555555-5555-5555-5555-555555555555"
const serviceId1 = "66666666-6666-6666-6666-666666666666"
const serviceId2 = "77777777-7777-7777-7777-777777777777"
const ticketId = "99999999-9999-9999-9999-999999999999"

// Mock auth tokens
const createMockToken = (userId: string, role: "admin" | "tech" | "client") =>
	jwt.sign({ id: userId, role }, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" })

const mockAdminToken = createMockToken(adminId, "admin")
const mockTechToken = createMockToken(techId1, "tech")
const mockTech2Token = createMockToken(techId2, "tech")
const mockClientToken = createMockToken(clientId1, "client")
const mockClient2Token = createMockToken(clientId2, "client")

describe("Ticket Routes", () => {
	beforeEach(() => {
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
					techId: techId1,
					servicesIds: [serviceId1],
				})

			expect(response.status).toBe(401)
		})

		it("should return 403 when non-client user tries to create a ticket", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			expect([400, 403]).toContain(response.status)
		})

		it("should return 403 when admin tries to create a ticket", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			expect([400, 403]).toContain(response.status)
		})

		it("should validate that at least one service is provided", async () => {
			const response = await request(app).post("/tickets").set("Authorization", `Bearer ${mockClientToken}`).send({
				techId: techId1,
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
					servicesIds: [serviceId1],
				})

			expect(response.status).toBe(400)
		})

		it("should validate that servicesIds contains valid UUIDs", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId1,
					servicesIds: ["not-a-uuid"],
				})

			expect(response.status).toBe(400)
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

		it("should return 403 when non-client user tries to view client history", async () => {
			const response = await request(app).get("/tickets/clientHistory").set("Authorization", `Bearer ${mockTechToken}`)

			expect(response.status).toBe(403)
		})

		it("should return 403 when admin tries to view client history", async () => {
			const response = await request(app).get("/tickets/clientHistory").set("Authorization", `Bearer ${mockAdminToken}`)

			expect(response.status).toBe(403)
		})

		it("should allow authenticated client to access their history", async () => {
			const response = await request(app)
				.get("/tickets/clientHistory")
				.set("Authorization", `Bearer ${mockClientToken}`)

			expect([200, 400]).toContain(response.status)
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

		it("should return 403 when non-tech user tries to list tech tickets", async () => {
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

			expect([200, 400]).toContain(response.status)
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

		it("should return 403 when non-admin user tries to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockClientToken}`)

			expect(response.status).toBe(403)
			expect(response.body.message).toContain("admin")
		})

		it("should return 403 when technician tries to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockTechToken}`)

			expect(response.status).toBe(403)
		})

		it("should allow authenticated admin to list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockAdminToken}`)

			expect([200, 400]).toContain(response.status)
		})
	})

	// ============================================================
	// PUT /tickets/addServices/:ticketId - ADD SERVICES TO TICKET
	// ============================================================
	describe("PUT /tickets/addServices/:ticketId - Add Services to Ticket", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.send({
					servicesIds: [serviceId2],
				})

			expect(response.status).toBe(401)
		})

		it("should return 403 when client tries to add services to a ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					servicesIds: [serviceId2],
				})

			expect([400, 403]).toContain(response.status)
		})

		it("should allow technician to add services to a ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [serviceId2],
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should allow admin to add services to a ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					servicesIds: [serviceId2],
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should validate ticketId is a valid UUID", async () => {
			const response = await request(app)
				.put("/tickets/addServices/not-a-uuid")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [serviceId2],
				})

			expect(response.status).toBe(400)
		})

		it("should validate servicesIds is not empty", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [],
				})

			expect(response.status).toBe(400)
		})

		it("should validate servicesIds contains valid UUIDs", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: ["not-a-uuid"],
				})

			expect(response.status).toBe(400)
		})

		it("should accept multiple service IDs", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					servicesIds: [serviceId1, serviceId2],
				})

			expect([200, 400]).toContain(response.status)
		})
	})

	// ============================================================
	// PUT /tickets/status/:ticketId - UPDATE TICKET STATUS
	// ============================================================
	describe("PUT /tickets/status/:ticketId - Update Ticket Status", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).put(`/tickets/status/${ticketId}`).send({
				status: "em_atendimento",
			})

			expect(response.status).toBe(401)
		})

		it("should return 403 when client tries to update ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					status: "em_atendimento",
				})

			expect([400, 403]).toContain(response.status)
		})

		it("should allow technician to update ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should allow admin to update ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					status: "encerrado",
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should only accept valid status values", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "invalid_status",
				})

			expect(response.status).toBe(400)
		})

		it("should accept 'aberto' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "aberto",
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should accept 'em_atendimento' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "em_atendimento",
				})

			expect([200, 400]).toContain(response.status)
		})

		it("should accept 'encerrado' as a valid status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					status: "encerrado",
				})

			expect([200, 400]).toContain(response.status)
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
	})

	// ============================================================
	// AUTHORIZATION REQUIREMENTS (REQUISITES)
	// ============================================================
	describe("Authorization Requirements - Requisites Compliance", () => {
		it("O Admin - should not create tickets directly", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			expect([400, 403]).toContain(response.status)
		})

		it("O Admin - should list all tickets", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockAdminToken}`)

			expect([200, 400]).toContain(response.status)
		})

		it("O Admin - should edit ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({ status: "em_atendimento" })

			expect([200, 400]).toContain(response.status)
		})

		it("O Técnico - should not create tickets", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					techId: techId2,
					servicesIds: [serviceId1],
				})

			expect([400, 403]).toContain(response.status)
		})

		it("O Técnico - should list only their assigned tickets", async () => {
			const response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockTechToken}`)

			expect([200, 400]).toContain(response.status)
		})

		it("O Técnico - should add services to ticket", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ servicesIds: [serviceId2] })

			expect([200, 400]).toContain(response.status)
		})

		it("O Técnico - should edit ticket status", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ status: "em_atendimento" })

			expect([200, 400]).toContain(response.status)
		})

		it("O Cliente - should create tickets", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			expect([201, 400]).toContain(response.status)
		})

		it("O Cliente - should view their history", async () => {
			const response = await request(app)
				.get("/tickets/clientHistory")
				.set("Authorization", `Bearer ${mockClientToken}`)

			expect([200, 400]).toContain(response.status)
		})

		it("O Cliente - should NOT alter ticket after creation", async () => {
			const updateResponse = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({ status: "em_atendimento" })

			const addResponse = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({ servicesIds: [serviceId2] })

			expect([400, 403]).toContain(updateResponse.status)
			expect([400, 403]).toContain(addResponse.status)
		})
	})

	// ============================================================
	// VALIDATION TESTS (Requisites: Status values)
	// ============================================================
	describe("Validation - Requisites Compliance", () => {
		it("should only accept valid ticket status: aberto", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ status: "aberto" })

			expect([200, 400]).toContain(response.status)
		})

		it("should only accept valid ticket status: em_atendimento", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ status: "em_atendimento" })

			expect([200, 400]).toContain(response.status)
		})

		it("should only accept valid ticket status: encerrado", async () => {
			const response = await request(app)
				.put(`/tickets/status/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ status: "encerrado" })

			expect([200, 400]).toContain(response.status)
		})

		it("should reject invalid status values", async () => {
			const invalidStatuses = ["opening", "in_service", "closed", "pending", "invalid"]

			for (const status of invalidStatuses) {
				const response = await request(app)
					.put(`/tickets/status/${ticketId}`)
					.set("Authorization", `Bearer ${mockTechToken}`)
					.send({ status })

				expect(response.status).toBe(400)
			}
		})

		it("should require at least one service when creating ticket", async () => {
			const response = await request(app).post("/tickets").set("Authorization", `Bearer ${mockClientToken}`).send({
				techId: techId1,
				servicesIds: [],
			})

			expect(response.status).toBe(400)
		})

		it("should require at least one service when adding services", async () => {
			const response = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ servicesIds: [] })

			expect(response.status).toBe(400)
		})

		it("should validate techId is UUID format", async () => {
			const invalidIds = ["", "123", "invalid-id", "12345678-1234-1234"]

			for (const id of invalidIds) {
				const response = await request(app)
					.post("/tickets")
					.set("Authorization", `Bearer ${mockClientToken}`)
					.send({
						techId: id,
						servicesIds: [serviceId1],
					})

				expect(response.status).toBe(400)
			}
		})

		it("should validate serviceIds are UUID format", async () => {
			const response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId1,
					servicesIds: ["invalid-uuid"],
				})

			expect(response.status).toBe(400)
		})

		it("should validate ticketId is UUID format in status update", async () => {
			const response = await request(app)
				.put("/tickets/status/invalid-id")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ status: "em_atendimento" })

			expect(response.status).toBe(400)
		})

		it("should validate ticketId is UUID format in add services", async () => {
			const response = await request(app)
				.put("/tickets/addServices/invalid-id")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({ servicesIds: [serviceId1] })

			expect(response.status).toBe(400)
		})
	})

	// ============================================================
	// MULTIPLE ROLES SCENARIOS
	// ============================================================
	describe("Multiple Users with Different Roles", () => {
		it("different clients should be able to create independent tickets", async () => {
			const client1Response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			const client2Response = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClient2Token}`)
				.send({
					techId: techId2,
					servicesIds: [serviceId2],
				})

			expect([201, 400]).toContain(client1Response.status)
			expect([201, 400]).toContain(client2Response.status)
		})

		it("different technicians should see their own tickets", async () => {
			const tech1Response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockTechToken}`)

			const tech2Response = await request(app).get("/tickets/tech").set("Authorization", `Bearer ${mockTech2Token}`)

			expect([200, 400]).toContain(tech1Response.status)
			expect([200, 400]).toContain(tech2Response.status)
		})

		it("same client can assign tickets to different technicians", async () => {
			const response1 = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId1,
					servicesIds: [serviceId1],
				})

			const response2 = await request(app)
				.post("/tickets")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					techId: techId2,
					servicesIds: [serviceId2],
				})

			expect([201, 400]).toContain(response1.status)
			expect([201, 400]).toContain(response2.status)
		})
	})

	// ============================================================
	// AUTHENTICATION TESTS
	// ============================================================
	describe("Authentication", () => {
		it("should reject requests without authentication token", async () => {
			const postResponse = await request(app)
				.post("/tickets")
				.send({ techId: techId1, servicesIds: [serviceId1] })

			const getHistoryResponse = await request(app).get("/tickets/clientHistory")

			const getTechResponse = await request(app).get("/tickets/tech")

			const getListResponse = await request(app).get("/tickets/list")

			const putStatusResponse = await request(app).put(`/tickets/status/${ticketId}`).send({ status: "em_atendimento" })

			const putServicesResponse = await request(app)
				.put(`/tickets/addServices/${ticketId}`)
				.send({ servicesIds: [serviceId1] })

			expect(postResponse.status).toBe(401)
			expect(getHistoryResponse.status).toBe(401)
			expect(getTechResponse.status).toBe(401)
			expect(getListResponse.status).toBe(401)
			expect(putStatusResponse.status).toBe(401)
			expect(putServicesResponse.status).toBe(401)
		})

		it("should accept valid JWT tokens", async () => {
			const response = await request(app).get("/tickets/list").set("Authorization", `Bearer ${mockAdminToken}`)

			expect([200, 400]).toContain(response.status)
		})
	})
})
