import type { ServiceData } from "./serviceData.ts"

export type TicketData = {
  id: string,
  clientId: string,
  techId: string,
  status: boolean,
  createdAt: string,
  updatedAt: string,
  services: ServiceData[],
  totalPrice: string
}

export type TicketStatus = "aberto" | "em_atendimento" | "encerrado"