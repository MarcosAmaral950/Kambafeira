import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const schemaTransportadora = z.object({
  nome: z.string().min(2).max(255),
  contato: z.string().max(255).optional(),
  telefone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  ativa: z.boolean().optional(),
})

const schemaZona = z.object({
  provincia_origem: z.string().max(100).default('Luanda'),
  provincia_destino: z.string().max(100),
  preco_base: z.number().min(0),
  preco_por_kg: z.number().min(0),
  preco_por_km: z.number().min(0),
  distancia_km: z.number().int().min(0),
  ativa: z.boolean().optional(),
})

export async function rotasTransportadoras(servidor: FastifyInstance) {

  // GET /transportadoras — lista pública para checkout
  servidor.get('/transportadoras', async () => {
    const { rows } = await servidor.db.query(
      `SELECT t.id, t.nome, t.telefone, t.whatsapp,
              json_agg(z ORDER BY z.provincia_destino) AS zonas
       FROM transportadoras t
       LEFT JOIN zonas_entrega z ON z.transportadora_id = t.id AND z.ativa = true
       WHERE t.ativa = true
       GROUP BY t.id
       ORDER BY t.nome`
    )
    return rows
  })

  // GET /transportadoras/calcular — calcula frete
  // Query params: transportadora_id, provincia_origem, provincia_destino, peso_kg
  servidor.get('/transportadoras/calcular', async (req, reply) => {
    const { transportadora_id, provincia_origem, provincia_destino, peso_kg } = req.query as Record<string, string>
    if (!transportadora_id || !provincia_destino || !peso_kg) {
      return reply.status(400).send({ erro: 'Parâmetros obrigatórios: transportadora_id, provincia_destino, peso_kg' })
    }
    const origem = provincia_origem ?? 'Luanda'
    const { rows: [zona] } = await servidor.db.query(
      `SELECT * FROM zonas_entrega
       WHERE transportadora_id = $1
         AND provincia_origem = $2
         AND provincia_destino = $3
         AND ativa = true
       LIMIT 1`,
      [transportadora_id, origem, provincia_destino]
    )
    if (!zona) return reply.status(404).send({ erro: 'Zona de entrega não disponível para este destino' })
    const peso = parseFloat(peso_kg)
    const valor = parseFloat(zona.preco_base) + (peso * parseFloat(zona.preco_por_kg)) + (zona.distancia_km * parseFloat(zona.preco_por_km))
    return { zona, valor_frete: Math.round(valor * 100) / 100, peso_kg: peso }
  })

  // ── Admin ──────────────────────────────────────────────────

  // GET /admin/transportadoras
  servidor.get('/admin/transportadoras', { preHandler: [servidor.apenasAdmin] }, async () => {
    const { rows } = await servidor.db.query(
      `SELECT t.*,
              COALESCE(json_agg(z ORDER BY z.provincia_destino) FILTER (WHERE z.id IS NOT NULL), '[]') AS zonas
       FROM transportadoras t
       LEFT JOIN zonas_entrega z ON z.transportadora_id = t.id
       GROUP BY t.id
       ORDER BY t.criada_em DESC`
    )
    return rows
  })

  // POST /admin/transportadoras
  servidor.post('/admin/transportadoras', { preHandler: [servidor.apenasAdmin] }, async (req, reply) => {
    const dados = schemaTransportadora.parse(req.body)
    const { rows: [t] } = await servidor.db.query(
      `INSERT INTO transportadoras (nome, contato, telefone, whatsapp)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dados.nome, dados.contato ?? null, dados.telefone ?? null, dados.whatsapp ?? null]
    )
    reply.status(201)
    return t
  })

  // PUT /admin/transportadoras/:id
  servidor.put<{ Params: { id: string } }>(
    '/admin/transportadoras/:id', { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const dados = schemaTransportadora.parse(req.body)
      const { rows: [t] } = await servidor.db.query(
        `UPDATE transportadoras SET nome=$1, contato=$2, telefone=$3, whatsapp=$4, ativa=$5
         WHERE id=$6 RETURNING *`,
        [dados.nome, dados.contato ?? null, dados.telefone ?? null, dados.whatsapp ?? null, dados.ativa ?? true, req.params.id]
      )
      if (!t) return reply.status(404).send({ erro: 'Transportadora não encontrada' })
      return t
    }
  )

  // POST /admin/transportadoras/:id/zonas
  servidor.post<{ Params: { id: string } }>(
    '/admin/transportadoras/:id/zonas', { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const dados = schemaZona.parse(req.body)
      const { rows: [z] } = await servidor.db.query(
        `INSERT INTO zonas_entrega (transportadora_id, provincia_origem, provincia_destino, preco_base, preco_por_kg, preco_por_km, distancia_km)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.params.id, dados.provincia_origem, dados.provincia_destino, dados.preco_base, dados.preco_por_kg, dados.preco_por_km, dados.distancia_km]
      )
      reply.status(201)
      return z
    }
  )

  // PUT /admin/zonas/:id
  servidor.put<{ Params: { id: string } }>(
    '/admin/zonas/:id', { preHandler: [servidor.apenasAdmin] },
    async (req, reply) => {
      const dados = schemaZona.parse(req.body)
      const { rows: [z] } = await servidor.db.query(
        `UPDATE zonas_entrega SET provincia_origem=$1, provincia_destino=$2, preco_base=$3, preco_por_kg=$4, preco_por_km=$5, distancia_km=$6, ativa=$7
         WHERE id=$8 RETURNING *`,
        [dados.provincia_origem, dados.provincia_destino, dados.preco_base, dados.preco_por_kg, dados.preco_por_km, dados.distancia_km, dados.ativa ?? true, req.params.id]
      )
      if (!z) return reply.status(404).send({ erro: 'Zona não encontrada' })
      return z
    }
  )

  // DELETE /admin/zonas/:id
  servidor.delete<{ Params: { id: string } }>(
    '/admin/zonas/:id', { preHandler: [servidor.apenasAdmin] },
    async (req) => {
      await servidor.db.query('DELETE FROM zonas_entrega WHERE id=$1', [req.params.id])
      return { mensagem: 'Zona removida' }
    }
  )
}
