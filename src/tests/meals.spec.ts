import { execSync } from 'node:child_process'
import { describe, beforeAll, beforeEach, it, afterAll, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)
  })

  it('should be able to list all meals from an user', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Chicken, rice, beans and salad',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Hamburguer',
        isOnDiet: false,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
      })
      .expect(201)

    const mealsData = await request(app.server)
      .get('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    expect(mealsData.body.meals).toHaveLength(2)
  })

  it('should be able to show a single meal', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const meals = await request(app.server)
      .get('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    const mealId = meals.body.meals[0].id

    const mealData = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    expect(mealData.body).toEqual({
      meal: expect.objectContaining({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        is_on_diet: 1,
        date: expect.any(Number),
      }),
    })
  })

  it('should be able to update a meal from an user', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsData = await request(app.server)
      .get('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsData.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Chicker, garlic and pasta',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(204)
  })

  it('should be able to delete a meal from an user', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsData = await request(app.server)
      .get('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsData.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(204)
  })

  it('should be able to get metrics from an user', async () => {
    const userData = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: false,
        date: new Date('2021-01-01T08:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Chicken, veggies, rice and beans',
        isOnDiet: true,
        date: new Date('2021-01-01T12:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Dessert',
        description: 'Strawberry Cheesecake',
        isOnDiet: false,
        date: new Date('2021-01-01T14:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Snack',
        description: 'Fruit Salad',
        isOnDiet: true,
        date: new Date('2021-01-01T15:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Chicker, garlic and pasta',
        isOnDiet: true,
        date: new Date('2021-01-01T20:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', userData.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bacon, eggs and pancakes',
        isOnDiet: true,
        date: new Date('2021-01-02T08:00:00'),
      })

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', userData.get('Set-Cookie'))
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 6,
      totalMealsOnDiet: 4,
      totalMealsOutDiet: 2,
      bestDietSequence: 3,
    })
  })
})
