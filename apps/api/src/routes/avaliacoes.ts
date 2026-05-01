import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const schemaCriarAvaliacao = z.object({
  nota:       z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional(),
})

export async function rotasAvaliacoes(servidor: FastifyInstance) {

  // POST /avaliacoes/:vendaId — comprador avalia após entrega
  servidor.post<{ Params: { vendaId: string } }>(
    '/avaliacoes/:vendaId',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { nota, comentario } = schemaCriarAvaliacao.parse(req.body)

      // Verificar que a venda existe, pertence ao comprador e está entregue
      const { rows: [venda] } = await servidor.db.query(
        `SELECT id, comprador_id, fornecedor_id, status FROM vendas WHERE id = $1`,
        [req.params.vendaId]
      )
      if (!venda)                          return reply.status(404).send({ erro: 'Pedido não encontrado' })
      if (venda.comprador_id !== req.usuarioId) return reply.status(403).send({ erro: 'Sem permissão' })
      if (venda.status !== 'entregue')     return reply.status(400).send({ erro: 'Só é possível avaliar após entrega' })

      // Verificar se já existe avaliação
      const { rows: [jaExiste] } = await servidor.db.query(
        `SELECT id FROM avaliacoes WHERE venda_id = $1`, [venda.id]
      )
      if (jaExiste) return reply.status(409).send({ erro: 'Este pedido já foi avaliado' })

      const { rows: [avaliacao] } = await servidor.db.query(
        `INSERT INTO avaliacoes (venda_id, comprador_id, fornecedor_id, nota, comentario)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [venda.id, req.usuarioId, venda.fornecedor_id, nota, comentario ?? null]
      )

      reply.status(201)
      return avaliacao
    }
  )

  // GET /fornecedor/minhas/avaliacoes — avaliações do fornecedor autenticado (inclui não publicadas)
  servidor.get(
    '/fornecedor/minhas/avaliacoes',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const { rows: [forn] } = await servidor.db.query(
        `SELECT f.id, f.avaliacao_media, f.total_avaliacoes
         FROM fornecedores f WHERE f.usuario_id = $1`,
        [req.usuarioId]
      )
      if (!forn) return { avaliacoes: [], media: 0, total: 0 }

      const { rows } = await servidor.db.query(
        `SELECT a.id, a.nota, a.comentario, a.resposta, a.publicada, a.criada_em,
                u.nome AS comprador_nome
         FROM avaliacoes a
         JOIN usuarios u ON a.comprador_id = u.id
         WHERE a.fornecedor_id = $1
         ORDER BY a.criada_em DESC`,
        [forn.id]
      )
      return {
        avaliacoes: rows,
        media: forn.avaliacao_media ?? 0,
        total: forn.total_avaliacoes ?? 0,
      }
    }
  )

  // GET /fornecedor/:id/avaliacoes — avaliações públicas de um fornecedor
  servidor.get<{ Params: { id: string } }>(
    '/fornecedor/:id/avaliacoes',
    async (req) => {
      const { rows } = await servidor.db.query(
        `SELECT a.id, a.nota, a.comentario, a.resposta, a.criada_em,
                u.nome AS comprador_nome
         FROM avaliacoes a
         JOIN usuarios u ON a.comprador_id = u.id
         WHERE a.fornecedor_id = $1 AND a.publicada = true
         ORDER BY a.criada_em DESC
         LIMIT 50`,
        [req.params.id]
      )

      // Totais
      const { rows: [stats] } = await servidor.db.query(
        `SELECT avaliacao_media, total_avaliacoes FROM fornecedores WHERE id = $1`,
        [req.params.id]
      )

      return { avaliacoes: rows, media: stats?.avaliacao_media ?? 0, total: stats?.total_avaliacoes ?? 0 }
    }
  )

  // PUT /avaliacoes/:id/resposta — fornecedor responde à avaliação
  servidor.put<{ Params: { id: string } }>(
    '/avaliacoes/:id/resposta',
    { preHandler: [servidor.apenasFornecedor] },
    async (req, reply) => {
      const { resposta } = req.body as { resposta: string }
      if (!resposta?.trim()) return reply.status(400).send({ erro: 'Resposta não pode ser vazia' })

      // Verificar que a avaliação pertence ao fornecedor
      const { rows: [forn] } = await servidor.db.query(
        `SELECT f.id FROM fornecedores f WHERE f.usuario_id = $1`, [req.usuarioId]
      )
      const { rows: [av] } = await servidor.db.query(
        `SELECT id FROM avaliacoes WHERE id = $1 AND fornecedor_id = $2`,
        [req.params.id, forn?.id]
      )
      if (!av) return reply.status(404).send({ erro: 'Avaliação não encontrada' })

      const { rows: [atualizada] } = await servidor.db.query(
        `UPDATE avaliacoes SET resposta = $1 WHERE id = $2 RETURNING *`,
        [resposta.trim(), req.params.id]
      )
      return atualizada
    }
  )

  // GET /pedidos/meus/avaliar — pedidos entregues sem avaliação (para o comprador)
  servidor.get(
    '/pedidos/meus/avaliar',
    { preHandler: [servidor.verificarToken] },
    async (req) => {
      const { rows } = await servidor.db.query(
        `SELECT v.id, v.preco_total, v.criada_em,
                p.titulo AS peca_titulo, p.foto_principal AS peca_foto,
                uf.nome AS fornecedor_nome
         FROM vendas v
         JOIN pecas p ON v.peca_id = p.id
         JOIN fornecedores f ON v.fornecedor_id = f.id
         JOIN usuarios uf ON f.usuario_id = uf.id
         WHERE v.comprador_id = $1
           AND v.status = 'entregue'
           AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.venda_id = v.id)
         ORDER BY v.atualizada_em DESC`,
        [req.usuarioId]
      )
      return rows
    }
  )
}
