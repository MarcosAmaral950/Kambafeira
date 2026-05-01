-- Migração: tabela de movimentos de estoque
-- Regista todos os movimentos de stock das peças (vendas, ajustes, danos, etc.)

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

CREATE INDEX IF NOT EXISTS idx_movimentos_peca       ON movimentos_estoque(peca_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_fornecedor ON movimentos_estoque(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_venda      ON movimentos_estoque(venda_id);
