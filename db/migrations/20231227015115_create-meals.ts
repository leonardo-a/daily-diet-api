import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.string('user_id').references('users.id').notNullable()
    table.string('name').notNullable()
    table.string('description')
    table.boolean('is_on_diet').notNullable()
    table.datetime('date').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
