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
    return { usuario, token }
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
    return { usuario, token }
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
    return { usuario, token }
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
    async (req, reply) => {
      const { rows } = await servidor.db.query(
        'SELECT id, email, perfil, nome, telefone, criado_em FROM usuarios WHERE id = $1',
        [req.usuarioId]
      )
      if (!rows[0]) return reply.status(404).send({ erro: 'Utilizador não encontrado' })
      return rows[0]
    }
  )

  // PUT /auth/alterar-password  (rota protegida — o próprio utilizador altera a sua password)
  servidor.put(
    '/auth/alterar-password',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { password_actual, password_nova } = req.body as {
        password_actual: string
        password_nova: string
      }
      if (!password_actual || !password_nova) {
        return reply.status(400).send({ erro: 'Preenche todos os campos' })
      }
      if (password_nova.length < 8) {
        return reply.status(400).send({ erro: 'A nova password deve ter pelo menos 8 caracteres' })
      }

      const { rows: [usuario] } = await servidor.db.query(
        'SELECT password_hash FROM usuarios WHERE id = $1',
        [req.usuarioId]
      )
      const bcrypt = await import('bcrypt')
      const correcta = await bcrypt.compare(password_actual, usuario.password_hash)
      if (!correcta) return reply.status(401).send({ erro: 'Password actual incorrecta' })

      const novoHash = await bcrypt.hash(password_nova, 10)
      await servidor.db.query(
        'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
        [novoHash, req.usuarioId]
      )
      return { mensagem: 'Password alterada com sucesso' }
    }
  )

  // PUT /auth/me/actualizar  (rota protegida — o próprio utilizador actualiza nome e telefone)
  servidor.put(
    '/auth/me/actualizar',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { nome, telefone } = req.body as { nome?: string; telefone?: string }
      if (!nome?.trim()) return reply.status(400).send({ erro: 'Nome não pode ser vazio' })

      const { rows: [u] } = await servidor.db.query(
        `UPDATE usuarios SET
           nome     = COALESCE($1, nome),
           telefone = COALESCE($2, telefone)
         WHERE id = $3
         RETURNING id, nome, email, telefone, perfil`,
        [nome.trim(), telefone?.trim() || null, req.usuarioId]
      )
      return u
    }
  )
}
