import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyRequest {
    usuarioId: string
    usuarioPerfil: 'admin' | 'fornecedor' | 'comprador'
  }
}

async function pluginAuthImpl(servidor: FastifyInstance) {
  servidor.decorateRequest('usuarioId', null)
  servidor.decorateRequest('usuarioPerfil', null)

  // Hook de verificação de JWT (usar em rotas protegidas)
  servidor.decorate('verificarToken', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await req.jwtVerify<{ id: string; perfil: string }>()
      req.usuarioId = payload.id
      req.usuarioPerfil = payload.perfil as 'admin' | 'fornecedor' | 'comprador'
    } catch {
      reply.status(401).send({ erro: 'Não autenticado' })
    }
  })

  servidor.decorate('apenasAdmin', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await req.jwtVerify<{ id: string; perfil: string }>()
      req.usuarioId = payload.id
      req.usuarioPerfil = payload.perfil as 'admin' | 'fornecedor' | 'comprador'
      if (payload.perfil !== 'admin') {
        reply.status(403).send({ erro: 'Acesso restrito a administradores' })
      }
    } catch {
      reply.status(401).send({ erro: 'Não autenticado' })
    }
  })

  servidor.decorate('apenasFornecedor', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await req.jwtVerify<{ id: string; perfil: string }>()
      req.usuarioId = payload.id
      req.usuarioPerfil = payload.perfil as 'admin' | 'fornecedor' | 'comprador'
      if (payload.perfil !== 'fornecedor' && payload.perfil !== 'admin') {
        reply.status(403).send({ erro: 'Acesso restrito a fornecedores' })
      }
    } catch {
      reply.status(401).send({ erro: 'Não autenticado' })
    }
  })
}

export const pluginAuth = fp(pluginAuthImpl, { name: 'auth' })
