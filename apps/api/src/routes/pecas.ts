import { FastifyInstance } from 'fastify'
import { schemaCriarPeca, schemaEditarPeca, schemaFiltrosPecas } from '../schemas/pecas'
import {
  criarPecaServico, listarPecasServico, obterPecaServico,
  editarPecaServico, removerPecaServico, pecasFornecedorServico,
  obterFornecedorId,
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

  // POST /pecas — criar peça (fornecedor)
  servidor.post(
    '/pecas',
    { preHandler: [servidor.apenasFornecedor] },
    async (req, reply) => {
      const dados = schemaCriarPeca.parse(req.body)
      const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
      const peca = await criarPecaServico(servidor.db, fornecedorId, dados)
      reply.status(201)
      return peca
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
