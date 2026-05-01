import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { obterFornecedorId } from '../services/pecas'

const schemaCriarFrete = z.object({
  venda_id: z.string().uuid(),
  transportadora_id: z.string().uuid(),
  zona_id: z.string().uuid(),
  peso_kg: z.number().min(0.1),
  provincia_destino: z.string().max(100),
  municipio_destino: z.string().max(100),
  bairro_destino: z.string().max(150),
  referencia_destino: z.string().max(500).optional(),
  telefone_destino: z.string().max(30).optional(),
  guardar_endereco: z.boolean().optional(),
})

const schemaAtualizarFrete = z.object({
  status: z.enum(['pendente','recolhido','em_transito','saiu_para_entrega','entregue','falhou']).optional(),
  codigo_rastreio: z.string().max(100).optional(),
  previsao_entrega: z.string().optional(),
  notas: z.string().max(1000).optional(),
})

const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente',
  recolhido: 'Recolhido',
  em_transito: 'Em trânsito',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  falhou: 'Falhou',
}

export async function rotasFretes(servidor: FastifyInstance) {

  // POST /fretes — comprador cria frete após pedido
  servidor.post('/fretes', { preHandler: [servidor.verificarToken] }, async (req, reply) => {
    const dados = schemaCriarFrete.parse(req.body)

    // Verificar que a venda pertence ao comprador
    const { rows: [venda] } = await servidor.db.query(
      `SELECT v.id, v.comprador_id, v.fornecedor_id, p.titulo
       FROM vendas v JOIN pecas p ON v.peca_id = p.id WHERE v.id = $1`,
      [dados.venda_id]
    )
    if (!venda) return reply.status(404).send({ erro: 'Pedido não encontrado' })
    if (req.usuarioPerfil !== 'admin' && venda.comprador_id !== req.usuarioId) {
      return reply.status(403).send({ erro: 'Sem permissão' })
    }

    // Verificar que não existe já um frete
    const { rows: [existente] } = await servidor.db.query(
      'SELECT id FROM fretes WHERE venda_id = $1', [dados.venda_id]
    )
    if (existente) return reply.status(409).send({ erro: 'Este pedido já tem um frete associado' })

    // Calcular frete
    const { rows: [zona] } = await servidor.db.query(
      'SELECT * FROM zonas_entrega WHERE id = $1', [dados.zona_id]
    )
    if (!zona) return reply.status(404).send({ erro: 'Zona não encontrada' })

    const valorFrete = parseFloat(zona.preco_base)
      + (dados.peso_kg * parseFloat(zona.preco_por_kg))
      + (zona.distancia_km * parseFloat(zona.preco_por_km))

    const enderecoTexto = `${dados.bairro_destino}, ${dados.municipio_destino}, ${dados.provincia_destino}`

    // Guardar endereço se solicitado
    let enderecoId: string | null = null
    if (dados.guardar_endereco) {
      const { rows: [end] } = await servidor.db.query(
        `INSERT INTO enderecos_entrega (usuario_id, provincia, municipio, bairro, referencia, telefone)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [req.usuarioId, dados.provincia_destino, dados.municipio_destino, dados.bairro_destino,
         dados.referencia_destino ?? null, dados.telefone_destino ?? null]
      )
      enderecoId = end.id as string
    }

    const { rows: [frete] } = await servidor.db.query(
      `INSERT INTO fretes (venda_id, transportadora_id, zona_id, endereco_id, endereco_texto, peso_kg, distancia_km, valor_frete)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [dados.venda_id, dados.transportadora_id, dados.zona_id, enderecoId,
       enderecoTexto, dados.peso_kg, zona.distancia_km, Math.round(valorFrete * 100) / 100]
    )

    reply.status(201)
    return { ...frete, label_status: LABEL_STATUS[frete.status as string] }
  })

  // GET /fretes/meus — fretes do comprador
  servidor.get('/fretes/meus', { preHandler: [servidor.verificarToken] }, async (req) => {
    const { rows } = await servidor.db.query(
      `SELECT f.*, t.nome AS transportadora_nome, p.titulo AS peca_titulo
       FROM fretes f
       JOIN vendas v ON f.venda_id = v.id
       JOIN pecas p ON v.peca_id = p.id
       JOIN transportadoras t ON f.transportadora_id = t.id
       WHERE v.comprador_id = $1
       ORDER BY f.criado_em DESC`,
      [req.usuarioId]
    )
    return rows.map(r => ({ ...r, label_status: LABEL_STATUS[r.status as string] }))
  })

  // GET /fretes/:id — detalhe
  servidor.get<{ Params: { id: string } }>(
    '/fretes/:id', { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const { rows: [frete] } = await servidor.db.query(
        `SELECT f.*, t.nome AS transportadora_nome, t.telefone AS transportadora_telefone,
                t.whatsapp AS transportadora_whatsapp, p.titulo AS peca_titulo,
                uc.nome AS comprador_nome
         FROM fretes f
         JOIN vendas v ON f.venda_id = v.id
         JOIN pecas p ON v.peca_id = p.id
         JOIN transportadoras t ON f.transportadora_id = t.id
         JOIN usuarios uc ON v.comprador_id = uc.id
         WHERE f.id = $1`,
        [req.params.id]
      )
      if (!frete) return reply.status(404).send({ erro: 'Frete não encontrado' })
      return { ...frete, label_status: LABEL_STATUS[frete.status as string] }
    }
  )

  // GET /fornecedor/fretes — fretes do fornecedor
  servidor.get('/fornecedor/fretes', { preHandler: [servidor.apenasFornecedor] }, async (req) => {
    const fornecedorId = await obterFornecedorId(servidor.db, req.usuarioId)
    const { rows } = await servidor.db.query(
      `SELECT f.*, t.nome AS transportadora_nome, p.titulo AS peca_titulo,
              uc.nome AS comprador_nome, uc.telefone AS comprador_telefone
       FROM fretes f
       JOIN vendas v ON f.venda_id = v.id
       JOIN pecas p ON v.peca_id = p.id
       JOIN transportadoras t ON f.transportadora_id = t.id
       JOIN usuarios uc ON v.comprador_id = uc.id
       WHERE v.fornecedor_id = $1
       ORDER BY f.criado_em DESC`,
      [fornecedorId]
    )
    return rows.map(r => ({ ...r, label_status: LABEL_STATUS[r.status as string] }))
  })

  // GET /admin/fretes
  servidor.get('/admin/fretes', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT f.*, t.nome AS transportadora_nome, p.titulo AS peca_titulo,
              uc.nome AS comprador_nome, uf.nome AS fornecedor_nome
       FROM fretes f
       JOIN vendas v ON f.venda_id = v.id
       JOIN pecas p ON v.peca_id = p.id
       JOIN transportadoras t ON f.transportadora_id = t.id
       JOIN usuarios uc ON v.comprador_id = uc.id
       JOIN fornecedores fo ON v.fornecedor_id = fo.id
       JOIN usuarios uf ON fo.usuario_id = uf.id
       ORDER BY f.criado_em DESC
       LIMIT 200`
    )
    return rows.map(r => ({ ...r, label_status: LABEL_STATUS[r.status as string] }))
  })

  // PUT /fretes/:id — atualizar rastreio/status (fornecedor ou admin)
  servidor.put<{ Params: { id: string } }>(
    '/fretes/:id', { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      const dados = schemaAtualizarFrete.parse(req.body)
      if (req.usuarioPerfil === 'comprador') return reply.status(403).send({ erro: 'Sem permissão' })

      const { rows: [frete] } = await servidor.db.query(
        `UPDATE fretes
         SET status           = COALESCE($1, status),
             codigo_rastreio  = COALESCE($2, codigo_rastreio),
             previsao_entrega = COALESCE($3::date, previsao_entrega),
             notas            = COALESCE($4, notas),
             entregue_em      = CASE WHEN $1 = 'entregue' THEN NOW() ELSE entregue_em END,
             atualizado_em    = NOW()
         WHERE id = $5 RETURNING *`,
        [dados.status ?? null, dados.codigo_rastreio ?? null,
         dados.previsao_entrega ?? null, dados.notas ?? null, req.params.id]
      )
      if (!frete) return reply.status(404).send({ erro: 'Frete não encontrado' })
      return { ...frete, label_status: LABEL_STATUS[frete.status as string] }
    }
  )
}
