/**
 * Seed inicial: cria os 3 admins com passwords reais via bcrypt.
 * Usar apenas no primeiro deploy ou para resetar base de dados de dev.
 *
 * Correr: npx tsx src/services/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const db = new Pool({ connectionString: process.env.DATABASE_URL })

const ADMINS = [
  { email: 'admin1@kambafeira.ao', nome: 'Admin Angola 1', password: process.env.ADMIN1_PASSWORD ?? 'troca_aqui_1' },
  { email: 'admin2@kambafeira.ao', nome: 'Admin Angola 2', password: process.env.ADMIN2_PASSWORD ?? 'troca_aqui_2' },
  { email: 'admin3@kambafeira.ao', nome: 'Admin Brasil',   password: process.env.ADMIN3_PASSWORD ?? 'troca_aqui_3' },
]

async function correrSeed() {
  for (const admin of ADMINS) {
    const hash = await bcrypt.hash(admin.password, 12)
    await db.query(
      `INSERT INTO usuarios (email, password_hash, perfil, nome)
       VALUES ($1, $2, 'admin', $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [admin.email, hash, admin.nome]
    )
    console.log(`Admin criado: ${admin.email}`)
  }
  await db.end()
  console.log('Seed concluído.')
}

correrSeed().catch(console.error)
