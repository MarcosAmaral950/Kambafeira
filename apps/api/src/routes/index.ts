import { FastifyInstance } from 'fastify'
import { rotasAuth } from './auth'
import { rotasPecas } from './pecas'
import { rotasSeed } from './seed'

export async function rotasIndex(servidor: FastifyInstance) {
  servidor.get('/health', async () => ({
    status: 'ok',
    servico: 'kambafeira-api',
    timestamp: new Date().toISOString(),
  }))

  await servidor.register(rotasAuth)
  await servidor.register(rotasPecas)
  await servidor.register(rotasSeed)
}
