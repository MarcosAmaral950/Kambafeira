import { FastifyInstance } from 'fastify'
import { rotasAuth } from './auth'
import { rotasPecas } from './pecas'

export async function rotasIndex(servidor: FastifyInstance) {
  servidor.get('/health', async () => ({
    status: 'ok',
    servico: 'kambafeira-api',
    timestamp: new Date().toISOString(),
  }))

  await servidor.register(rotasAuth)
  await servidor.register(rotasPecas)
}
