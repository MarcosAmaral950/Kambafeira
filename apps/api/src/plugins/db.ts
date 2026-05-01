import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Pool } from 'pg'

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool
  }
}

async function pluginBancoDadosImpl(servidor: FastifyInstance) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
  })

  // Testar ligação ao arrancar
  const cliente = await pool.connect()
  cliente.release()
  servidor.log.info('Ligação à base de dados estabelecida')

  servidor.decorate('db', pool)

  servidor.addHook('onClose', async () => {
    await pool.end()
  })
}

export const pluginBancoDados = fp(pluginBancoDadosImpl, { name: 'banco-dados' })
