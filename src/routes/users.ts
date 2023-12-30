import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'

export async function usersRoutes(app: FastifyInstance) {
  // Criar um usuário
  app.post('/', async (request, reply) => {
    const registerBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    const { name, email } = registerBodySchema.parse(request.body)

    const userWithEmail = await knex('users').where({ email }).first()

    if (userWithEmail) {
      return reply.status(409).send({ error: 'User already exists.' })
    }

    const sessionId = randomUUID()

    await knex('users').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      email,
    })

    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    return reply.status(201).send()
  })
}
