import type { Request, Response } from "express"
import AuthService from "../services/authService.ts";

export default class UserController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (request: Request, reply: Response) => {
    const { email, password } = request.body;

    try {
      const token = await this.authService.authenticate(email, password);
      return reply.json({ token });
    } catch (error) {
      return reply.status(401).json({ error: (error as Error).message });       
    }
  };
}