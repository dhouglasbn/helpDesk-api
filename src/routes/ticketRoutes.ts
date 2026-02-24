import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { validateZodSchema } from "../middlewares/validateDataMiddleware.ts";
import { z } from "zod";
import TicketController from "../controllers/ticketController.ts";

const router = Router();
const ticketController = new TicketController();

router.post(
	"/",
	validateZodSchema(
		z.object({
			techId: z.uuid("Informe um identificador válido para o técnico"),
			servicesIds: z.uuid().array().min(1, "Informe pelo menos 1 serviço"),
		}),
	),
	authMiddleware,
	ticketController.createTicket,
);
router.get(
	"/clientHistory",
	authMiddleware,
	ticketController.showClientHistory,
);
router.get("/tech", authMiddleware, ticketController.listTechTickets);
router.get("/list", authMiddleware, ticketController.listAllTickets);
router.put(
	"/addServices/:ticketId",
	validateZodSchema(
		z.object({
			servicesIds: z.uuid().array().min(1, "Informe pelo menos 1 serviço"),
		}),
		z.object({
			ticketId: z.uuid(),
		}),
	),
	authMiddleware,
	ticketController.addServicesToATicket,
);
router.put(
	"/status/:ticketId",
	validateZodSchema(
		z.object({
			status: z.enum(["aberto", "em_atendimento", "encerrado"]),
		}),
		z.object({
			ticketId: z.uuid(),
		}),
	),
	authMiddleware,
	ticketController.updateTicketStatus,
);

export { router as ticketRoutes };
