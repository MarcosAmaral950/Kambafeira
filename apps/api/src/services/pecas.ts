import { Pool } from 'pg'
import type { CriarPecaInput, EditarPecaInput, FiltrosPecasInput, AtualizarEstoqueInput } from '../schemas/pecas'

export async function obterFornecedorId(db: Pool, usuarioId: string): Promise<string> {
  const { rows } = await db.query(
    'SELECT id FROM fornecedores WHERE usuario_id = $1',
    [usuarioId]
  )
  if (!rows[0]) throw { statusCode: 403, message: 'Perfil de fornecedor não encontrado' }
  return rows[0].id
}

export async function criarPecaServico(db: Pool, fornecedorId: string, dados: CriarPecaInput) {
  const { rows } = await db.query(
    `INSERT INTO pecas
       (fornecedor_id, categoria_id, titulo, descricao, preco, condicao,
        marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate,
        numero_parte, fotos, foto_principal, estoque, status, publicada_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
       CASE WHEN $15 THEN 'activo' ELSE 'rascunho' END,
       CASE WHEN $15 THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      fornecedorId, dados.categoria_id, dados.titulo, dados.descricao,
      dados.preco, dados.condicao, dados.marca_veiculo ?? null,
      dados.modelo_veiculo ?? null, dados.ano_veiculo_de ?? null,
      dados.ano_veiculo_ate ?? null, dados.numero_parte ?? null,
      dados.fotos, dados.foto_principal ?? null, dados.estoque,
      dados.fotos.length > 0,
    ]
  )
  return rows[0]
}

export async function listarPecasServico(db: Pool, filtros: FiltrosPecasInput) {
  const condicoes: string[] = ["p.status = 'activo'"]
  const params: unknown[] = []
  let i = 1

  if (filtros.categoria) {
    condicoes.push(`c.slug = $${i++}`)
    params.push(filtros.categoria)
  }
  if (filtros.marca) {
    condicoes.push(`LOWER(p.marca_veiculo) LIKE $${i++}`)
    params.push(`%${filtros.marca.toLowerCase()}%`)
  }
  if (filtros.modelo) {
    condicoes.push(`LOWER(p.modelo_veiculo) LIKE $${i++}`)
    params.push(`%${filtros.modelo.toLowerCase()}%`)
  }
  if (filtros.condicao) {
    condicoes.push(`p.condicao = $${i++}`)
    params.push(filtros.condicao)
  }
  if (filtros.preco_min !== undefined) {
    condicoes.push(`p.preco >= $${i++}`)
    params.push(filtros.preco_min)
  }
  if (filtros.preco_max !== undefined) {
    condicoes.push(`p.preco <= $${i++}`)
    params.push(filtros.preco_max)
  }
  if (filtros.q) {
    condicoes.push(`to_tsvector('portuguese', p.titulo || ' ' || p.descricao) @@ plainto_tsquery('portuguese', $${i++})`)
    params.push(filtros.q)
  }

  const onde = condicoes.join(' AND ')
  const offset = (filtros.pagina - 1) * filtros.limite

  const [{ rows: pecas }, { rows: total }] = await Promise.all([
    db.query(
      `SELECT p.id, p.titulo, p.preco, p.condicao, p.foto_principal,
              p.marca_veiculo, p.modelo_veiculo, p.estoque, p.publicada_em,
              c.nome AS categoria, c.slug AS categoria_slug,
              f.id AS fornecedor_id,
              u.nome AS fornecedor_nome, f.provincia, f.avaliacao_media
       FROM pecas p
       JOIN categorias c ON c.id = p.categoria_id
       JOIN fornecedores f ON f.id = p.fornecedor_id
       JOIN usuarios u ON u.id = f.usuario_id
       WHERE ${onde}
       ORDER BY p.publicada_em DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, filtros.limite, offset]
    ),
    db.query(
      `SELECT COUNT(*) AS total FROM pecas p
       JOIN categorias c ON c.id = p.categoria_id
       WHERE ${onde}`,
      params
    ),
  ])

  return {
    pecas,
    total: Number(total[0].total),
    pagina: filtros.pagina,
    limite: filtros.limite,
    paginas: Math.ceil(Number(total[0].total) / filtros.limite),
  }
}

export async function obterPecaServico(db: Pool, id: string) {
  const { rows } = await db.query(
    `SELECT p.*,
            c.nome AS categoria, c.slug AS categoria_slug,
            u.nome AS fornecedor_nome, f.provincia, f.municipio,
            f.avaliacao_media, f.total_avaliacoes, f.whatsapp AS fornecedor_whatsapp
     FROM pecas p
     JOIN categorias c ON c.id = p.categoria_id
     JOIN fornecedores f ON f.id = p.fornecedor_id
     JOIN usuarios u ON u.id = f.usuario_id
     WHERE p.id = $1 AND p.status = 'activo'`,
    [id]
  )
  if (!rows[0]) throw { statusCode: 404, message: 'Peça não encontrada' }

  // Incrementar visualizações (sem await para não bloquear)
  db.query('UPDATE pecas SET visualizacoes = visualizacoes + 1 WHERE id = $1', [id])

  return rows[0]
}

export async function editarPecaServico(
  db: Pool, id: string, fornecedorId: string, dados: EditarPecaInput
) {
  // Verificar que a peça pertence ao fornecedor
  const { rows: existente } = await db.query(
    'SELECT id FROM pecas WHERE id = $1 AND fornecedor_id = $2',
    [id, fornecedorId]
  )
  if (!existente[0]) throw { statusCode: 404, message: 'Peça não encontrada' }

  const campos = Object.entries(dados)
    .filter(([, v]) => v !== undefined)
    .map(([k], idx) => `${k} = $${idx + 2}`)

  if (campos.length === 0) throw { statusCode: 400, message: 'Nenhum campo para actualizar' }

  const valores = Object.values(dados).filter(v => v !== undefined)

  const { rows } = await db.query(
    `UPDATE pecas SET ${campos.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  )
  return rows[0]
}

export async function removerPecaServico(
  db: Pool, id: string, fornecedorId: string, perfil: string
) {
  const condicao = perfil === 'admin'
    ? 'id = $1'
    : 'id = $1 AND fornecedor_id = $2'
  const params = perfil === 'admin' ? [id] : [id, fornecedorId]

  const { rows } = await db.query(
    `UPDATE pecas SET status = 'removido' WHERE ${condicao} RETURNING id`,
    params
  )
  if (!rows[0]) throw { statusCode: 404, message: 'Peça não encontrada' }
  return { mensagem: 'Peça removida com sucesso' }
}

export async function pecasFornecedorServico(db: Pool, fornecedorId: string) {
  const { rows } = await db.query(
    `SELECT p.id, p.titulo, p.preco, p.condicao, p.status,
            p.estoque, p.visualizacoes, p.foto_principal, p.criada_em
     FROM pecas p
     WHERE p.fornecedor_id = $1 AND p.status != 'removido'
     ORDER BY p.criada_em DESC`,
    [fornecedorId]
  )
  return rows
}

// Obter uma peça específica do fornecedor (qualquer status, excepto removido)
export async function obterPecaFornecedorServico(db: Pool, id: string, fornecedorId: string) {
  const { rows } = await db.query(
    `SELECT p.*,
            c.nome AS categoria, c.slug AS categoria_slug
     FROM pecas p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = $1 AND p.fornecedor_id = $2 AND p.status != 'removido'`,
    [id, fornecedorId]
  )
  if (!rows[0]) throw { statusCode: 404, message: 'Peça não encontrada' }
  return rows[0]
}

// Actualização rápida de estoque, preço e/ou status
export async function atualizarEstoqueServico(
  db: Pool, id: string, fornecedorId: string, dados: AtualizarEstoqueInput
) {
  // Verificar que a peça pertence ao fornecedor e não está removida
  const { rows: existente } = await db.query(
    "SELECT id FROM pecas WHERE id = $1 AND fornecedor_id = $2 AND status != 'removido'",
    [id, fornecedorId]
  )
  if (!existente[0]) throw { statusCode: 404, message: 'Peça não encontrada' }

  // Construir SET dinâmico apenas com os campos fornecidos
  const setCampos: string[] = []
  const valores: unknown[] = [id]
  let i = 2

  if (dados.estoque !== undefined) {
    setCampos.push(`estoque = $${i++}`)
    valores.push(dados.estoque)
  }
  if (dados.preco !== undefined) {
    setCampos.push(`preco = $${i++}`)
    valores.push(dados.preco)
  }
  if (dados.status !== undefined) {
    setCampos.push(`status = $${i++}`)
    valores.push(dados.status)
    // Se está a activar, definir publicada_em se ainda não estava definido
    if (dados.status === 'activo') {
      setCampos.push(`publicada_em = COALESCE(publicada_em, NOW())`)
    }
  }

  if (setCampos.length === 0) throw { statusCode: 400, message: 'Nenhum campo para actualizar' }

  const { rows } = await db.query(
    `UPDATE pecas SET ${setCampos.join(', ')} WHERE id = $1 RETURNING id, estoque, preco, status`,
    valores
  )
  return rows[0]
}
