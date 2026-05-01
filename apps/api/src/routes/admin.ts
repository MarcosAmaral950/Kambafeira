import { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { z } from 'zod'

const schemaSuspender = z.object({
  suspenso: z.boolean(),
  motivo: z.string().max(500).optional(),
})

export async function rotasAdmin(servidor: FastifyInstance) {

  // GET /admin/usuarios — listar todos os utilizadores
  servidor.get('/admin/usuarios', { preHandler: [servidor.apenasAdmin] }, async (req) => {
    const { q } = req.query as { q?: string }
    const { rows } = await servidor.db.query(
      `SELECT u.id, u.email, u.nome, u.perfil, u.telefone, u.ativo, u.criado_em,
              f.id AS fornecedor_id, f.verificado, f.suspenso, f.total_vendas
       FROM usuarios u
       LEFT JOIN fornecedores f ON u.id = f.usuario_id
       WHERE ($1::text IS NULL OR u.nome ILIKE $1 OR u.email ILIKE $1)
       ORDER BY u.criado_em DESC`,
      [q ? `%${q}%` : null]
    )
    return rows
  })

  // GET /admin/fornecedores — listar fornecedores com estatísticas
  servidor.get('/admin/fornecedores', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT f.id, f.verificado, f.suspenso, f.total_vendas, f.avaliacao_media,
              f.total_avaliacoes, f.tipo, f.provincia, f.criado_em,
              u.nome, u.email, u.telefone, u.ativo,
              (SELECT COUNT(*) FROM pecas p WHERE p.fornecedor_id = f.id AND p.status = 'activo')  AS pecas_activas,
              (SELECT COUNT(*) FROM vendas v WHERE v.fornecedor_id = f.id)                          AS total_pedidos
       FROM fornecedores f
       JOIN usuarios u ON f.usuario_id = u.id
       ORDER BY f.criado_em DESC`
    )
    return rows
  })

  // PUT /admin/fornecedores/:id/suspender — suspender ou reactivar fornecedor
  servidor.put<{ Params: { id: string } }>(
    '/admin/fornecedores/:id/suspender',
    { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const { suspenso, motivo } = schemaSuspender.parse(req.body)
      const { rows: [f] } = await servidor.db.query(
        `UPDATE fornecedores
         SET suspenso = $1, motivo_suspensao = $2, atualizado_em = NOW()
         WHERE id = $3
         RETURNING id, suspenso, motivo_suspensao`,
        [suspenso, motivo ?? null, req.params.id]
      )
      if (!f) return reply.status(404).send({ erro: 'Fornecedor não encontrado' })
      return f
    }
  )

  // POST /admin/chaves — gerar chave de convite para fornecedor
  servidor.post('/admin/chaves', { preHandler: [servidor.apenasAdmin] }, async (req, reply) => {
    const chave = crypto.randomBytes(16).toString('hex')
    const { rows: [nova] } = await servidor.db.query(
      `INSERT INTO chaves_acesso (chave, tipo, criada_por)
       VALUES ($1, 'fornecedor', $2)
       RETURNING *`,
      [chave, req.usuarioId]
    )
    reply.status(201)
    return nova
  })

  // GET /admin/chaves — listar chaves de convite
  servidor.get('/admin/chaves', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT ca.id, ca.chave, ca.ativa, ca.expira_em, ca.criada_em, ca.usada_em,
              u1.nome AS criada_por_nome,
              u2.nome AS usada_por_nome
       FROM chaves_acesso ca
       JOIN usuarios u1 ON ca.criada_por = u1.id
       LEFT JOIN usuarios u2 ON ca.usada_por = u2.id
       ORDER BY ca.criada_em DESC
       LIMIT 100`
    )
    return rows
  })

  // GET /admin/compradores — lista compradores para dropdown de pedido manual
  servidor.get('/admin/compradores', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT id, nome, email, telefone FROM usuarios WHERE perfil = 'comprador' AND ativo = true ORDER BY nome`
    )
    return rows
  })

  // PUT /admin/usuarios/:id/reset-password — admin repõe a password de qualquer utilizador
  servidor.put<{ Params: { id: string } }>(
    '/admin/usuarios/:id/reset-password',
    { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const { password_nova } = req.body as { password_nova: string }
      if (!password_nova || password_nova.length < 8) {
        return reply.status(400).send({ erro: 'Password deve ter pelo menos 8 caracteres' })
      }
      const bcrypt = await import('bcrypt')
      const hash = await bcrypt.hash(password_nova, 10)
      const { rows: [u] } = await servidor.db.query(
        'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, nome, email',
        [hash, req.params.id]
      )
      if (!u) return reply.status(404).send({ erro: 'Utilizador não encontrado' })
      return { mensagem: `Password de ${u.nome as string} reposta com sucesso` }
    }
  )

  // GET /admin/pedidos — todos os pedidos da plataforma
  servidor.get('/admin/pedidos', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT v.id, v.status, v.quantidade, v.preco_total, v.criada_em, v.atualizada_em,
              p.titulo AS peca_titulo,
              uf.nome  AS fornecedor_nome,
              uc.nome  AS comprador_nome
       FROM vendas v
       JOIN pecas     p  ON v.peca_id      = p.id
       JOIN fornecedores f  ON v.fornecedor_id = f.id
       JOIN usuarios uf    ON f.usuario_id    = uf.id
       JOIN usuarios uc    ON v.comprador_id  = uc.id
       ORDER BY v.criada_em DESC
       LIMIT 200`
    )
    return rows
  })
}
