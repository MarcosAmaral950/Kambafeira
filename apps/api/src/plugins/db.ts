import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Pool } from 'pg'

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool
  }
}

async function pluginBancoDadosImpl(servidor: FastifyInstance) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    client_encoding: 'UTF8',
  })

  // Testar ligação ao arrancar
  const cliente = await pool.connect()
  cliente.release()
  servidor.log.info('Ligação à base de dados estabelecida')

  // Executar migração da tabela de movimentos de estoque
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimentos_estoque (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        peca_id         UUID NOT NULL REFERENCES pecas(id),
        fornecedor_id   UUID NOT NULL REFERENCES fornecedores(id),
        tipo            VARCHAR(30) NOT NULL
                        CHECK (tipo IN ('venda_plataforma','venda_externa','stock_recebido','correcao','dano_perda','cancelamento')),
        quantidade_anterior  INTEGER NOT NULL,
        quantidade_nova      INTEGER NOT NULL,
        variacao             INTEGER NOT NULL,
        motivo          TEXT,
        venda_id        UUID REFERENCES vendas(id),
        criado_por      UUID REFERENCES usuarios(id),
        criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_movimentos_peca        ON movimentos_estoque(peca_id);
      CREATE INDEX IF NOT EXISTS idx_movimentos_fornecedor  ON movimentos_estoque(fornecedor_id);
      CREATE INDEX IF NOT EXISTS idx_movimentos_venda       ON movimentos_estoque(venda_id);
    `)
    servidor.log.info('Migrações executadas')
  } catch (erroMigracao) {
    servidor.log.warn({ err: erroMigracao }, 'Aviso na execução das migrações')
  }

  servidor.decorate('db', pool)

  servidor.addHook('onClose', async () => {
    await pool.end()
  })
}

export const pluginBancoDados = fp(pluginBancoDadosImpl, { name: 'banco-dados' })
