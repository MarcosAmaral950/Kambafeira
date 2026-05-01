import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

// Carrega o .env da raiz do monorepo
config({ path: join(__dirname, '../../../../.env') })

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function aplicarSchema() {
  const sql = readFileSync(join(__dirname, '../../migrations/001_schema_inicial.sql'), 'utf-8')
  console.log('A aplicar schema na base de dados...')
  await db.query(sql)
  console.log('Schema aplicado com sucesso.')
  await db.end()
}

aplicarSchema().catch((erro) => {
  console.error('Erro ao aplicar schema:', erro)
  process.exit(1)
})
