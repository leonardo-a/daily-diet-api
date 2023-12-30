import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkSessionIdExists)

  // Registrar Refeição
  app.post('/', async (request, reply) => {
    const registerMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnDiet: z.boolean(),
      date: z.coerce.date(),
    })

    const { name, description, isOnDiet, date } = registerMealBodySchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      user_id: request.user?.id,
      name,
      description,
      is_on_diet: isOnDiet,
      date,
    })

    return reply.status(201).send()
  })

  // Editar Refeição
  app.put('/:id', async (request, reply) => {
    const editMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const editMealBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      isOnDiet: z.boolean().optional(),
      date: z.coerce.date().optional(),
    })

    const { id } = editMealParamsSchema.parse(request.params)

    const { name, description, isOnDiet, date } = editMealBodySchema.parse(
      request.body,
    )

    const meal = await knex('meals').select('*').where({ id }).first()

    if (!meal) {
      return reply.status(404).send({ error: 'Resource not found.' })
    }

    if (meal.user_id !== request.user?.id) {
      return reply.status(401).send({ error: 'Unauthorized.' })
    }

    await knex('meals')
      .update({
        name,
        description,
        is_on_diet: isOnDiet,
        date,
      })
      .where({ id })

    return reply.status(204).send()
  })

  // Deletar refeição
  app.delete('/:id', async (request, reply) => {
    const deleteMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteMealParamsSchema.parse(request.params)

    const meal = await knex('meals').select('user_id').where({ id }).first()

    if (!meal) {
      return reply.status(404).send({ error: 'Resource not found.' })
    }

    if (meal.user_id !== request.user?.id) {
      return reply.status(401).send({ error: 'Unauthorized.' })
    }

    await knex('meals').where({ id }).delete()

    return reply.status(204).send()
  })

  // Listar todas as refeições
  app.get('/', async (request, reply) => {
    const meals = await knex('meals')
      .select('*')
      .where('user_id', request.user?.id)
      .orderBy('date', 'desc')

    return reply.send({
      meals,
    })
  })

  // Visualizar única refeição
  app.get('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').select('*').where('id', id).first()

    if (!meal) {
      return reply.status(404).send({ error: 'Resource not found.' })
    }

    if (meal.user_id !== request.user?.id) {
      return reply.status(401).send({ error: 'Unauthorized.' })
    }

    return reply.send({
      meal,
    })
  })

  // Visualizar as métricas de um usuário
  app.get('/metrics', async (request, reply) => {
    const user_id = request.user?.id

    const totalMeals = await knex('meals')
      .select('*')
      .where('user_id', user_id)
      .orderBy('date', 'desc')

    const totalMealsOnDiet = await knex('meals')
      .count('id', { as: 'total' })
      .where({
        user_id,
        is_on_diet: true,
      })

    const totalMealsOutDiet = await knex('meals')
      .count('id', { as: 'total' })
      .where({
        user_id,
        is_on_diet: false,
      })

    const { bestDietSequence } = totalMeals.reduce(
      (result, meal) => {
        if (meal.is_on_diet) {
          result.currentDietSequence += 1
        } else {
          result.currentDietSequence = 0
        }

        if (result.currentDietSequence > result.bestDietSequence) {
          result.bestDietSequence = result.currentDietSequence
        }

        return result
      },
      {
        bestDietSequence: 0,
        currentDietSequence: 0,
      },
    )

    return reply.send({
      totalMeals: totalMeals.length,
      totalMealsOnDiet: totalMealsOnDiet[0].total,
      totalMealsOutDiet: totalMealsOutDiet[0].total,
      bestDietSequence,
    })
  })
}
