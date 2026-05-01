import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(__dirname, '../../../.env') })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'

import { pluginBancoDados } from './plugins/db'
import { pluginAuth } from './plugins/auth'
import { rotasIndex } from './routes/index'

const servidor = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

// Tratamento global de erros de validação Zod
servidor.setErrorHandler((erro, req, reply) => {
  if (erro.name === 'ZodError') {
    return reply.status(400).send({
      erro: 'Dados inválidos',
      detalhes: JSON.parse(erro.message),
    })
  }
  // Erros lançados pelos serviços com statusCode
  const statusCode = (erro as { statusCode?: number }).statusCode ?? 500
  const mensagem = erro.message ?? 'Erro interno do servidor'
  reply.status(statusCode).send({ erro: mensagem })
})

async function iniciar() {
  await servidor.register(cors, {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await servidor.register(cookie)

  await servidor.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'segredo_dev_nao_usar_em_prod',
    cookie: { cookieName: 'token', signed: false },
  })

  await servidor.register(pluginBancoDados)
  await servidor.register(pluginAuth)
  await servidor.register(rotasIndex)

  const porta = Number(process.env.PORT ?? 3001)
  await servidor.listen({ port: porta, host: '0.0.0.0' })
  console.log(`API KambaFeira a correr na porta ${porta}`)
}

iniciar().catch((erro) => {
  console.error('Erro ao iniciar servidor:', erro)
  process.exit(1)
})
