-- ============================================================
-- KambaFeira — Schema PostgreSQL Completo
-- 15 tabelas | versão 1.0 | 2026
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- GRUPO 1: AUTENTICAÇÃO
-- ============================================================

-- Tabela central de utilizadores (todos os perfis)
CREATE TABLE usuarios (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    perfil        VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'fornecedor', 'comprador')),
    nome          VARCHAR(255) NOT NULL,
    telefone      VARCHAR(30),
    ativo         BOOLEAN NOT NULL DEFAULT true,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- Chaves de convite para registo de fornecedores
CREATE TABLE chaves_acesso (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave         VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    tipo          VARCHAR(20) NOT NULL DEFAULT 'fornecedor' CHECK (tipo IN ('fornecedor', 'admin')),
    criada_por    UUID NOT NULL REFERENCES usuarios(id),
    usada_por     UUID REFERENCES usuarios(id),
    usada_em      TIMESTAMPTZ,
    expira_em     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    ativa         BOOLEAN NOT NULL DEFAULT true,
    criada_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chaves_chave ON chaves_acesso(chave);
CREATE INDEX idx_chaves_ativa ON chaves_acesso(ativa, expira_em);

-- Sessões activas (para revogação de tokens)
CREATE TABLE sessoes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash    TEXT NOT NULL UNIQUE,
    ip_address    INET,
    user_agent    TEXT,
    expira_em     TIMESTAMPTZ NOT NULL,
    criada_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_token ON sessoes(token_hash);

-- ============================================================
-- GRUPO 2: FORNECEDORES
-- ============================================================

-- Perfil alargado do fornecedor (além do registo base em usuarios)
CREATE TABLE fornecedores (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id        UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_empresa      VARCHAR(255),
    nif               VARCHAR(30),
    tipo              VARCHAR(30) NOT NULL DEFAULT 'independente'
                        CHECK (tipo IN ('independente', 'desmanche', 'stand', 'empresa')),
    descricao         TEXT,
    foto_perfil_url   TEXT,
    provincia         VARCHAR(100) NOT NULL DEFAULT 'Luanda',
    municipio         VARCHAR(100),
    bairro            VARCHAR(150),
    referencia_local  TEXT,
    whatsapp          VARCHAR(30),
    avaliacao_media   NUMERIC(3,2) DEFAULT 0,
    total_avaliacoes  INTEGER DEFAULT 0,
    total_vendas      INTEGER DEFAULT 0,
    verificado        BOOLEAN NOT NULL DEFAULT false,
    suspenso          BOOLEAN NOT NULL DEFAULT false,
    motivo_suspensao  TEXT,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_usuario ON fornecedores(usuario_id);
CREATE INDEX idx_fornecedores_verificado ON fornecedores(verificado);

-- Contratos / acordos com fornecedores
CREATE TABLE contratos (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fornecedor_id    UUID NOT NULL REFERENCES fornecedores(id),
    taxa_comissao    NUMERIC(5,2) NOT NULL DEFAULT 10.00
                       CHECK (taxa_comissao BETWEEN 8.00 AND 12.00),
    data_inicio      DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim         DATE,
    ativo            BOOLEAN NOT NULL DEFAULT true,
    observacoes      TEXT,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GRUPO 3: CATÁLOGO
-- ============================================================

-- Categorias de peças (hierárquica: categoria → subcategoria)
CREATE TABLE categorias (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    descricao   TEXT,
    pai_id      UUID REFERENCES categorias(id),
    icone_url   TEXT,
    ordem       INTEGER DEFAULT 0,
    ativa       BOOLEAN NOT NULL DEFAULT true,
    criada_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categorias (nome, slug) VALUES
    ('Motor e Transmissão', 'motor-transmissao'),
    ('Suspensão e Direcção', 'suspensao-direccao'),
    ('Travagem', 'travagem'),
    ('Carroçaria e Vidros', 'carrocaria-vidros'),
    ('Electricidade e Electrónica', 'electricidade-electronica'),
    ('Ar Condicionado', 'ar-condicionado'),
    ('Escape e Combustível', 'escape-combustivel'),
    ('Acessórios e Interior', 'acessorios-interior');

-- Peças publicadas pelos fornecedores
CREATE TABLE pecas (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fornecedor_id     UUID NOT NULL REFERENCES fornecedores(id),
    categoria_id      UUID NOT NULL REFERENCES categorias(id),
    titulo            VARCHAR(255) NOT NULL,
    descricao         TEXT NOT NULL,
    preco             NUMERIC(12,2) NOT NULL CHECK (preco > 0),
    condicao          VARCHAR(20) NOT NULL CHECK (condicao IN ('novo', 'bom', 'regular', 'para_pecas')),
    marca_veiculo     VARCHAR(100),
    modelo_veiculo    VARCHAR(100),
    ano_veiculo_de    SMALLINT,
    ano_veiculo_ate   SMALLINT,
    numero_parte      VARCHAR(100),
    fotos             TEXT[] NOT NULL DEFAULT '{}',   -- array de URLs Cloudinary
    foto_principal    TEXT,
    estoque           INTEGER NOT NULL DEFAULT 1 CHECK (estoque >= 0),
    status            VARCHAR(20) NOT NULL DEFAULT 'rascunho'
                        CHECK (status IN ('rascunho', 'activo', 'vendido', 'suspenso', 'removido')),
    visualizacoes     INTEGER DEFAULT 0,
    publicada_em      TIMESTAMPTZ,
    criada_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizada_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pecas_fornecedor ON pecas(fornecedor_id);
CREATE INDEX idx_pecas_categoria ON pecas(categoria_id);
CREATE INDEX idx_pecas_status ON pecas(status);
CREATE INDEX idx_pecas_preco ON pecas(preco);
CREATE INDEX idx_pecas_marca ON pecas(marca_veiculo);

-- Pesquisa full-text em português
CREATE INDEX idx_pecas_fts ON pecas
    USING gin(to_tsvector('portuguese', titulo || ' ' || descricao));

-- ============================================================
-- GRUPO 4: COMERCIAL
-- ============================================================

-- Vendas / Pedidos
CREATE TABLE vendas (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    peca_id          UUID NOT NULL REFERENCES pecas(id),
    fornecedor_id    UUID NOT NULL REFERENCES fornecedores(id),
    comprador_id     UUID NOT NULL REFERENCES usuarios(id),
    quantidade       INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario   NUMERIC(12,2) NOT NULL,
    preco_total      NUMERIC(12,2) NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'pendente'
                       CHECK (status IN (
                           'pendente',        -- aguarda confirmação do fornecedor
                           'confirmado',      -- fornecedor confirmou
                           'pago',            -- pagamento recebido
                           'em_preparacao',   -- a preparar para envio
                           'enviado',         -- entregue à transportadora
                           'entregue',        -- comprador recebeu
                           'cancelado',       -- cancelado por qualquer parte
                           'dispute'          -- em disputa
                       )),
    metodo_pagamento VARCHAR(50),
    notas_comprador  TEXT,
    notas_fornecedor TEXT,
    cancelado_por    VARCHAR(20) CHECK (cancelado_por IN ('comprador', 'fornecedor', 'admin')),
    motivo_cancelamento TEXT,
    criada_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizada_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendas_peca ON vendas(peca_id);
CREATE INDEX idx_vendas_fornecedor ON vendas(fornecedor_id);
CREATE INDEX idx_vendas_comprador ON vendas(comprador_id);
CREATE INDEX idx_vendas_status ON vendas(status);

-- Comissões calculadas sobre cada venda
CREATE TABLE comissoes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id        UUID NOT NULL UNIQUE REFERENCES vendas(id),
    fornecedor_id   UUID NOT NULL REFERENCES fornecedores(id),
    valor_venda     NUMERIC(12,2) NOT NULL,
    taxa_aplicada   NUMERIC(5,2) NOT NULL,
    valor_comissao  NUMERIC(12,2) NOT NULL,
    valor_liquido   NUMERIC(12,2) NOT NULL,  -- valor_venda - valor_comissao
    status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente', 'pago', 'retido')),
    pago_em         TIMESTAMPTZ,
    criada_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comissoes_fornecedor ON comissoes(fornecedor_id);
CREATE INDEX idx_comissoes_status ON comissoes(status);

-- Avaliações dos compradores sobre os fornecedores
CREATE TABLE avaliacoes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id        UUID NOT NULL UNIQUE REFERENCES vendas(id),
    comprador_id    UUID NOT NULL REFERENCES usuarios(id),
    fornecedor_id   UUID NOT NULL REFERENCES fornecedores(id),
    nota            SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario      TEXT,
    resposta        TEXT,    -- resposta do fornecedor
    publicada       BOOLEAN NOT NULL DEFAULT true,
    criada_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_fornecedor ON avaliacoes(fornecedor_id);

-- Trigger para actualizar avaliacao_media no fornecedor
CREATE OR REPLACE FUNCTION atualizar_media_avaliacoes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE fornecedores
    SET avaliacao_media = (
            SELECT ROUND(AVG(nota)::NUMERIC, 2)
            FROM avaliacoes
            WHERE fornecedor_id = NEW.fornecedor_id AND publicada = true
        ),
        total_avaliacoes = (
            SELECT COUNT(*) FROM avaliacoes
            WHERE fornecedor_id = NEW.fornecedor_id AND publicada = true
        )
    WHERE id = NEW.fornecedor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_media_avaliacoes
AFTER INSERT OR UPDATE ON avaliacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_media_avaliacoes();

-- ============================================================
-- GRUPO 5: LOGÍSTICA
-- ============================================================

-- Transportadoras parceiras
CREATE TABLE transportadoras (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome        VARCHAR(255) NOT NULL,
    contato     VARCHAR(255),
    telefone    VARCHAR(30),
    whatsapp    VARCHAR(30),
    ativa       BOOLEAN NOT NULL DEFAULT true,
    criada_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zonas de entrega e cobertura
CREATE TABLE zonas_entrega (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportadora_id UUID NOT NULL REFERENCES transportadoras(id),
    provincia         VARCHAR(100) NOT NULL,
    municipio         VARCHAR(100),
    bairro            VARCHAR(150),
    ativa             BOOLEAN NOT NULL DEFAULT true
);

-- Endereços de entrega dos compradores
CREATE TABLE enderecos_entrega (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome          VARCHAR(100) NOT NULL DEFAULT 'Casa',
    provincia     VARCHAR(100) NOT NULL,
    municipio     VARCHAR(100) NOT NULL,
    bairro        VARCHAR(150) NOT NULL,
    referencia    TEXT,
    telefone      VARCHAR(30),
    principal     BOOLEAN NOT NULL DEFAULT false,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enderecos_usuario ON enderecos_entrega(usuario_id);

-- Fretes associados a cada venda
CREATE TABLE fretes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id            UUID NOT NULL UNIQUE REFERENCES vendas(id),
    transportadora_id   UUID REFERENCES transportadoras(id),
    endereco_id         UUID REFERENCES enderecos_entrega(id),
    valor_frete         NUMERIC(12,2),
    codigo_rastreio     VARCHAR(100),
    status              VARCHAR(30) NOT NULL DEFAULT 'pendente'
                          CHECK (status IN (
                              'pendente', 'recolhido', 'em_transito',
                              'saiu_para_entrega', 'entregue', 'falhou'
                          )),
    previsao_entrega    DATE,
    entregue_em         TIMESTAMPTZ,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GRUPO 6: SAC
-- ============================================================

-- Tickets de suporte ao cliente
CREATE TABLE tickets_sac (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    venda_id        UUID REFERENCES vendas(id),
    assunto         VARCHAR(255) NOT NULL,
    descricao       TEXT NOT NULL,
    tipo            VARCHAR(30) NOT NULL DEFAULT 'geral'
                      CHECK (tipo IN (
                          'geral', 'venda', 'entrega', 'pagamento',
                          'fornecedor', 'tecnico', 'outro'
                      )),
    prioridade      VARCHAR(10) NOT NULL DEFAULT 'normal'
                      CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    status          VARCHAR(20) NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto', 'em_atendimento', 'aguarda_usuario', 'resolvido', 'fechado')),
    atribuido_a     UUID REFERENCES usuarios(id),  -- admin responsável
    resposta        TEXT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolvido_em    TIMESTAMPTZ
);

CREATE INDEX idx_tickets_usuario ON tickets_sac(usuario_id);
CREATE INDEX idx_tickets_status ON tickets_sac(status);
CREATE INDEX idx_tickets_atribuido ON tickets_sac(atribuido_a);

-- ============================================================
-- TRIGGERS DE atualizado_em
-- ============================================================

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_upd         BEFORE UPDATE ON usuarios         FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_fornecedores_upd     BEFORE UPDATE ON fornecedores     FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_pecas_upd            BEFORE UPDATE ON pecas            FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_vendas_upd           BEFORE UPDATE ON vendas           FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_fretes_upd           BEFORE UPDATE ON fretes           FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_tickets_upd          BEFORE UPDATE ON tickets_sac      FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ============================================================
-- SEED INICIAL: 3 admins e categorias
-- ============================================================

-- Os passwords devem ser substituídos por hashes reais no primeiro deploy
-- Usar: SELECT crypt('password', gen_salt('bf', 12));

INSERT INTO usuarios (email, password_hash, perfil, nome) VALUES
    ('admin1@kambafeira.ao', 'SUBSTITUIR_POR_HASH', 'admin', 'Admin Angola 1'),
    ('admin2@kambafeira.ao', 'SUBSTITUIR_POR_HASH', 'admin', 'Admin Angola 2'),
    ('admin3@kambafeira.ao', 'SUBSTITUIR_POR_HASH', 'admin', 'Admin Brasil');
