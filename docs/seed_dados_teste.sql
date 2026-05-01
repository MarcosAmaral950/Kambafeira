-- ============================================================
-- KambaFeira — Dados de Teste (Seed)
-- Password de todos os utilizadores: Teste@123
-- ============================================================

-- ============================================================
-- 1. ACTUALIZAR ADMINS (já criados pelo schema)
-- ============================================================

UPDATE usuarios SET
    password_hash = '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO',
    nome = 'Domingos Lopes',
    telefone = '+244 923 100 001'
WHERE email = 'admin1@kambafeira.ao';

UPDATE usuarios SET
    password_hash = '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO',
    nome = 'Conceição Neto',
    telefone = '+244 923 100 002'
WHERE email = 'admin2@kambafeira.ao';

UPDATE usuarios SET
    password_hash = '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO',
    nome = 'Rafael Costa',
    telefone = '+55 11 99999-0001'
WHERE email = 'admin3@kambafeira.ao';

-- ============================================================
-- 2. UTILIZADORES FORNECEDORES
-- ============================================================

INSERT INTO usuarios (id, email, password_hash, perfil, nome, telefone) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'autopeças.luanda@gmail.com',  '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'fornecedor', 'Manuel Sebastião',   '+244 924 200 001'),
    ('a1000000-0000-0000-0000-000000000002', 'desmanche.kilamba@gmail.com', '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'fornecedor', 'Augusto Fernandes',  '+244 924 200 002'),
    ('a1000000-0000-0000-0000-000000000003', 'stand.viana@gmail.com',       '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'fornecedor', 'Filomena Cardoso',   '+244 924 200 003');

-- ============================================================
-- 3. PERFIS DE FORNECEDOR
-- ============================================================

INSERT INTO fornecedores (id, usuario_id, nome_empresa, tipo, descricao, provincia, municipio, bairro, whatsapp, avaliacao_media, total_avaliacoes, total_vendas, verificado) VALUES
    (
        'b1000000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001',
        'AutoPeças Luanda Centro',
        'desmanche',
        'Especialistas em peças usadas de Toyota, Mitsubishi e Nissan. Mais de 15 anos no mercado. Todas as peças testadas antes da venda.',
        'Luanda', 'Ingombota', 'Bairro Operário',
        '+244 924 200 001',
        4.7, 23, 89, true
    ),
    (
        'b1000000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000002',
        'Desmanche Kilamba',
        'desmanche',
        'Maior desmanche do Kilamba. Stock permanente de Honda, Hyundai e KIA. Entrega em Luanda no próprio dia.',
        'Luanda', 'Kilamba Kiaxi', 'Kilamba',
        '+244 924 200 002',
        4.3, 15, 47, true
    ),
    (
        'b1000000-0000-0000-0000-000000000003',
        'a1000000-0000-0000-0000-000000000003',
        'Stand Viana Peças',
        'stand',
        'Stand de automóveis com secção de peças usadas. BMW, Mercedes e Volkswagen. Peças com 3 meses de garantia.',
        'Luanda', 'Viana', 'Zona Industrial Viana',
        '+244 924 200 003',
        4.9, 8, 31, true
    );

-- ============================================================
-- 4. CONTRATOS DOS FORNECEDORES
-- ============================================================

INSERT INTO contratos (fornecedor_id, taxa_comissao, ativo) VALUES
    ('b1000000-0000-0000-0000-000000000001', 10.00, true),
    ('b1000000-0000-0000-0000-000000000002', 10.00, true),
    ('b1000000-0000-0000-0000-000000000003',  8.00, true);

-- ============================================================
-- 5. UTILIZADORES COMPRADORES
-- ============================================================

INSERT INTO usuarios (id, email, password_hash, perfil, nome, telefone) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'joao.comprador@gmail.com',    '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'comprador', 'João Baptista',    '+244 926 300 001'),
    ('c1000000-0000-0000-0000-000000000002', 'maria.comprador@gmail.com',   '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'comprador', 'Maria da Graça',   '+244 926 300 002'),
    ('c1000000-0000-0000-0000-000000000003', 'carlos.comprador@gmail.com',  '$2b$10$tkYif8XgibuJgv9XR9I.quzHV9mxXBFQLYqRevXVZ1XNrceFeQErO', 'comprador', 'Carlos Muanda',    '+244 926 300 003');

-- ============================================================
-- 6. CHAVES DE ACESSO (para testar registo de fornecedor)
-- ============================================================

-- Buscar o ID de admin1 para as chaves
INSERT INTO chaves_acesso (chave, tipo, criada_por, ativa, expira_em)
SELECT
    'KAMBA-TESTE-001',
    'fornecedor',
    id,
    true,
    NOW() + INTERVAL '90 days'
FROM usuarios WHERE email = 'admin1@kambafeira.ao';

INSERT INTO chaves_acesso (chave, tipo, criada_por, ativa, expira_em)
SELECT
    'KAMBA-TESTE-002',
    'fornecedor',
    id,
    true,
    NOW() + INTERVAL '90 days'
FROM usuarios WHERE email = 'admin1@kambafeira.ao';

INSERT INTO chaves_acesso (chave, tipo, criada_por, ativa, expira_em)
SELECT
    'KAMBA-TESTE-003',
    'fornecedor',
    id,
    true,
    NOW() + INTERVAL '90 days'
FROM usuarios WHERE email = 'admin1@kambafeira.ao';

-- ============================================================
-- 7. PEÇAS — Motor e Transmissão
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Motor Completo Toyota Hilux 2.5 D4D',
    'Motor diesel 2.5 D4D em excelente estado. Retirado de viatura acidentada com apenas 85.000 km. Testado e a funcionar. Inclui todos os acessórios. Ideal para substituição directa.',
    185000.00, 'bom', 'Toyota', 'Hilux', 2010, 2015,
    'https://picsum.photos/seed/motor1/600/450',
    ARRAY['https://picsum.photos/seed/motor1/600/450','https://picsum.photos/seed/motor1b/600/450','https://picsum.photos/seed/motor1c/600/450'],
    1, 'activo', 47, NOW() - INTERVAL '5 days'
FROM categorias c WHERE c.slug = 'motor-transmissao';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Caixa de Velocidades Automática Mitsubishi Pajero',
    'Caixa automática 4 velocidades para Pajero V6. Funcionamento perfeito, sem escorregamentos. Retirada com 110.000 km. Garantia de 30 dias.',
    95000.00, 'bom', 'Mitsubishi', 'Pajero', 2005, 2012,
    'https://picsum.photos/seed/caixa1/600/450',
    ARRAY['https://picsum.photos/seed/caixa1/600/450','https://picsum.photos/seed/caixa1b/600/450'],
    1, 'activo', 32, NOW() - INTERVAL '8 days'
FROM categorias c WHERE c.slug = 'motor-transmissao';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Alternador Honda CR-V 2.0',
    'Alternador original Honda 90A em bom estado. Testado no banco. Retirado de CR-V com 140.000 km. Entrega disponível.',
    18500.00, 'bom', 'Honda', 'CR-V', 2008, 2014,
    'https://picsum.photos/seed/altern1/600/450',
    ARRAY['https://picsum.photos/seed/altern1/600/450','https://picsum.photos/seed/altern1b/600/450'],
    2, 'activo', 19, NOW() - INTERVAL '3 days'
FROM categorias c WHERE c.slug = 'motor-transmissao';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Correia de Distribuição Kit Completo Hyundai Tucson',
    'Kit completo de distribuição (correia + tensores + bomba de água) para Tucson 2.0 CRDI. Peça nova em caixa original.',
    12000.00, 'novo', 'Hyundai', 'Tucson', 2010, 2018,
    'https://picsum.photos/seed/correia1/600/450',
    ARRAY['https://picsum.photos/seed/correia1/600/450'],
    3, 'activo', 11, NOW() - INTERVAL '1 day'
FROM categorias c WHERE c.slug = 'motor-transmissao';

-- ============================================================
-- 8. PEÇAS — Suspensão e Direcção
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Amortecedor Traseiro Toyota Land Cruiser 200',
    'Par de amortecedores traseiros originais Toyota. Retirados com 60.000 km. Em perfeito estado, sem fugas. Ideal para quem evita os "sacodes" das estradas de Luanda.',
    45000.00, 'bom', 'Toyota', 'Land Cruiser 200', 2012, 2020,
    'https://picsum.photos/seed/amorte1/600/450',
    ARRAY['https://picsum.photos/seed/amorte1/600/450','https://picsum.photos/seed/amorte1b/600/450'],
    1, 'activo', 28, NOW() - INTERVAL '6 days'
FROM categorias c WHERE c.slug = 'suspensao-direccao';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000003',
    c.id,
    'Caixa de Direcção Assistida BMW Série 3 E90',
    'Caixa de direcção hidráulica para BMW E90 320i/325i. Funcionamento suave e sem folgas. Retirada com 95.000 km.',
    68000.00, 'bom', 'BMW', 'Série 3 E90', 2005, 2011,
    'https://picsum.photos/seed/direc1/600/450',
    ARRAY['https://picsum.photos/seed/direc1/600/450','https://picsum.photos/seed/direc1b/600/450'],
    1, 'activo', 15, NOW() - INTERVAL '4 days'
FROM categorias c WHERE c.slug = 'suspensao-direccao';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Braço de Suspensão Dianteiro KIA Sportage',
    'Braço inferior de suspensão dianteiro esquerdo para KIA Sportage. Sem desgaste nos casquilhos. Pronto a montar.',
    8500.00, 'bom', 'KIA', 'Sportage', 2011, 2016,
    'https://picsum.photos/seed/braco1/600/450',
    ARRAY['https://picsum.photos/seed/braco1/600/450'],
    2, 'activo', 9, NOW() - INTERVAL '2 days'
FROM categorias c WHERE c.slug = 'suspensao-direccao';

-- ============================================================
-- 9. PEÇAS — Travagem
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Disco de Travão Dianteiro Nissan Navara D40',
    'Par de discos dianteiros ventilados para Navara D40 2.5 dCi. Medida: 296mm. Espessura: 28mm. Peças novas de marca compatível.',
    15000.00, 'novo', 'Nissan', 'Navara D40', 2005, 2015,
    'https://picsum.photos/seed/disco1/600/450',
    ARRAY['https://picsum.photos/seed/disco1/600/450','https://picsum.photos/seed/disco1b/600/450'],
    4, 'activo', 22, NOW() - INTERVAL '7 days'
FROM categorias c WHERE c.slug = 'travagem';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Bomba de Travão Principal Honda Accord',
    'Bomba de travão original Honda para Accord 2.4. Testada em bancada. Pressão correcta e sem fugas internas.',
    22000.00, 'bom', 'Honda', 'Accord', 2008, 2013,
    'https://picsum.photos/seed/bomba1/600/450',
    ARRAY['https://picsum.photos/seed/bomba1/600/450'],
    1, 'activo', 7, NOW() - INTERVAL '3 days'
FROM categorias c WHERE c.slug = 'travagem';

-- ============================================================
-- 10. PEÇAS — Carroçaria e Vidros
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Para-choques Dianteiro Toyota Fortuner Preto',
    'Para-choques dianteiro original Toyota Fortuner em cor preta. Pequenas marcas de uso mas sem deformações. Inclui suportes.',
    35000.00, 'regular', 'Toyota', 'Fortuner', 2016, 2021,
    'https://picsum.photos/seed/parachoque1/600/450',
    ARRAY['https://picsum.photos/seed/parachoque1/600/450','https://picsum.photos/seed/parachoque1b/600/450','https://picsum.photos/seed/parachoque1c/600/450'],
    1, 'activo', 38, NOW() - INTERVAL '9 days'
FROM categorias c WHERE c.slug = 'carrocaria-vidros';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000003',
    c.id,
    'Porta Dianteira Direita Mercedes Classe C W204',
    'Porta dianteira direita em cor prata (código 775). Vidro e mecanismo incluídos. Sem mossas. Retirada de acidente traseiro.',
    52000.00, 'bom', 'Mercedes-Benz', 'Classe C W204', 2007, 2014,
    'https://picsum.photos/seed/porta1/600/450',
    ARRAY['https://picsum.photos/seed/porta1/600/450','https://picsum.photos/seed/porta1b/600/450'],
    1, 'activo', 24, NOW() - INTERVAL '5 days'
FROM categorias c WHERE c.slug = 'carrocaria-vidros';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Vidro Lateral Traseiro Hyundai Tucson',
    'Vidro lateral traseiro esquerdo para Tucson. Original, sem fissuras. Encaixe perfeito. Retirado de viatura de colisão frontal.',
    8000.00, 'bom', 'Hyundai', 'Tucson', 2010, 2018,
    'https://picsum.photos/seed/vidro1/600/450',
    ARRAY['https://picsum.photos/seed/vidro1/600/450'],
    1, 'activo', 13, NOW() - INTERVAL '2 days'
FROM categorias c WHERE c.slug = 'carrocaria-vidros';

-- ============================================================
-- 11. PEÇAS — Electricidade e Electrónica
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000003',
    c.id,
    'ECU / Central de Injecção BMW 320i E90',
    'Central de injecção original Siemens para BMW 320i N46. Número de referência: 7548124. Totalmente funcional. Pode requerer codificação.',
    75000.00, 'bom', 'BMW', '320i E90', 2005, 2011,
    'https://picsum.photos/seed/ecu1/600/450',
    ARRAY['https://picsum.photos/seed/ecu1/600/450','https://picsum.photos/seed/ecu1b/600/450'],
    1, 'activo', 41, NOW() - INTERVAL '10 days'
FROM categorias c WHERE c.slug = 'electricidade-electronica';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Farol Dianteiro Esquerdo Toyota Hilux 2016',
    'Farol esquerdo original Toyota Hilux Revo. LED de sinal incluído. Sem rachas no vidro. Encaixe directo.',
    42000.00, 'bom', 'Toyota', 'Hilux Revo', 2016, 2022,
    'https://picsum.photos/seed/farol1/600/450',
    ARRAY['https://picsum.photos/seed/farol1/600/450','https://picsum.photos/seed/farol1b/600/450'],
    1, 'activo', 33, NOW() - INTERVAL '4 days'
FROM categorias c WHERE c.slug = 'electricidade-electronica';

-- ============================================================
-- 12. PEÇAS — Ar Condicionado
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Compressor de Ar Condicionado Mitsubishi Outlander',
    'Compressor AC original Sanden para Outlander 2.4. Testado, faz pressão correcta. Retirado de viatura sem problema no AC. Essencial para Luanda!',
    55000.00, 'bom', 'Mitsubishi', 'Outlander', 2007, 2013,
    'https://picsum.photos/seed/compressor1/600/450',
    ARRAY['https://picsum.photos/seed/compressor1/600/450','https://picsum.photos/seed/compressor1b/600/450'],
    1, 'activo', 56, NOW() - INTERVAL '11 days'
FROM categorias c WHERE c.slug = 'ar-condicionado';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000001',
    c.id,
    'Condensador de AC Nissan X-Trail T31',
    'Condensador de AC para Nissan X-Trail 2.0/2.5. Alumínio em bom estado, sem furos. Inclui ventoinhas.',
    18000.00, 'bom', 'Nissan', 'X-Trail T31', 2007, 2014,
    'https://picsum.photos/seed/cond1/600/450',
    ARRAY['https://picsum.photos/seed/cond1/600/450'],
    1, 'activo', 17, NOW() - INTERVAL '3 days'
FROM categorias c WHERE c.slug = 'ar-condicionado';

-- ============================================================
-- 13. PEÇAS — Escape e Combustível
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000003',
    c.id,
    'Bomba de Combustível VW Touareg 3.0 TDI',
    'Bomba de alta pressão para Touareg V6 TDI. Ref: 059130755. Funcionamento correcto, caudal testado. Retirada com 80.000 km.',
    89000.00, 'bom', 'Volkswagen', 'Touareg', 2010, 2018,
    'https://picsum.photos/seed/bomba2/600/450',
    ARRAY['https://picsum.photos/seed/bomba2/600/450','https://picsum.photos/seed/bomba2b/600/450'],
    1, 'activo', 29, NOW() - INTERVAL '6 days'
FROM categorias c WHERE c.slug = 'escape-combustivel';

-- ============================================================
-- 14. PEÇAS — Acessórios e Interior
-- ============================================================

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000002',
    c.id,
    'Banco Dianteiro Esquerdo Toyota Prado 150',
    'Banco dianteiro do condutor com regulação eléctrica e aquecimento. Couro bege em excelente estado. Airbag lateral incluído.',
    65000.00, 'bom', 'Toyota', 'Land Cruiser Prado 150', 2010, 2018,
    'https://picsum.photos/seed/banco1/600/450',
    ARRAY['https://picsum.photos/seed/banco1/600/450','https://picsum.photos/seed/banco1b/600/450','https://picsum.photos/seed/banco1c/600/450'],
    1, 'activo', 44, NOW() - INTERVAL '8 days'
FROM categorias c WHERE c.slug = 'acessorios-interior';

INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
SELECT
    'b1000000-0000-0000-0000-000000000003',
    c.id,
    'Painel de Instrumentos Mercedes E-Class W212',
    'Quadrante de instrumentos original Mercedes W212 E220 CDI. Totalmente funcional. Km actuais: 132.000. Encaixe directo.',
    38000.00, 'bom', 'Mercedes-Benz', 'Classe E W212', 2009, 2016,
    'https://picsum.photos/seed/painel1/600/450',
    ARRAY['https://picsum.photos/seed/painel1/600/450','https://picsum.photos/seed/painel1b/600/450'],
    1, 'activo', 21, NOW() - INTERVAL '5 days'
FROM categorias c WHERE c.slug = 'acessorios-interior';

-- ============================================================
-- RESUMO DO SEED
-- ============================================================
-- Utilizadores criados:
--   Admins:      admin1@kambafeira.ao / admin2@kambafeira.ao / admin3@kambafeira.ao
--   Fornecedores: autopeças.luanda@gmail.com / desmanche.kilamba@gmail.com / stand.viana@gmail.com
--   Compradores: joao.comprador@gmail.com / maria.comprador@gmail.com / carlos.comprador@gmail.com
--   Password de todos: Teste@123
--
-- Chaves de convite disponíveis: KAMBA-TESTE-001 / KAMBA-TESTE-002 / KAMBA-TESTE-003
--
-- Peças inseridas: 20 peças activas em 7 categorias
-- ============================================================
