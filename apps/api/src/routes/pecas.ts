import { FastifyInstance } from 'fastify'
import { schemaCriarPeca, schemaEditarPeca, schemaFiltrosPecas, schemaAtualizarEstoque } from '../schemas/pecas'
import {
  criarPecaServico, listarPecasServico, obterPecaServico,
  editarPecaServico, removerPecaServico, pecasFornecedorServico,
  obterFornecedorId, obterPecaFornecedorServico, atualizarEstoqueServico,
  listarTodasPecasAdmin,
} from '../services/pecas'

export async function rotasPecas(servidor: FastifyInstance) {

  // GET /pecas — listagem pública com filtros
  servidor.get('/pecas', async (req) => {
    const filtros = schemaFiltrosPecas.parse(req.query)
    return listarPecasServico(servidor.db, filtros)
  })

  // GET /pecas/:id — detalhe público
  servidor.get<{ Params: { id: string } }>('/pecas/:id', async (req) => {
    return obterPecaServico(servidor.db, req.params.id)
  })

  // GET /fornecedor/pecas — peças do fornecedor autenticado
  servidor.get(
    '/fornecedor/pecas',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return pecasFornecedorServico(servidor.db, fornecedorId)
    }
  )

  // GET /fornecedor/pecas/:id — detalhe de uma peça do fornecedor (qualquer status)
  servidor.get<{ Params: { id: string } }>(
    '/fornecedor/pecas/:id',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return obterPecaFornecedorServico(servidor.db, req.params.id, fornecedorId)
    }
  )

  // PATCH /fornecedor/pecas/:id/estoque — actualização rápida de estoque, preço e/ou status
  servidor.patch<{ Params: { id: string } }>(
    '/fornecedor/pecas/:id/estoque',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const dados = schemaAtualizarEstoque.parse(req.body)
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return atualizarEstoqueServico(servidor.db, req.params.id, fornecedorId, dados)
    }
  )

  // POST /pecas — criar peça (fornecedor ou admin em nome de fornecedor)
  servidor.post(
    '/pecas',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      let fornecedorId: string

      if (req.usuarioPerfil === 'admin') {
        // Admin passa fornecedor_id no body
        const body = req.body as { fornecedor_id?: string }
        if (!body.fornecedor_id) {
          return reply.status(400).send({ erro: 'fornecedor_id obrigatório para admin' })
        }
        // Verificar que o fornecedor existe
        const { rows: [forn] } = await servidor.db.query(
          `SELECT id FROM fornecedores WHERE id = $1`,
          [body.fornecedor_id]
        )
        if (!forn) return reply.status(404).send({ erro: 'Fornecedor não encontrado' })
        fornecedorId = body.fornecedor_id
      } else if (req.usuarioPerfil === 'fornecedor') {
        fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      } else {
        return reply.status(403).send({ erro: 'Sem permissão' })
      }

      const dados = schemaCriarPeca.parse(req.body)
      const peca = await criarPecaServico(servidor.db, fornecedorId, dados)
      reply.status(201)
      return peca
    }
  )

  // GET /admin/pecas — listar todas as peças (admin)
  servidor.get(
    '/admin/pecas',
    { preHandler: [servidor.apenasAdmin] },
    async (req) => {
      const fornecedorId = (req.query as { fornecedor_id?: string }).fornecedor_id
      return listarTodasPecasAdmin(servidor.db, fornecedorId)
    }
  )

  // GET /admin/fornecedores-lista — lista simples para dropdown
  servidor.get(
    '/admin/fornecedores-lista',
    { preHandler: [servidor.apenasAdmin] },
    async () => {
      const { rows } = await servidor.db.query(
        `SELECT f.id, u.nome FROM fornecedores f JOIN usuarios u ON u.id = f.usuario_id WHERE f.suspenso = false ORDER BY u.nome`
      )
      return rows
    }
  )

  // PUT /pecas/:id — editar peça (fornecedor dono)
  servidor.put<{ Params: { id: string } }>(
    '/pecas/:id',
    { preHandler: [servidor.apenasFornecedor] },
    async (req) => {
      const dados = schemaEditarPeca.parse(req.body)
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      return editarPecaServico(servidor.db, req.params.id, fornecedorId, dados)
    }
  )

  // DELETE /pecas/:id — remover peça (fornecedor dono ou admin)
  servidor.delete<{ Params: { id: string } }>(
    '/pecas/:id',
    { preHandler: [servidor.verificarToken] },
    async (req) => {
      const perfil = req.usuarioPerfil
      const fornecedorId = perfil !== 'admin'
        ? await obterFornecedorId(servidor.db, req.usuarioId)
        : ''
      return removerPecaServico(servidor.db, req.params.id, fornecedorId, perfil)
    }
  )

  // GET /categorias — listagem pública de categorias
  servidor.get('/categorias', async () => {
    const { rows } = await servidor.db.query(
      'SELECT id, nome, slug, descricao, pai_id, icone_url FROM categorias WHERE ativa = true ORDER BY ordem, nome'
    )
    return rows
  })
}
