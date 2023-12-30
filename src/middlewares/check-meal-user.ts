import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function checkMealUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    return reply.status(401).send({
      error: 'Unauthorized.',
    })
  }

  const mealParamsSchema = z.object({
    id: z.string().uuid(),
  })

  const user = await knex('users')
    .select('id')
    .where('session_id', sessionId)
    .first()

  if (!user) {
    return reply.status(401).send({
      error: 'Unauthorized.',
    })
  }

  const { id } = mealParamsSchema.parse(request.params)

  const meal = await knex('meals').select('user_id').where({ id }).first()

  if (!meal) {
    return reply.status(404).send({
      error: 'Resource not found.',
    })
  }

  if (meal?.user_id !== user.id) {
    return reply.status(401).send({
      error: 'Unauthorized.',
    })
  }

  request.user = user
}
