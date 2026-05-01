import { FastifyInstance } from 'fastify'
import {
  obterFornecedorId,
  listarStockFornecedor, listarStockAdmin,
  listarMovimentosPeca, ajustarEstoqueServico,
} from '../services/pecas'
import { schemaAjusteEstoque } from '../schemas/pecas'

export async function rotasStock(servidor: FastifyInstance) {

  // GET /fornecedor/stock — visão de stock do fornecedor autenticado
  servidor.get('/fornecedor/stock', { preHandler: [servidor.apenasFornecedor] }, async (req) => {
    const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
    return listarStockFornecedor(servidor.db, fornecedorId)
  })

  // GET /fornecedor/stock/:pecaId/movimentos — histórico de movimentos de uma peça
  servidor.get<{ Params: { pecaId: string } }>(
    '/fornecedor/stock/:pecaId/movimentos',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return listarMovimentosPeca(servidor.db, req.params.pecaId, fornecedorId)
    }
  )

  // PATCH /fornecedor/stock/:pecaId — ajuste manual de stock pelo fornecedor
  servidor.patch<{ Params: { pecaId: string } }>(
    '/fornecedor/stock/:pecaId',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const dados = schemaAjusteEstoque.parse(req.body)
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return ajustarEstoqueServico(servidor.db, req.params.pecaId, fornecedorId, dados, req.usuarioId)
    }
  )

  // GET /admin/stock — visão de stock de todos os fornecedores (admin)
  servidor.get(
    '/admin/stock',
    { preHandler: [servidor.apenasAdmin] },
    async (req) => {
      const fornecedorId = (req.query as { fornecedor_id?: string }).fornecedor_id
      return listarStockAdmin(servidor.db, fornecedorId)
    }
  )

  // PATCH /admin/stock/:pecaId — ajuste de stock pelo admin
  servidor.patch<{ Params: { pecaId: string } }>(
    '/admin/stock/:pecaId',
    { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const dados = schemaAjusteEstoque.parse(req.body)
      // Admin precisa de saber o fornecedor_id da peça
      const { rows: [peca] } = await servidor.db.query(
        `SELECT fornecedor_id FROM pecas WHERE id = $1 AND status != 'removido'`,
        [req.params.pecaId]
      )
      if (!peca) return reply.status(404).send({ erro: 'Peça não encontrada' })
      return ajustarEstoqueServico(servidor.db, req.params.pecaId, peca.fornecedor_id as string, dados, req.usuarioId)
    }
  )

  // GET /admin/stock/:pecaId/movimentos — histórico (admin vê qualquer peça)
  servidor.get<{ Params: { pecaId: string } }>(
    '/admin/stock/:pecaId/movimentos',
    { preHandler: [servidor.apenasAdmin] },
    async (req) => {
      const { rows: [peca] } = await servidor.db.query(
        `SELECT fornecedor_id FROM pecas WHERE id = $1`,
        [req.params.pecaId]
      )
      if (!peca) return []
      return listarMovimentosPeca(servidor.db, req.params.pecaId, peca.fornecedor_id as string)
    }
  )
}
