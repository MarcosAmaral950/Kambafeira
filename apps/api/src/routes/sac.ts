import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const schemaCriarTicket = z.object({
  assunto: z.string().min(5).max(255),
  descricao: z.string().min(10),
  tipo: z.enum(['geral','venda','entrega','pagamento','fornecedor','tecnico','outro']).default('geral'),
  prioridade: z.enum(['baixa','normal','alta','urgente']).default('normal'),
  venda_id: z.string().uuid().optional(),
  fotos: z.array(z.string().url()).max(5).default([]),
})

const schemaAdicionarMensagem = z.object({
  mensagem: z.string().min(1),
  fotos: z.array(z.string().url()).max(5).default([]),
})

const schemaAtualizarTicket = z.object({
  status: z.enum(['aberto','em_atendimento','aguarda_usuario','resolvido','fechado']).optional(),
  prioridade: z.enum(['baixa','normal','alta','urgente']).optional(),
  atribuido_a: z.string().uuid().nullable().optional(),
})

export async function rotasSAC(servidor: FastifyInstance) {

  // POST /sac/tickets — abrir ticket
  servidor.post('/sac/tickets', { preHandler: [servidor.verificarToken] }, async (req, reply) => {
    const dados = schemaCriarTicket.parse(req.body)
    const { rows: [ticket] } = await servidor.db.query(
      `INSERT INTO tickets_sac (usuario_id, assunto, descricao, tipo, prioridade, venda_id, fotos)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.usuarioId, dados.assunto, dados.descricao, dados.tipo, dados.prioridade,
       dados.venda_id ?? null, dados.fotos]
    )

    // Primeira mensagem = descrição
    await servidor.db.query(
      `INSERT INTO mensagens_sac (ticket_id, usuario_id, mensagem, fotos)
       VALUES ($1,$2,$3,$4)`,
      [ticket.id, req.usuarioId, dados.descricao, dados.fotos]
    )

    reply.status(201)
    return ticket
  })

  // GET /sac/tickets/meus — tickets do utilizador autenticado
  servidor.get('/sac/tickets/meus', { preHandler: [servidor.verificarToken] }, async (req) => {
    const { rows } = await servidor.db.query(
      `SELECT t.*, u.nome AS usuario_nome,
              (SELECT COUNT(*) FROM mensagens_sac m WHERE m.ticket_id = t.id) AS total_mensagens
       FROM tickets_sac t
       JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.usuario_id = $1
       ORDER BY t.criado_em DESC`,
      [req.usuarioId]
    )
    return rows
  })

  // GET /sac/tickets/:id — detalhe + mensagens
  servidor.get<{ Params: { id: string } }>(
    '/sac/tickets/:id', { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { rows: [ticket] } = await servidor.db.query(
        `SELECT t.*, u.nome AS usuario_nome,
                ua.nome AS atribuido_nome
         FROM tickets_sac t
         JOIN usuarios u ON t.usuario_id = u.id
         LEFT JOIN usuarios ua ON t.atribuido_a = ua.id
         WHERE t.id = $1`,
        [req.params.id]
      )
      if (!ticket) return reply.status(404).send({ erro: 'Ticket não encontrado' })

      // Verificar acesso
      if (req.usuarioPerfil !== 'admin' && ticket.usuario_id !== req.usuarioId) {
        return reply.status(403).send({ erro: 'Sem permissão' })
      }

      const { rows: mensagens } = await servidor.db.query(
        `SELECT m.*, u.nome AS autor_nome, u.perfil AS autor_perfil
         FROM mensagens_sac m
         JOIN usuarios u ON m.usuario_id = u.id
         WHERE m.ticket_id = $1
         ORDER BY m.criado_em ASC`,
        [req.params.id]
      )

      return { ...ticket, mensagens }
    }
  )

  // POST /sac/tickets/:id/mensagens — responder ao ticket
  servidor.post<{ Params: { id: string } }>(
    '/sac/tickets/:id/mensagens', { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const dados = schemaAdicionarMensagem.parse(req.body)

      const { rows: [ticket] } = await servidor.db.query(
        'SELECT id, usuario_id, status FROM tickets_sac WHERE id = $1',
        [req.params.id]
      )
      if (!ticket) return reply.status(404).send({ erro: 'Ticket não encontrado' })
      if (req.usuarioPerfil !== 'admin' && ticket.usuario_id !== req.usuarioId) {
        return reply.status(403).send({ erro: 'Sem permissão' })
      }
      if (ticket.status === 'fechado') {
        return reply.status(400).send({ erro: 'Ticket fechado — não é possível adicionar mensagens' })
      }

      const { rows: [msg] } = await servidor.db.query(
        `INSERT INTO mensagens_sac (ticket_id, usuario_id, mensagem, fotos)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.params.id, req.usuarioId, dados.mensagem, dados.fotos]
      )

      // Atualizar status: se admin respondeu → aguarda_usuario; se utilizador respondeu → em_atendimento
      const novoStatus = req.usuarioPerfil === 'admin' ? 'aguarda_usuario' : 'em_atendimento'
      await servidor.db.query(
        `UPDATE tickets_sac SET status=$1, atualizado_em=NOW() WHERE id=$2 AND status NOT IN ('resolvido','fechado')`,
        [novoStatus, req.params.id]
      )

      reply.status(201)
      return msg
    }
  )

  // ── Admin ──────────────────────────────────────────────────

  // GET /admin/sac/tickets
  servidor.get('/admin/sac/tickets', { preHandler: [servidor.apenasAdmin] }, async (req) => {
    const { status, prioridade } = req.query as { status?: string; prioridade?: string }
    const { rows } = await servidor.db.query(
      `SELECT t.*, u.nome AS usuario_nome,
              (SELECT COUNT(*) FROM mensagens_sac m WHERE m.ticket_id = t.id) AS total_mensagens
       FROM tickets_sac t
       JOIN usuarios u ON t.usuario_id = u.id
       WHERE ($1::text IS NULL OR t.status = $1)
         AND ($2::text IS NULL OR t.prioridade = $2)
       ORDER BY
         CASE t.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         t.criado_em DESC
       LIMIT 200`,
      [status ?? null, prioridade ?? null]
    )
    return rows
  })

  // PUT /admin/sac/tickets/:id — atualizar status/prioridade/atribuição
  servidor.put<{ Params: { id: string } }>(
    '/admin/sac/tickets/:id', { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const dados = schemaAtualizarTicket.parse(req.body)
      const { rows: [ticket] } = await servidor.db.query(
        `UPDATE tickets_sac
         SET status       = COALESCE($1, status),
             prioridade   = COALESCE($2, prioridade),
             atribuido_a  = COALESCE($3, atribuido_a),
             resolvido_em = CASE WHEN $1 = 'resolvido' THEN NOW() ELSE resolvido_em END,
             atualizado_em = NOW()
         WHERE id = $4 RETURNING *`,
        [dados.status ?? null, dados.prioridade ?? null, dados.atribuido_a ?? null, req.params.id]
      )
      if (!ticket) return reply.status(404).send({ erro: 'Ticket não encontrado' })
      return ticket
    }
  )
}
