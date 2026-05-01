import { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    verificarToken: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    apenasAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    apenasFornecedor: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
