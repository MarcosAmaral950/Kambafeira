import { FastifyInstance } from 'fastify'
import { obterFornecedorId } from '../services/pecas'

export async function rotasDashboard(servidor: FastifyInstance) {

  // GET /fornecedor/resumo — estatísticas do painel do fornecedor
  servidor.get('/fornecedor/resumo', { preHandler: [servidor.apenasFornecedor] }, async (req) => {
    const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)

    const [pecas, pedidos, financeiro, recentes] = await Promise.all([

      servidor.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'activo')   AS activas,
           COUNT(*) FILTER (WHERE status = 'rascunho') AS rascunhos,
           COUNT(*) FILTER (WHERE status = 'vendido')  AS vendidas,
           COUNT(*) AS total
         FROM pecas
         WHERE fornecedor_id = $1 AND status != 'removido'`,
        [fornecedorId]
      ),

      servidor.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'pendente')   AS pendentes,
           COUNT(*) FILTER (WHERE status = 'confirmado') AS confirmados,
           COUNT(*) FILTER (WHERE status = 'entregue')   AS concluidos,
           COUNT(*) AS total
         FROM vendas
         WHERE fornecedor_id = $1`,
        [fornecedorId]
      ),

      servidor.db.query(
        `SELECT
           COALESCE(SUM(valor_venda),    0) AS total_vendas,
           COALESCE(SUM(valor_comissao), 0) AS total_comissoes,
           COALESCE(SUM(valor_liquido),  0) AS total_liquido
         FROM comissoes
         WHERE fornecedor_id = $1`,
        [fornecedorId]
      ),

      servidor.db.query(
        `SELECT v.id, v.status, v.preco_total, v.criada_em,
                p.titulo AS peca_titulo,
                uc.nome  AS comprador_nome
         FROM vendas v
         JOIN pecas    p  ON v.peca_id     = p.id
         JOIN usuarios uc ON v.comprador_id = uc.id
         WHERE v.fornecedor_id = $1
         ORDER BY v.criada_em DESC
         LIMIT 5`,
        [fornecedorId]
      ),
    ])

    return {
      pecas:           pecas.rows[0],
      pedidos:         pedidos.rows[0],
      financeiro:      financeiro.rows[0],
      pedidos_recentes: recentes.rows,
    }
  })

  // GET /admin/resumo — estatísticas gerais para administrador
  servidor.get('/admin/resumo', { preHandler: [servidor.apenasAdmin] }, async () => {
    const [usuarios, pecas, vendas, financeiro] = await Promise.all([

      servidor.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE perfil = 'comprador')  AS compradores,
           COUNT(*) FILTER (WHERE perfil = 'fornecedor') AS fornecedores,
           COUNT(*) AS total
         FROM usuarios
         WHERE ativo = true`
      ),

      servidor.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'activo') AS activas,
           COUNT(*) AS total
         FROM pecas
         WHERE status != 'removido'`
      ),

      servidor.db.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'pendente')  AS pendentes,
           COUNT(*) FILTER (WHERE status = 'entregue')  AS concluidas,
           COALESCE(SUM(preco_total) FILTER (WHERE status = 'entregue'), 0) AS volume_total
         FROM vendas`
      ),

      servidor.db.query(
        `SELECT COALESCE(SUM(valor_comissao), 0) AS total_comissoes FROM comissoes`
      ),
    ])

    return {
      usuarios:   usuarios.rows[0],
      pecas:      pecas.rows[0],
      vendas:     vendas.rows[0],
      financeiro: financeiro.rows[0],
    }
  })
}
