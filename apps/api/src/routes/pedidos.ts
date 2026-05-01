import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { obterFornecedorId } from '../services/pecas'

const schemaCriarPedido = z.object({
  peca_id: z.string().uuid(),
  quantidade: z.number().int().min(1).default(1),
  notas_comprador: z.string().max(500).optional(),
  metodo_pagamento: z.string().max(50).optional(),
})

const schemaAtualizarStatus = z.object({
  status: z.enum(['confirmado', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado']),
  notas_fornecedor: z.string().max(500).optional(),
  motivo_cancelamento: z.string().max(500).optional(),
})

export async function rotasPedidos(servidor: FastifyInstance) {

  // POST /pedidos — comprador cria pedido
  servidor.post('/pedidos', { preHandler: [servidor.verificarToken] }, async (req, reply) => {
    if (req.usuarioPerfil === 'fornecedor') {
      return reply.status(403).send({ erro: 'Fornecedores não podem fazer pedidos' })
    }

    const dados = schemaCriarPedido.parse(req.body)

    const { rows: [peca] } = await servidor.db.query(
      `SELECT id, preco, estoque, titulo, status, fornecedor_id FROM pecas WHERE id = $1`,
      [dados.peca_id]
    )

    if (!peca) return reply.status(404).send({ erro: 'Peça não encontrada' })
    if (peca.status !== 'activo') return reply.status(400).send({ erro: 'Peça não disponível' })
    if (peca.estoque < dados.quantidade) return reply.status(400).send({ erro: 'Estoque insuficiente' })

    const precoTotal = parseFloat(peca.preco) * dados.quantidade

    const { rows: [venda] } = await servidor.db.query(
      `INSERT INTO vendas
         (peca_id, fornecedor_id, comprador_id, quantidade, preco_unitario, preco_total, metodo_pagamento, notas_comprador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [dados.peca_id, peca.fornecedor_id, req.usuarioId, dados.quantidade,
        peca.preco, precoTotal, dados.metodo_pagamento ?? null, dados.notas_comprador ?? null]
    )

    reply.status(201)
    return venda
  })

  // GET /pedidos/meus — pedidos do comprador autenticado
  servidor.get('/pedidos/meus', { preHandler: [servidor.verificarToken] }, async (req) => {
    const { rows } = await servidor.db.query(
      `SELECT v.id, v.status, v.quantidade, v.preco_total, v.criada_em, v.atualizada_em,
              p.titulo AS peca_titulo, p.foto_principal AS peca_foto,
              uf.nome AS fornecedor_nome
       FROM vendas v
       JOIN pecas p   ON v.peca_id      = p.id
       JOIN fornecedores f ON v.fornecedor_id = f.id
       JOIN usuarios uf   ON f.usuario_id    = uf.id
       WHERE v.comprador_id = $1
       ORDER BY v.criada_em DESC`,
      [req.usuarioId]
    )
    return rows
  })

  // GET /fornecedor/pedidos — pedidos recebidos pelo fornecedor
  servidor.get('/fornecedor/pedidos', { preHandler: [servidor.apenasFornecedor] }, async (req) => {
    const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
    const { rows } = await servidor.db.query(
      `SELECT v.id, v.status, v.quantidade, v.preco_total, v.criada_em, v.atualizada_em,
              v.notas_comprador, v.notas_fornecedor,
              p.titulo AS peca_titulo, p.foto_principal AS peca_foto,
              uc.nome AS comprador_nome, uc.telefone AS comprador_telefone
       FROM vendas v
       JOIN pecas p    ON v.peca_id     = p.id
       JOIN usuarios uc ON v.comprador_id = uc.id
       WHERE v.fornecedor_id = $1
       ORDER BY v.criada_em DESC`,
      [fornecedorId]
    )
    return rows
  })

  // GET /pedidos/:id — detalhe de um pedido
  servidor.get<{ Params: { id: string } }>(
    '/pedidos/:id',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { rows: [venda] } = await servidor.db.query(
        `SELECT v.*,
                p.titulo AS peca_titulo, p.foto_principal AS peca_foto,
                p.marca_veiculo, p.modelo_veiculo,
                uf.nome AS fornecedor_nome,
                uc.nome AS comprador_nome, uc.telefone AS comprador_telefone
         FROM vendas v
         JOIN pecas p    ON v.peca_id      = p.id
         JOIN fornecedores f  ON v.fornecedor_id = f.id
         JOIN usuarios uf    ON f.usuario_id    = uf.id
         JOIN usuarios uc    ON v.comprador_id  = uc.id
         WHERE v.id = $1`,
        [req.params.id]
      )

      if (!venda) return reply.status(404).send({ erro: 'Pedido não encontrado' })

      // Verificar acesso
      if (req.usuarioPerfil !== 'admin' && venda.comprador_id !== req.usuarioId) {
        const fId = await obterFornecedorId(servidor.db, req.usuarioId)
        if (venda.fornecedor_id !== fId) {
          return reply.status(403).send({ erro: 'Sem permissão para ver este pedido' })
        }
      }

      return venda
    }
  )

  // PUT /pedidos/:id/status — actualizar estado do pedido
  servidor.put<{ Params: { id: string } }>(
    '/pedidos/:id/status',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const dados = schemaAtualizarStatus.parse(req.body)

      const { rows: [venda] } = await servidor.db.query(
        'SELECT * FROM vendas WHERE id = $1',
        [req.params.id]
      )
      if (!venda) return reply.status(404).send({ erro: 'Pedido não encontrado' })

      // Verificar permissão
      if (req.usuarioPerfil === 'fornecedor') {
        const fId = await obterFornecedorId(servidor.db, req.usuarioId)
        if (venda.fornecedor_id !== fId) {
          return reply.status(403).send({ erro: 'Sem permissão' })
        }
      } else if (req.usuarioPerfil !== 'admin') {
        return reply.status(403).send({ erro: 'Sem permissão' })
      }

      const { rows: [atualizado] } = await servidor.db.query(
        `UPDATE vendas
         SET status               = $1,
             notas_fornecedor     = COALESCE($2, notas_fornecedor),
             motivo_cancelamento  = COALESCE($3, motivo_cancelamento),
             cancelado_por        = CASE WHEN $1 = 'cancelado' THEN $4 ELSE cancelado_por END,
             atualizada_em        = NOW()
         WHERE id = $5
         RETURNING *`,
        [dados.status, dados.notas_fornecedor ?? null,
          dados.motivo_cancelamento ?? null, req.usuarioPerfil, req.params.id]
      )

      // Quando entregue: calcular comissão e actualizar total_vendas
      if (dados.status === 'entregue') {
        const { rows: [contrato] } = await servidor.db.query(
          `SELECT taxa_comissao FROM contratos
           WHERE fornecedor_id = $1 AND ativo = true
           ORDER BY criado_em DESC LIMIT 1`,
          [venda.fornecedor_id]
        )
        const taxa = contrato ? parseFloat(contrato.taxa_comissao) : 10.00
        const valorVenda = parseFloat(venda.preco_total)
        const valorComissao = valorVenda * taxa / 100
        const valorLiquido = valorVenda - valorComissao

        await servidor.db.query(
          `INSERT INTO comissoes
             (venda_id, fornecedor_id, valor_venda, taxa_aplicada, valor_comissao, valor_liquido)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (venda_id) DO NOTHING`,
          [venda.id, venda.fornecedor_id, valorVenda, taxa, valorComissao, valorLiquido]
        )

        await servidor.db.query(
          `UPDATE fornecedores SET total_vendas = total_vendas + 1 WHERE id = $1`,
          [venda.fornecedor_id]
        )
      }

      return atualizado
    }
  )
}
