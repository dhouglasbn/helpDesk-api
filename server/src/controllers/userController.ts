import type { Request, Response } from "express"
import type { OurRequest } from "../types/ourRequest.ts";
import AuthService from "../services/authService.ts";
import UserService from "../services/userService.ts";

export default class UserController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  login = async (request: Request, reply: Response) => {
    const { email, password } = request.body;

    try {
      const token = await this.authService.authenticate(email, password);
      return reply.json({ token });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message });       
    }
  };

  createTechAccount = async (request: OurRequest, reply: Response) => {
    if (!request.user?.role || request.user.role !== 'admin') {
      return reply.status(403).json({ message: 'Acesso negado: Somente o admin pode criar contas de técnicos.' });
    }

    const { name, email, password } = request.body;
    
    try {
      const newTech = await this.userService.createTechAccount(name, email, password);
      return reply.status(201).json({ newTech });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message });       
    }
  }

  listTechAccounts = async (request: OurRequest, reply: Response) => {
    if (!request.user?.role || request.user.role !== 'admin') {
      return reply.status(403).json({ message: 'Acesso negado: Somente o admin pode listar contas de técnicos.' });
    }

    try {
      const techList = await this.userService.listTechAccounts();
      return reply.status(200).json({ techList });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message });       
    }
  }

  updateUserPicture = async (request: OurRequest, reply: Response) => {
    if (request.user?.id && request.user.id !== request.params.id && request.user.role !== 'admin') {
      return reply.status(403).json({ message: 'Acesso negado: Você só pode atualizar sua própria conta.' });
    }
    try {
      if (request.file) {
        const profilePicBase64 = request.file.buffer.toString("base64");
        const accessURL = await this.userService.updateUserPicture(request.params.id, profilePicBase64);
        return reply.status(200).json({ accessURL });
      } else {
        return reply.status(400).json({ message: 'Nenhum arquivo enviado.' });
      }
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message }); 
    }
  }

  getUserPicture = async (request: OurRequest, reply: Response) => {
    try {
        const userPicture = await this.userService.getUserPicture(request.params.id);
        return reply.status(200).json({ userPicture });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message }); 
    }
  }

  updateTechAccount = async (request: OurRequest, reply: Response) => {
    const isUserAuthorized = request.user?.role && (
      request.user.role === 'tech' || request.user.role === 'admin'
    );
    if (!isUserAuthorized) {
      return reply.status(403).json({ message: 'Acesso negado: Somente técnicos e admins podem atualizar contas de técnicos.' });
    }
    if (request.user?.id && request.user.id !== request.params.id && request.user.role !== 'admin') {
      return reply.status(403).json({ message: 'Acesso negado: Você só pode atualizar sua própria conta.' });
    }
    try {
      const updatingUserId = request.params.id;
      const { newName, newEmail, newPassword } = request.body;
      const newTech = await this.userService.updateUserAccount(updatingUserId, {newName, newEmail, newPassword});
      return reply.status(200).json({ newTech });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message });       
    }
  }

  updateAdminAccount = async (request: OurRequest, reply: Response) => {}

  updateClientAccount = async (request: OurRequest, reply: Response) => {}

  updateTechAvailabilities = async (request: OurRequest, reply: Response) => {
    const isUserAuthorized = request.user?.role && (
      request.user.role === 'tech' || request.user.role === 'admin'
    );
    if (!isUserAuthorized) {
      return reply.status(403).json({ message: 'Acesso negado: Somente técnicos e admins podem atualizar contas de técnicos.' });
    }
    if (request.user?.id && request.user.id !== request.params.id && request.user.role !== 'admin') {
      return reply.status(403).json({ message: 'Acesso negado: Você só pode atualizar sua própria conta.' });
    }
    try {
      const updatingTechId = request.params.id;
      const { newAvailabilities } = request.body;
      const newTech = await this.userService.updateTechAvailabilities(updatingTechId, newAvailabilities);
      return reply.status(200).json({ newTech });
    } catch (error) {
      return reply.status(400).json({ error: (error as Error).message });       
    }
  }
}