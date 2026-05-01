import { FastifyInstance } from 'fastify'
import { rotasAuth } from './auth'
import { rotasPecas } from './pecas'
import { rotasPedidos } from './pedidos'
import { rotasDashboard } from './dashboard'
import { rotasAdmin } from './admin'
import { rotasAvaliacoes } from './avaliacoes'
import { rotasSeed } from './seed'
import { rotasUpload } from './upload'
import { rotasStock } from './stock'

export async function rotasIndex(servidor: FastifyInstance) {
  servidor.get('/health', async () => ({
    status: 'ok',
    servico: 'kambafeira-api',
    timestamp: new Date().toISOString(),
  }))

  await servidor.register(rotasAuth)
  await servidor.register(rotasPecas)
  await servidor.register(rotasPedidos)
  await servidor.register(rotasDashboard)
  await servidor.register(rotasAdmin)
  await servidor.register(rotasAvaliacoes)
  await servidor.register(rotasSeed)
  await servidor.register(rotasUpload)
  await servidor.register(rotasStock)
}
