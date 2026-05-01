import { Pool } from 'pg'

const REGIOES = [
  'us-east-1',
  'eu-central-1',
  'ap-southeast-1',
  'us-west-1',
  'eu-west-1',
  'ap-northeast-1',
]

const ID = 'agsxepngoteeacejuzzp'
const PASS = 'Romeu%40100_Rita%40100'

async function testar() {
  for (const regiao of REGIOES) {
    const url = `postgresql://postgres.${ID}:${PASS}@aws-0-${regiao}.pooler.supabase.com:6543/postgres`
    const db = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 })
    try {
      const cliente = await db.connect()
      cliente.release()
      console.log(`ENCONTRADO: aws-0-${regiao}.pooler.supabase.com`)
      console.log(`DATABASE_URL=${url}`)
      await db.end()
      return
    } catch {
      console.log(`Falhou: ${regiao}`)
      await db.end()
    }
  }
  console.log('Nenhuma região encontrada.')
}

testar()
