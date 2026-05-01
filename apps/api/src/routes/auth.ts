import { FastifyInstance } from 'fastify'
import { schemaLogin, schemaRegistoComprador, schemaRegistoFornecedor } from '../schemas/auth'
import { loginServico, registoCompradorServico, registoFornecedorServico } from '../services/auth'

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
}

export async function rotasAuth(servidor: FastifyInstance) {

  // POST /auth/login
  servidor.post('/auth/login', async (req, reply) => {
    const dados = schemaLogin.parse(req.body)
    const usuario = await loginServico(servidor.db, dados)

    const token = servidor.jwt.sign(
      { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome },
      { expiresIn: JWT_EXPIRES }
    )

    reply.setCookie('token', token, COOKIE_OPTS)
    return { usuario }
  })

  // POST /auth/registo/comprador
  servidor.post('/auth/registo/comprador', async (req, reply) => {
    const dados = schemaRegistoComprador.parse(req.body)
    const usuario = await registoCompradorServico(servidor.db, dados)

    const token = servidor.jwt.sign(
      { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome },
      { expiresIn: JWT_EXPIRES }
    )

    reply.status(201).setCookie('token', token, COOKIE_OPTS)
    return { usuario }
  })

  // POST /auth/registo/fornecedor
  servidor.post('/auth/registo/fornecedor', async (req, reply) => {
    const dados = schemaRegistoFornecedor.parse(req.body)
    const usuario = await registoFornecedorServico(servidor.db, dados)

    const token = servidor.jwt.sign(
      { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome },
      { expiresIn: JWT_EXPIRES }
    )

    reply.status(201).setCookie('token', token, COOKIE_OPTS)
    return { usuario }
  })

  // POST /auth/logout
  servidor.post('/auth/logout', async (req, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { mensagem: 'Sessão terminada com sucesso' }
  })

  // GET /auth/me  (rota protegida)
  servidor.get(
    '/auth/me',
    { preHandler: [servidor.verificarToken] },
    async (req) => {
      const { rows } = await servidor.db.query(
        'SELECT id, email, perfil, nome, telefone, criado_em FROM usuarios WHERE id = $1',
        [req.usuarioId]
      )
      if (!rows[0]) return reply.status(404).send({ erro: 'Utilizador não encontrado' })
      return rows[0]
    }
  )
}
