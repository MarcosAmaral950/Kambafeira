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

  // Migração da Fase 3: logística e SAC
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transportadoras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        contato VARCHAR(255),
        telefone VARCHAR(30),
        whatsapp VARCHAR(30),
        ativa BOOLEAN NOT NULL DEFAULT true,
        criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS zonas_entrega (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transportadora_id UUID NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
        provincia_origem VARCHAR(100) NOT NULL DEFAULT 'Luanda',
        provincia_destino VARCHAR(100) NOT NULL,
        preco_base NUMERIC(12,2) NOT NULL DEFAULT 0,
        preco_por_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
        preco_por_km NUMERIC(8,2) NOT NULL DEFAULT 0,
        distancia_km INTEGER NOT NULL DEFAULT 0,
        ativa BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS enderecos_entrega (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL DEFAULT 'Casa',
        provincia VARCHAR(100) NOT NULL,
        municipio VARCHAR(100) NOT NULL,
        bairro VARCHAR(150) NOT NULL,
        referencia TEXT,
        telefone VARCHAR(30),
        principal BOOLEAN NOT NULL DEFAULT false,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_enderecos_usuario ON enderecos_entrega(usuario_id);

      CREATE TABLE IF NOT EXISTS fretes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id),
        transportadora_id UUID REFERENCES transportadoras(id),
        zona_id UUID REFERENCES zonas_entrega(id),
        endereco_id UUID REFERENCES enderecos_entrega(id),
        endereco_texto TEXT,
        peso_kg NUMERIC(8,2) NOT NULL DEFAULT 1,
        distancia_km INTEGER NOT NULL DEFAULT 0,
        valor_frete NUMERIC(12,2) NOT NULL DEFAULT 0,
        codigo_rastreio VARCHAR(100),
        status VARCHAR(30) NOT NULL DEFAULT 'pendente'
          CHECK (status IN ('pendente','recolhido','em_transito','saiu_para_entrega','entregue','falhou')),
        previsao_entrega DATE,
        entregue_em TIMESTAMPTZ,
        notas TEXT,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fretes_venda ON fretes(venda_id);
      CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status);

      CREATE TABLE IF NOT EXISTS tickets_sac (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        venda_id UUID REFERENCES vendas(id),
        assunto VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        tipo VARCHAR(30) NOT NULL DEFAULT 'geral'
          CHECK (tipo IN ('geral','venda','entrega','pagamento','fornecedor','tecnico','outro')),
        prioridade VARCHAR(10) NOT NULL DEFAULT 'normal'
          CHECK (prioridade IN ('baixa','normal','alta','urgente')),
        status VARCHAR(20) NOT NULL DEFAULT 'aberto'
          CHECK (status IN ('aberto','em_atendimento','aguarda_usuario','resolvido','fechado')),
        atribuido_a UUID REFERENCES usuarios(id),
        fotos TEXT[] NOT NULL DEFAULT '{}',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolvido_em TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_usuario ON tickets_sac(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets_sac(status);

      CREATE TABLE IF NOT EXISTS mensagens_sac (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets_sac(id) ON DELETE CASCADE,
        usuario_id UUID NOT NULL REFERENCES usuarios(id),
        mensagem TEXT NOT NULL,
        fotos TEXT[] NOT NULL DEFAULT '{}',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mensagens_ticket ON mensagens_sac(ticket_id);
    `)
    servidor.log.info('Migrações Fase 3 executadas')
  } catch (erroMigracaoFase3) {
    servidor.log.warn({ err: erroMigracaoFase3 }, 'Aviso nas migrações da Fase 3')
  }

  // Migração correctiva: colunas e triggers corrigidos após criação inicial
  try {
    await pool.query(`
      -- Colunas em falta em zonas_entrega (Phase 3 usa origem/destino)
      ALTER TABLE zonas_entrega
        ADD COLUMN IF NOT EXISTS provincia_origem  VARCHAR(100) NOT NULL DEFAULT 'Luanda',
        ADD COLUMN IF NOT EXISTS provincia_destino VARCHAR(100) NOT NULL DEFAULT 'Luanda',
        ADD COLUMN IF NOT EXISTS preco_base        NUMERIC(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS preco_por_kg      NUMERIC(8,2)  NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS preco_por_km      NUMERIC(8,2)  NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS distancia_km      INTEGER       NOT NULL DEFAULT 0;
      ALTER TABLE zonas_entrega
        ALTER COLUMN provincia DROP NOT NULL;

      -- Corrigir triggers: pecas e vendas usam atualizada_em (não atualizado_em)
      CREATE OR REPLACE FUNCTION set_atualizada_em()
      RETURNS TRIGGER AS $$
      BEGIN NEW.atualizada_em = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_pecas_upd  ON pecas;
      DROP TRIGGER IF EXISTS trg_vendas_upd ON vendas;

      CREATE TRIGGER trg_pecas_upd
        BEFORE UPDATE ON pecas
        FOR EACH ROW EXECUTE FUNCTION set_atualizada_em();

      CREATE TRIGGER trg_vendas_upd
        BEFORE UPDATE ON vendas
        FOR EACH ROW EXECUTE FUNCTION set_atualizada_em();
    `)
    servidor.log.info('Migrações correctivas executadas')
  } catch (erroCorrectiva) {
    servidor.log.warn({ err: erroCorrectiva }, 'Aviso nas migrações correctivas')
  }

  servidor.decorate('db', pool)

  servidor.addHook('onClose', async () => {
    await pool.end()
  })
}

export const pluginBancoDados = fp(pluginBancoDadosImpl, { name: 'banco-dados' })
