import { Router } from "express"
import UserController from "../controllers/userController.ts"
import { authMiddleware } from "../middlewares/authMiddleware.ts"
import { validateZodSchema } from "../middlewares/validateDataMiddleware.ts"
import { z } from "zod"
import multer from "multer"

const router = Router()
const userController = new UserController()
const upload = multer({ storage: multer.memoryStorage() })

// login
router.post("/login", userController.login)

// CRUD tech accounts
router.post(
	"/tech",
	validateZodSchema(
		z.object({
			name: z.string().min(3),
			email: z.email(),
			password: z.string().min(6),
			phone: z.string().length(11),
			address: z.string().min(5),
		}),
	),
	authMiddleware,
	userController.createTechAccount,
)
router.get("/techList", authMiddleware, userController.listTechAccounts)
router.put(
	"/tech/:id",
	validateZodSchema(
		z.object({
			newName: z.string().min(3),
			newEmail: z.email(),
			newPhone: z.string().min(10),
			newAddress: z.string().min(5),
		}),
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateTechAccount,
)
router.put(
	"/techAvailabilities/:id",
	validateZodSchema(
		z.object({
			newAvailabilities: z
				.string()
				.regex(/^([01]\d|2[0-3]):00$/, {
					message: "Horário inválido. Use o formato HH:00 (00–23 / 00).",
				})
				.array()
				.min(1),
		}),
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateTechAvailabilities,
)

router.put(
	"/admin/:id",
	validateZodSchema(
		z.object({
			newName: z.string().min(3),
			newEmail: z.email(),
			newPhone: z.string().min(10),
			newAddress: z.string().min(5),
		}),
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateAdminAccount,
)

// CRUD de clients
router.post(
	"/client",
	validateZodSchema(
		z.object({
			name: z.string().min(3),
			email: z.email(),
			password: z.string().min(6),
			phone: z.string().length(11),
			address: z.string().min(5),
		}),
	),
	userController.createClientAccount,
)
router.get("/me", authMiddleware, userController.getMyAccount)
router.put(
	"/client/:id",
	validateZodSchema(
		z.object({
			newName: z.string().min(3),
			newEmail: z.email(),
			newPhone: z.string().min(10),
			newAddress: z.string().min(5),
		}),
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateClientAccount,
)
router.get("/clientList", authMiddleware, userController.listClientAccounts)
router.delete(
	"/client/:id",
	validateZodSchema(
		undefined,
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.deleteClientAccount,
)

// GET e UPLOAD de dados específicos
router.patch(
	"/password/:id",
	validateZodSchema(
		z.object({
			currentPassword: z.string().min(6),
			newPassword: z.string().min(6),
		}),
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateUserPassword,
)
router.put(
	"/picture/:id",
	upload.single("profilePic"),
	validateZodSchema(
		undefined,
		z.object({
			id: z.uuid(),
		}),
	),
	authMiddleware,
	userController.updateUserPicture,
)
router.get(
	"/picture/:id",
	validateZodSchema(
		undefined,
		z.object({
			id: z.uuid(),
		}),
	),
	userController.getUserPicture,
)

export { router as userRoutes }
