1// biome-ignore assist/source/organizeImports: <sorted>
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import cors from "cors";
import { serviceRoutes } from "../src/routes/serviceRoutes.ts";
import { db } from "../src/db/connection.ts";
import { services } from "../src/db/schema/services.ts";
import bcrypt from "bcrypt";
import { schema } from "../src/db/schema/index.ts";
import { users } from "../src/db/schema/users.ts";
import e from "express";

describe("Service Routes", () => {
	let app: Express;
	let existingServiceId = "";

	// Create mock JWT tokens for different roles
	const createMockToken = (userId: string, role: "admin" | "tech" | "client") =>
		jwt.sign({ id: userId, role }, process.env.JWT_SECRET || "test-secret", {
			expiresIn: "1h",
		});

	let mockAdminToken = "";
	let mockTechToken = "";
	let mockClientToken = "";

	// Mock UUIDs
	const invalidUUID = "not-a-uuid";
	const nonExistentUUID = "550e8400-e29b-41d4-a716-446655440000";

	beforeAll(async () => {
		// Create shared service fixture once for all tests
		try {
			const hashedClient = bcrypt.hashSync("password123", 8);
			const [createdClient] = await db
				.insert(schema.users)
				.values({
					name: "Client User",
					email: `client.${Date.now()}@test.com`,
					passwordHash: hashedClient,
					phone: "1234567890",
					address: "123 Test St",
					role: "client",
				})
				.returning();

			const hashedAdmin = bcrypt.hashSync("password123", 8);
			const [createdAdmin] = await db
				.insert(schema.users)
				.values({
					name: "Admin User",
					email: `admin.${Date.now()}@test.com`,
					passwordHash: hashedAdmin,
					phone: "1234567890",
					address: "123 Test St",
					role: "admin",
				})
				.returning();
							
			const hashedTech = bcrypt.hashSync("password123", 8);
			const [createdTech1] = await db
				.insert(schema.users)
				.values({
					name: "Tech User 1",
					email: `tech1.${Date.now()}@test.com`,
					passwordHash: hashedTech,
					phone: "1234567890",
					address: "123 Test St",
					role: "tech",
				})
				.returning();

			const [createdService] = await db
				.insert(services)
				.values({
					title: "Test Service",
					price: "99.99",
					active: true,
				})
				.returning();
			existingServiceId = createdService.id;

			mockAdminToken = createMockToken(createdAdmin.id, "admin");
			mockTechToken = createMockToken(createdTech1.id, "tech");
			mockClientToken = createMockToken(createdClient.id, "client");
		} catch (error) {
			console.error("Failed to create test fixtures:", error);
			throw error;
		}
	});

	afterAll(async () => {
		try {
			await db.delete(users);
			await db.delete(services);
		} catch (_error) {
			// Ignore cleanup errors
		}
	});

	beforeEach(() => {
		// Reset app for each test
		app = express();
		app.use(cors());
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));
		app.use("/services", serviceRoutes);
	});

	// ============================================================
	// POST / - CREATE SERVICE
	// ============================================================
	describe("POST /services - Create Service", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).post("/services").send({
				title: "Software Installation",
				price: 100.0,
			});

			expect(response.status).toBe(401);
		});

		it("should return 403 when Tech tries to create a service", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					title: "Software Installation",
					price: 100.0,
				});

			expect(response.status).toBe(403);
		});

		it("should return 403 when client tries to create a service", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					title: "Software Installation",
					price: 100.0,
				});

			expect(response.status).toBe(403);
		});

		it("should validate title is at least 3 characters", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "ab",
					price: 100.0,
				});

			expect(response.status).toBe(400);
		});

		it("should accept exactly 3 characters in title", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "VPN",
					price: 50.0,
				});

			expect(response.status).toBe(201);
		});

		it("should validate price is a non-negative number", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Software Installation",
					price: -50,
				});

			expect(response.status).toBe(400);
		});

		it("should validate that title is required", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					price: 100.0,
				});

			expect(response.status).toBe(400);
		});

		it("should validate that price is required", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Software Installation",
				});

			expect(response.status).toBe(400);
		});

		it("should allow admin to create a service with valid data", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Software Installation",
					price: 100.0,
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("id");
			expect(response.body.title).toBe("Software Installation");
			expect(response.body.price).toBe("100");
			expect(response.body.active).toBeTruthy();
		});

		it("should accept price as zero", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Free Software Update",
					price: 0,
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("id");
			expect(response.body.title).toBe("Free Software Update");
			expect(response.body.price).toBe("0");
			expect(response.body.active).toBeTruthy();
		});

		it("should accept decimal prices", async () => {
			const response = await request(app)
				.post("/services")
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Hardware Diagnostic",
					price: 75.5,
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("id");
			expect(response.body.title).toBe("Hardware Diagnostic");
			expect(response.body.price).toBe("75.5");
			expect(response.body.active).toBeTruthy();
		});
	});

	// ============================================================
	// GET /list - LIST SERVICES
	// ============================================================
	describe("GET /services/list - List Services", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).get("/services/list");

			expect(response.status).toBe(401);
		});

		it("should allow authenticated admin to list services", async () => {
			const response = await request(app)
				.get("/services/list")
				.set("Authorization", `Bearer ${mockAdminToken}`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		});

		it("should allow authenticated tech to list services", async () => {
			const response = await request(app)
				.get("/services/list")
				.set("Authorization", `Bearer ${mockTechToken}`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		});

		it("should allow authenticated client to list services", async () => {
			const response = await request(app)
				.get("/services/list")
				.set("Authorization", `Bearer ${mockClientToken}`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		});

		it("should not list deactivated services in new ticket creation (handled at service level)", async () => {
			const [createdService] = await db
				.insert(services)
				.values({
					title: `Service to Deactivate ${Date.now()}`,
					price: "75.0",
					active: false,
				})
				.returning();
			const response = await request(app)
				.get("/services/list")
				.set("Authorization", `Bearer ${mockAdminToken}`);

			expect(response.status).toBe(200);
			const serviceIds = response.body.map((service: any) => service.id);
			expect(serviceIds).not.toContain(createdService.id);
		});
	});

	// ============================================================
	// PUT /:id - UPDATE SERVICE
	// ============================================================
	describe("PUT /services/:id - Update Service", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).put(`/services/${existingServiceId}`).send({
				title: "Updated Software Installation",
				price: 150.0,
			});

			expect(response.status).toBe(401);
		});

		it("should return 403 when Tech tries to update a service", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockTechToken}`)
				.send({
					title: "Updated Software Installation",
					price: 150.0,
				});

			expect(response.status).toBe(403);
		});

		it("should return 403 when Client tries to update a service", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockClientToken}`)
				.send({
					title: "Updated Software Installation",
					price: 150.0,
				});

			expect(response.status).toBe(403);
		});

		it("should validate title is at least 3 characters", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "ab",
					price: 150.0,
				});

			expect(response.status).toBe(400);
		});

		it("should validate price is a non-negative number", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Updated Software Installation",
					price: -50,
				});

			expect(response.status).toBe(400);
		});

		it("should validate serviceId is a valid UUID", async () => {
			const response = await request(app)
				.put(`/services/${invalidUUID}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Updated Software Installation",
					price: 150.0,
				});

			expect(response.status).toBe(400);
		});

		it("should validate that title is required", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					price: 150.0,
				});

			expect(response.status).toBe(400);
		});

		it("should validate that price is required", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Updated Software Installation",
				});

			expect(response.status).toBe(400);
		});

		it("should update an existing service in the database", async () => {
			// CREATE own service
			const [createdService] = await db
				.insert(services)
				.values({
					title: `Service to Update ${Date.now()}`,
					price: "99.99",
					active: true,
				})
				.returning();

			const updatedTitle = `Updated Service ${Date.now()}`;
			const updatedPrice = 199.99;

			// TEST
			const response = await request(app)
				.put(`/services/${createdService.id}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: updatedTitle,
					price: updatedPrice,
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("id");
			expect(response.body.title).toBe(updatedTitle);
			expect(response.body.price).toBe(updatedPrice.toString());
			expect(response.body.active).toBeTruthy();
		});

		it("should accept decimal prices on update", async () => {
			const response = await request(app)
				.put(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Updated Hardware Diagnostic",
					price: 85.75,
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("id");
			expect(response.body.title).toBe("Updated Hardware Diagnostic");
			expect(response.body.price).toBe("85.75");
			expect(response.body.active).toBeTruthy();
		});

		it("should return error when updating a non-existent service", async () => {
			const response = await request(app)
				.put(`/services/${nonExistentUUID}`)
				.set("Authorization", `Bearer ${mockAdminToken}`)
				.send({
					title: "Trying to Update Non-Existent Service",
					price: 150.0,
				});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Este serviço não existe.");
		});
	});

	// ============================================================
	// DELETE /:id - DEACTIVATE SERVICE (Soft Delete)
	// ============================================================
	describe("DELETE /services/:id - Deactivate Service", () => {
		it("should return 401 when no authentication token is provided", async () => {
			const response = await request(app).delete(`/services/${existingServiceId}`);

			expect(response.status).toBe(401);
		});

		it("should return 403 when Tech tries to deactivate a service", async () => {
			const response = await request(app)
				.delete(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockTechToken}`);

			expect(response.status).toBe(403);
		});

		it("should return 403 when client tries to deactivate a service", async () => {
			const response = await request(app)
				.delete(`/services/${existingServiceId}`)
				.set("Authorization", `Bearer ${mockClientToken}`);

			expect(response.status).toBe(403);
		});

		it("should validate serviceId is a valid UUID", async () => {
			const response = await request(app)
				.delete(`/services/${invalidUUID}`)
				.set("Authorization", `Bearer ${mockAdminToken}`);

			expect(response.status).toBe(400);
		});

		it("should allow admin to deactivate a service", async () => {
			// CREATE own service
			const [createdService] = await db
				.insert(services)
				.values({
					title: `Service to Deactivate ${Date.now()}`,
					price: "75.0",
					active: true,
				})
				.returning();

			// TEST
			const response = await request(app)
				.delete(`/services/${createdService.id}`)
				.set("Authorization", `Bearer ${mockAdminToken}`);

			expect(response.status).toBe(204);
		});

		it("should return error when deactivating a non-existent service", async () => {
			const response = await request(app)
				.delete(`/services/${nonExistentUUID}`)
				.set("Authorization", `Bearer ${mockAdminToken}`);

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Este serviço não existe.");
		});
	});
});
