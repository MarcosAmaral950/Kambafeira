import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import type { LoginInput, RegistoCompradorInput, RegistoFornecedorInput } from '../schemas/auth'

export async function loginServico(db: Pool, dados: LoginInput) {
  const { rows } = await db.query(
    'SELECT id, email, password_hash, perfil, nome, ativo FROM usuarios WHERE email = $1',
    [dados.email]
  )
  const usuario = rows[0]

  if (!usuario) throw { statusCode: 401, message: 'Email ou password incorrectos' }
  if (!usuario.ativo) throw { statusCode: 403, message: 'Conta suspensa. Contacte o suporte.' }

  const passwordValida = await bcrypt.compare(dados.password, usuario.password_hash)
  if (!passwordValida) throw { statusCode: 401, message: 'Email ou password incorrectos' }

  return {
    id: usuario.id,
    email: usuario.email,
    perfil: usuario.perfil,
    nome: usuario.nome,
  }
}

export async function registoCompradorServico(db: Pool, dados: RegistoCompradorInput) {
  const { rows: existe } = await db.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [dados.email]
  )
  if (existe.length > 0) throw { statusCode: 409, message: 'Este email já está registado' }

  const hash = await bcrypt.hash(dados.password, 12)

  const { rows } = await db.query(
    `INSERT INTO usuarios (email, password_hash, perfil, nome, telefone)
     VALUES ($1, $2, 'comprador', $3, $4)
     RETURNING id, email, perfil, nome`,
    [dados.email, hash, dados.nome, dados.telefone ?? null]
  )

  return rows[0]
}

export async function registoFornecedorServico(db: Pool, dados: RegistoFornecedorInput) {
  // Verificar chave de convite
  const { rows: chaves } = await db.query(
    `SELECT id FROM chaves_acesso
     WHERE chave = $1 AND ativa = true AND usada_por IS NULL AND expira_em > NOW()`,
    [dados.chave_convite]
  )
  if (chaves.length === 0) {
    throw { statusCode: 400, message: 'Chave de convite inválida ou expirada' }
  }
  const chaveId = chaves[0].id

  // Verificar email duplicado
  const { rows: existe } = await db.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [dados.email]
  )
  if (existe.length > 0) throw { statusCode: 409, message: 'Este email já está registado' }

  const hash = await bcrypt.hash(dados.password, 12)

  // Transacção: criar usuario + fornecedor + marcar chave usada
  const cliente = await db.connect()
  try {
    await cliente.query('BEGIN')

    const { rows: usuarios } = await cliente.query(
      `INSERT INTO usuarios (email, password_hash, perfil, nome, telefone)
       VALUES ($1, $2, 'fornecedor', $3, $4)
       RETURNING id, email, perfil, nome`,
      [dados.email, hash, dados.nome, dados.telefone ?? null]
    )
    const usuario = usuarios[0]

    const { rows: fornecedores } = await cliente.query(
      `INSERT INTO fornecedores (usuario_id, nome_empresa, tipo, provincia, municipio, bairro, whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [usuario.id, dados.nome_empresa ?? null, dados.tipo, dados.provincia, dados.municipio ?? null, dados.bairro ?? null, dados.whatsapp ?? null]
    )

    // Contrato padrão com taxa de 10%
    await cliente.query(
      'INSERT INTO contratos (fornecedor_id) VALUES ($1)',
      [fornecedores[0].id]
    )

    // Marcar chave como usada
    await cliente.query(
      'UPDATE chaves_acesso SET usada_por = $1, usada_em = NOW(), ativa = false WHERE id = $2',
      [usuario.id, chaveId]
    )

    await cliente.query('COMMIT')
    return usuario
  } catch (erro) {
    await cliente.query('ROLLBACK')
    throw erro
  } finally {
    cliente.release()
  }
}
