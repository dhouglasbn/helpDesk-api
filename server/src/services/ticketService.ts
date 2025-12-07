// biome-ignore assist/source/organizeImports: <i dont care>
import { db } from "../db/connection.ts"
import { schema } from "../db/schema/index.ts"
import { eq, and, inArray, sql, desc } from "drizzle-orm"

export default class TicketService {

  createTicket = async (clientId: string, techId: string, servicesIds: string[]) => {
    const techExists = await db.query.users.findFirst({ where: and(eq(schema.users.id, techId), eq(schema.users.role, 'tech'))})
    if (!techExists) throw new Error("Esse técnico não existe")
    
    const existingServices = await db
      .select({ 
        id: schema.services.id,
        title: schema.services.title,
        price: schema.services.price
      })
      .from(schema.services)
      .where(inArray(schema.services.id, servicesIds))

    if (existingServices.length !== servicesIds.length) {
      throw new Error("Algum serviço informado não existe")
    }

    const ticket = await db.transaction(async tx => {
      const [newTicket] = await tx
      .insert(schema.tickets)
      .values({
        clientId,
        techId
      })
      .returning()

      await tx.insert(schema.ticketServices)
      .values(
        servicesIds.map(serviceId => ({
          ticketId: newTicket.id,
          serviceId,
        }))
      )

      return newTicket
    })

    return {
      id: ticket.id,
      clientId: ticket.clientId,
      techId: ticket.techId,
      status: ticket.status,
      createdAt: ticket.createdAt,
      services: existingServices,
      totalPrice: `${existingServices.reduce((acc, service) => acc + Number(service.price), 0)}.0`
    }
  }

  showClientHistory = async(clientId: string) =>  await db
    .select({
      id: schema.tickets.id,
      clientId: schema.tickets.clientId,
      techId: schema.tickets.techId,
      status: schema.tickets.status,
      createdAt: schema.tickets.createdAt,
      updatedAt: schema.tickets.updatedAt,
      services: sql`json_agg(json_build_object(
        'id', ${schema.services.id},
        'title', ${schema.services.title},
        'price', ${schema.services.price}::text
      ))`,
      totalPrice: sql`SUM(${schema.services.price}::numeric)`
    })
    .from(schema.tickets)
    .leftJoin(schema.ticketServices, eq(schema.ticketServices.ticketId, schema.tickets.id))
    .leftJoin(schema.services, eq(schema.services.id, schema.ticketServices.serviceId))
    .where(eq(schema.tickets.clientId, clientId))
    .groupBy(schema.tickets.id)
    .orderBy(desc(schema.tickets.createdAt));
}