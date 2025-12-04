import { Router } from 'express'
import UserController from '../controllers/userController.ts';

const router = Router();
const userController = new UserController();

router.post("/login", userController.login);

export { router as userRoutes };