import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'

// Endpoint de seed — protegido em produção
export async function rotasSeed(servidor: FastifyInstance) {
  servidor.post('/seed/reset', async (req, reply) => {
    // Bloquear em produção a menos que explicitamente habilitado
    if (process.env.NODE_ENV === 'production' && process.env.SEED_HABILITADO !== 'true') {
      return reply.status(404).send({ erro: 'Não encontrado' })
    }

    const chaveSecreta = (req.query as { chave?: string }).chave
    if (chaveSecreta !== 'kamba2026seed') {
      return reply.status(403).send({ erro: 'Não autorizado' })
    }

    const db = servidor.db
    const hash = await bcrypt.hash('Teste@123', 10)

    // Garantir que os 3 admins existem com Teste@123
    const admins = [
      { email: 'admin1@kambafeira.ao', nome: 'Admin Angola 1' },
      { email: 'admin2@kambafeira.ao', nome: 'Admin Angola 2' },
      { email: 'admin3@kambafeira.ao', nome: 'Admin Brasil' },
    ]
    for (const a of admins) {
      await db.query(
        `INSERT INTO usuarios (email, password_hash, perfil, nome)
         VALUES ($1, $2, 'admin', $3)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [a.email, hash, a.nome]
      )
    }

    // IDs fixos para facilitar limpeza
    const IDS = {
      forn1: 'a1000000-0000-0000-0000-000000000001',
      forn2: 'a1000000-0000-0000-0000-000000000002',
      forn3: 'a1000000-0000-0000-0000-000000000003',
      comp1: 'c1000000-0000-0000-0000-000000000001',
      comp2: 'c1000000-0000-0000-0000-000000000002',
      comp3: 'c1000000-0000-0000-0000-000000000003',
      perfil1: 'b1000000-0000-0000-0000-000000000001',
      perfil2: 'b1000000-0000-0000-0000-000000000002',
      perfil3: 'b1000000-0000-0000-0000-000000000003',
    }

    // Limpar dados de teste anteriores
    await db.query(`DELETE FROM pecas WHERE fornecedor_id IN ($1,$2,$3)`, [IDS.perfil1, IDS.perfil2, IDS.perfil3])
    await db.query(`DELETE FROM contratos WHERE fornecedor_id IN ($1,$2,$3)`, [IDS.perfil1, IDS.perfil2, IDS.perfil3])
    await db.query(`DELETE FROM chaves_acesso WHERE chave IN ('KAMBA-TESTE-001','KAMBA-TESTE-002','KAMBA-TESTE-003')`)
    await db.query(`DELETE FROM fornecedores WHERE id IN ($1,$2,$3)`, [IDS.perfil1, IDS.perfil2, IDS.perfil3])
    await db.query(`DELETE FROM usuarios WHERE id IN ($1,$2,$3,$4,$5,$6)`, [IDS.forn1, IDS.forn2, IDS.forn3, IDS.comp1, IDS.comp2, IDS.comp3])

    // Inserir utilizadores fornecedores
    await db.query(`
      INSERT INTO usuarios (id, email, password_hash, perfil, nome, telefone) VALUES
      ($1,'autopeças.luanda@gmail.com',$4,'fornecedor','Manuel Sebastião','+244 924 200 001'),
      ($2,'desmanche.kilamba@gmail.com',$4,'fornecedor','Augusto Fernandes','+244 924 200 002'),
      ($3,'stand.viana@gmail.com',$4,'fornecedor','Filomena Cardoso','+244 924 200 003')
    `, [IDS.forn1, IDS.forn2, IDS.forn3, hash])

    // Inserir utilizadores compradores
    await db.query(`
      INSERT INTO usuarios (id, email, password_hash, perfil, nome, telefone) VALUES
      ($1,'joao.comprador@gmail.com',$4,'comprador','João Baptista','+244 926 300 001'),
      ($2,'maria.comprador@gmail.com',$4,'comprador','Maria da Graça','+244 926 300 002'),
      ($3,'carlos.comprador@gmail.com',$4,'comprador','Carlos Muanda','+244 926 300 003')
    `, [IDS.comp1, IDS.comp2, IDS.comp3, hash])

    // Inserir perfis de fornecedor
    await db.query(`
      INSERT INTO fornecedores (id, usuario_id, nome_empresa, tipo, descricao, provincia, municipio, bairro, whatsapp, avaliacao_media, total_avaliacoes, total_vendas, verificado) VALUES
      ($1,$4,'AutoPeças Luanda Centro','desmanche','Especialistas em peças usadas de Toyota, Mitsubishi e Nissan. Mais de 15 anos no mercado. Todas as peças testadas antes da venda.','Luanda','Ingombota','Bairro Operário','+244 924 200 001',4.7,23,89,true),
      ($2,$5,'Desmanche Kilamba','desmanche','Maior desmanche do Kilamba. Stock permanente de Honda, Hyundai e KIA. Entrega em Luanda no próprio dia.','Luanda','Kilamba Kiaxi','Kilamba','+244 924 200 002',4.3,15,47,true),
      ($3,$6,'Stand Viana Peças','stand','Stand de automóveis com secção de peças usadas. BMW, Mercedes e Volkswagen. Peças com 3 meses de garantia.','Luanda','Viana','Zona Industrial Viana','+244 924 200 003',4.9,8,31,true)
    `, [IDS.perfil1, IDS.perfil2, IDS.perfil3, IDS.forn1, IDS.forn2, IDS.forn3])

    // Contratos
    await db.query(`
      INSERT INTO contratos (fornecedor_id, taxa_comissao, ativo) VALUES ($1,10.00,true),($2,10.00,true),($3,8.00,true)
    `, [IDS.perfil1, IDS.perfil2, IDS.perfil3])

    // Chaves de acesso
    const adminId = (await db.query(`SELECT id FROM usuarios WHERE email='admin1@kambafeira.ao'`)).rows[0]?.id
    if (adminId) {
      await db.query(`
        INSERT INTO chaves_acesso (chave, tipo, criada_por, ativa, expira_em) VALUES
        ('KAMBA-TESTE-001','fornecedor',$1,true,NOW()+INTERVAL '90 days'),
        ('KAMBA-TESTE-002','fornecedor',$1,true,NOW()+INTERVAL '90 days'),
        ('KAMBA-TESTE-003','fornecedor',$1,true,NOW()+INTERVAL '90 days')
      `, [adminId])
    }

    // Buscar IDs das categorias
    const cats = (await db.query(`SELECT id, slug FROM categorias`)).rows
    const cat = (slug: string) => cats.find((c: { id: string; slug: string }) => c.slug === slug)?.id

    // Inserir peças
    const pecas = [
      // Motor e Transmissão
      { forn: IDS.perfil1, cat: 'motor-transmissao', titulo: 'Motor Completo Toyota Hilux 2.5 D4D', descricao: 'Motor diesel 2.5 D4D em excelente estado. Retirado de viatura acidentada com apenas 85.000 km. Testado e a funcionar. Inclui todos os acessórios. Ideal para substituição directa.', preco: 185000, condicao: 'bom', marca: 'Toyota', modelo: 'Hilux', ano_de: 2010, ano_ate: 2015, foto: 'https://picsum.photos/seed/motor1/600/450', fotos: ['https://picsum.photos/seed/motor1/600/450','https://picsum.photos/seed/motor1b/600/450'], vis: 47, dias: 5 },
      { forn: IDS.perfil1, cat: 'motor-transmissao', titulo: 'Caixa de Velocidades Automática Mitsubishi Pajero', descricao: 'Caixa automática 4 velocidades para Pajero V6. Funcionamento perfeito, sem escorregamentos. Retirada com 110.000 km. Garantia de 30 dias.', preco: 95000, condicao: 'bom', marca: 'Mitsubishi', modelo: 'Pajero', ano_de: 2005, ano_ate: 2012, foto: 'https://picsum.photos/seed/caixa1/600/450', fotos: ['https://picsum.photos/seed/caixa1/600/450'], vis: 32, dias: 8 },
      { forn: IDS.perfil2, cat: 'motor-transmissao', titulo: 'Alternador Honda CR-V 2.0', descricao: 'Alternador original Honda 90A em bom estado. Testado no banco. Retirado de CR-V com 140.000 km. Entrega disponível.', preco: 18500, condicao: 'bom', marca: 'Honda', modelo: 'CR-V', ano_de: 2008, ano_ate: 2014, foto: 'https://picsum.photos/seed/altern1/600/450', fotos: ['https://picsum.photos/seed/altern1/600/450'], vis: 19, dias: 3 },
      { forn: IDS.perfil2, cat: 'motor-transmissao', titulo: 'Correia de Distribuição Kit Completo Hyundai Tucson', descricao: 'Kit completo de distribuição (correia + tensores + bomba de água) para Tucson 2.0 CRDI. Peça nova em caixa original.', preco: 12000, condicao: 'novo', marca: 'Hyundai', modelo: 'Tucson', ano_de: 2010, ano_ate: 2018, foto: 'https://picsum.photos/seed/correia1/600/450', fotos: ['https://picsum.photos/seed/correia1/600/450'], vis: 11, dias: 1 },
      // Suspensão e Direcção
      { forn: IDS.perfil1, cat: 'suspensao-direccao', titulo: 'Amortecedor Traseiro Toyota Land Cruiser 200', descricao: 'Par de amortecedores traseiros originais Toyota. Retirados com 60.000 km. Em perfeito estado, sem fugas. Ideal para quem evita os "sacodes" das estradas de Luanda.', preco: 45000, condicao: 'bom', marca: 'Toyota', modelo: 'Land Cruiser 200', ano_de: 2012, ano_ate: 2020, foto: 'https://picsum.photos/seed/amorte1/600/450', fotos: ['https://picsum.photos/seed/amorte1/600/450'], vis: 28, dias: 6 },
      { forn: IDS.perfil3, cat: 'suspensao-direccao', titulo: 'Caixa de Direcção Assistida BMW Série 3 E90', descricao: 'Caixa de direcção hidráulica para BMW E90 320i/325i. Funcionamento suave e sem folgas. Retirada com 95.000 km.', preco: 68000, condicao: 'bom', marca: 'BMW', modelo: 'Série 3 E90', ano_de: 2005, ano_ate: 2011, foto: 'https://picsum.photos/seed/direc1/600/450', fotos: ['https://picsum.photos/seed/direc1/600/450'], vis: 15, dias: 4 },
      { forn: IDS.perfil2, cat: 'suspensao-direccao', titulo: 'Braço de Suspensão Dianteiro KIA Sportage', descricao: 'Braço inferior de suspensão dianteiro esquerdo para KIA Sportage. Sem desgaste nos casquilhos. Pronto a montar.', preco: 8500, condicao: 'bom', marca: 'KIA', modelo: 'Sportage', ano_de: 2011, ano_ate: 2016, foto: 'https://picsum.photos/seed/braco1/600/450', fotos: ['https://picsum.photos/seed/braco1/600/450'], vis: 9, dias: 2 },
      // Travagem
      { forn: IDS.perfil1, cat: 'travagem', titulo: 'Disco de Travão Dianteiro Nissan Navara D40', descricao: 'Par de discos dianteiros ventilados para Navara D40 2.5 dCi. Medida: 296mm. Espessura: 28mm. Peças novas de marca compatível.', preco: 15000, condicao: 'novo', marca: 'Nissan', modelo: 'Navara D40', ano_de: 2005, ano_ate: 2015, foto: 'https://picsum.photos/seed/disco1/600/450', fotos: ['https://picsum.photos/seed/disco1/600/450'], vis: 22, dias: 7 },
      { forn: IDS.perfil2, cat: 'travagem', titulo: 'Bomba de Travão Principal Honda Accord', descricao: 'Bomba de travão original Honda para Accord 2.4. Testada em bancada. Pressão correcta e sem fugas internas.', preco: 22000, condicao: 'bom', marca: 'Honda', modelo: 'Accord', ano_de: 2008, ano_ate: 2013, foto: 'https://picsum.photos/seed/bomba1/600/450', fotos: ['https://picsum.photos/seed/bomba1/600/450'], vis: 7, dias: 3 },
      // Carroçaria
      { forn: IDS.perfil1, cat: 'carrocaria-vidros', titulo: 'Para-choques Dianteiro Toyota Fortuner Preto', descricao: 'Para-choques dianteiro original Toyota Fortuner em cor preta. Pequenas marcas de uso mas sem deformações. Inclui suportes.', preco: 35000, condicao: 'regular', marca: 'Toyota', modelo: 'Fortuner', ano_de: 2016, ano_ate: 2021, foto: 'https://picsum.photos/seed/parachoque1/600/450', fotos: ['https://picsum.photos/seed/parachoque1/600/450'], vis: 38, dias: 9 },
      { forn: IDS.perfil3, cat: 'carrocaria-vidros', titulo: 'Porta Dianteira Direita Mercedes Classe C W204', descricao: 'Porta dianteira direita em cor prata (código 775). Vidro e mecanismo incluídos. Sem mossas. Retirada de acidente traseiro.', preco: 52000, condicao: 'bom', marca: 'Mercedes-Benz', modelo: 'Classe C W204', ano_de: 2007, ano_ate: 2014, foto: 'https://picsum.photos/seed/porta1/600/450', fotos: ['https://picsum.photos/seed/porta1/600/450'], vis: 24, dias: 5 },
      { forn: IDS.perfil2, cat: 'carrocaria-vidros', titulo: 'Vidro Lateral Traseiro Hyundai Tucson', descricao: 'Vidro lateral traseiro esquerdo para Tucson. Original, sem fissuras. Encaixe perfeito. Retirado de viatura de colisão frontal.', preco: 8000, condicao: 'bom', marca: 'Hyundai', modelo: 'Tucson', ano_de: 2010, ano_ate: 2018, foto: 'https://picsum.photos/seed/vidro1/600/450', fotos: ['https://picsum.photos/seed/vidro1/600/450'], vis: 13, dias: 2 },
      // Electricidade
      { forn: IDS.perfil3, cat: 'electricidade-electronica', titulo: 'ECU / Central de Injecção BMW 320i E90', descricao: 'Central de injecção original Siemens para BMW 320i N46. Número de referência: 7548124. Totalmente funcional. Pode requerer codificação.', preco: 75000, condicao: 'bom', marca: 'BMW', modelo: '320i E90', ano_de: 2005, ano_ate: 2011, foto: 'https://picsum.photos/seed/ecu1/600/450', fotos: ['https://picsum.photos/seed/ecu1/600/450'], vis: 41, dias: 10 },
      { forn: IDS.perfil1, cat: 'electricidade-electronica', titulo: 'Farol Dianteiro Esquerdo Toyota Hilux 2016', descricao: 'Farol esquerdo original Toyota Hilux Revo. LED de sinal incluído. Sem rachas no vidro. Encaixe directo.', preco: 42000, condicao: 'bom', marca: 'Toyota', modelo: 'Hilux Revo', ano_de: 2016, ano_ate: 2022, foto: 'https://picsum.photos/seed/farol1/600/450', fotos: ['https://picsum.photos/seed/farol1/600/450'], vis: 33, dias: 4 },
      // Ar Condicionado
      { forn: IDS.perfil2, cat: 'ar-condicionado', titulo: 'Compressor de Ar Condicionado Mitsubishi Outlander', descricao: 'Compressor AC original Sanden para Outlander 2.4. Testado, faz pressão correcta. Retirado de viatura sem problema no AC. Essencial para Luanda!', preco: 55000, condicao: 'bom', marca: 'Mitsubishi', modelo: 'Outlander', ano_de: 2007, ano_ate: 2013, foto: 'https://picsum.photos/seed/compressor1/600/450', fotos: ['https://picsum.photos/seed/compressor1/600/450'], vis: 56, dias: 11 },
      { forn: IDS.perfil1, cat: 'ar-condicionado', titulo: 'Condensador de AC Nissan X-Trail T31', descricao: 'Condensador de AC para Nissan X-Trail 2.0/2.5. Alumínio em bom estado, sem furos. Inclui ventoinhas.', preco: 18000, condicao: 'bom', marca: 'Nissan', modelo: 'X-Trail T31', ano_de: 2007, ano_ate: 2014, foto: 'https://picsum.photos/seed/cond1/600/450', fotos: ['https://picsum.photos/seed/cond1/600/450'], vis: 17, dias: 3 },
      // Escape
      { forn: IDS.perfil3, cat: 'escape-combustivel', titulo: 'Bomba de Combustível VW Touareg 3.0 TDI', descricao: 'Bomba de alta pressão para Touareg V6 TDI. Ref: 059130755. Funcionamento correcto, caudal testado. Retirada com 80.000 km.', preco: 89000, condicao: 'bom', marca: 'Volkswagen', modelo: 'Touareg', ano_de: 2010, ano_ate: 2018, foto: 'https://picsum.photos/seed/bomba2/600/450', fotos: ['https://picsum.photos/seed/bomba2/600/450'], vis: 29, dias: 6 },
      // Acessórios
      { forn: IDS.perfil2, cat: 'acessorios-interior', titulo: 'Banco Dianteiro Esquerdo Toyota Prado 150', descricao: 'Banco dianteiro do condutor com regulação eléctrica e aquecimento. Couro bege em excelente estado. Airbag lateral incluído.', preco: 65000, condicao: 'bom', marca: 'Toyota', modelo: 'Land Cruiser Prado 150', ano_de: 2010, ano_ate: 2018, foto: 'https://picsum.photos/seed/banco1/600/450', fotos: ['https://picsum.photos/seed/banco1/600/450'], vis: 44, dias: 8 },
      { forn: IDS.perfil3, cat: 'acessorios-interior', titulo: 'Painel de Instrumentos Mercedes E-Class W212', descricao: 'Quadrante de instrumentos original Mercedes W212 E220 CDI. Totalmente funcional. Km actuais: 132.000. Encaixe directo.', preco: 38000, condicao: 'bom', marca: 'Mercedes-Benz', modelo: 'Classe E W212', ano_de: 2009, ano_ate: 2016, foto: 'https://picsum.photos/seed/painel1/600/450', fotos: ['https://picsum.photos/seed/painel1/600/450'], vis: 21, dias: 5 },
    ]

    for (const p of pecas) {
      const catId = cat(p.cat)
      if (!catId) continue
      await db.query(`
        INSERT INTO pecas (fornecedor_id, categoria_id, titulo, descricao, preco, condicao, marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate, foto_principal, fotos, estoque, status, visualizacoes, publicada_em)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,'activo',$13,NOW()-($14||' days')::INTERVAL)
      `, [p.forn, catId, p.titulo, p.descricao, p.preco, p.condicao, p.marca, p.modelo, p.ano_de, p.ano_ate, p.foto, p.fotos, p.vis, p.dias])
    }

    return { ok: true, pecas: pecas.length, mensagem: 'Seed concluído com sucesso' }
  })

  // POST /seed/dados-teste — carga completa de dados sintéticos
  servidor.post('/seed/dados-teste', async (req, reply) => {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_HABILITADO !== 'true') {
      return reply.status(404).send({ erro: 'Não encontrado' })
    }
    const chave = (req.query as { chave?: string }).chave
    if (chave !== 'kamba2026seed') {
      return reply.status(403).send({ erro: 'Não autorizado' })
    }

    const db = servidor.db
    const log: string[] = []
    const hash = await bcrypt.hash('teste123', 10)

    // ── Utilitário ─────────────────────────────────────────
    const diasAtras = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
    }
    const aleatorio = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

    // ── 1. Buscar dados existentes ─────────────────────────
    const { rows: cats } = await db.query('SELECT id, slug FROM categorias WHERE ativa = true')
    const catPorSlug: Record<string, string> = {}
    cats.forEach((c: { id: string; slug: string }) => { catPorSlug[c.slug] = c.id })

    // ── 2. Fornecedores ────────────────────────────────────
    const novosFornecedores = [
      { nome: 'Carlos Eduardo Mbemba', email: 'carlos.mbemba@teste.ao', tipo: 'desmanche',   provincia: 'Luanda',   empresa: 'Auto Peças Luanda',   whatsapp: '244923111001' },
      { nome: 'Helena Ferreira Costa', email: 'helena.costa@teste.ao',  tipo: 'stand',        provincia: 'Benguela', empresa: 'Stand Motor Sul',      whatsapp: '244923111002' },
      { nome: 'Joaquim Teixeira Neto', email: 'joaquim.neto@teste.ao',  tipo: 'independente', provincia: 'Huambo',   empresa: 'Oficina Central KW',   whatsapp: '244923111003' },
    ]
    const idsFornecedores: string[] = []
    for (const f of novosFornecedores) {
      const ex = await db.query('SELECT f.id FROM fornecedores f JOIN usuarios u ON f.usuario_id=u.id WHERE u.email=$1', [f.email])
      if (ex.rows.length > 0) { idsFornecedores.push(ex.rows[0].id as string); continue }
      const { rows: [u] } = await db.query(
        `INSERT INTO usuarios (email,password_hash,perfil,nome,telefone) VALUES ($1,$2,'fornecedor',$3,$4) RETURNING id`,
        [f.email, hash, f.nome, f.whatsapp])
      const { rows: [forn] } = await db.query(
        `INSERT INTO fornecedores (usuario_id,nome_empresa,tipo,provincia,whatsapp,verificado) VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
        [u.id, f.empresa, f.tipo, f.provincia, f.whatsapp])
      idsFornecedores.push(forn.id as string)
    }
    // Incluir fornecedores já existentes
    const { rows: fornExist } = await db.query('SELECT id FROM fornecedores ORDER BY criado_em LIMIT 10')
    const todosForns = [...new Set([...idsFornecedores, ...fornExist.map((f: { id: string }) => f.id)])]
    log.push(`Fornecedores: ${todosForns.length}`)

    // ── 3. Compradores ─────────────────────────────────────
    const novosCompradores = [
      { nome: 'António Sebastião',  email: 'antonio@teste.ao', telefone: '244912001001' },
      { nome: 'Maria da Conceição', email: 'maria@teste.ao',   telefone: '244912001002' },
      { nome: 'Pedro Luvualu',      email: 'pedro@teste.ao',   telefone: '244912001003' },
      { nome: 'Fátima Neto Silva',  email: 'fatima@teste.ao',  telefone: '244912001004' },
    ]
    const idsCompradores: string[] = []
    for (const c of novosCompradores) {
      const ex = await db.query('SELECT id FROM usuarios WHERE email=$1', [c.email])
      if (ex.rows.length > 0) { idsCompradores.push(ex.rows[0].id as string); continue }
      const { rows: [u] } = await db.query(
        `INSERT INTO usuarios (email,password_hash,perfil,nome,telefone) VALUES ($1,$2,'comprador',$3,$4) RETURNING id`,
        [c.email, hash, c.nome, c.telefone])
      idsCompradores.push(u.id as string)
    }
    const { rows: compExist } = await db.query("SELECT id FROM usuarios WHERE perfil='comprador' ORDER BY criado_em LIMIT 10")
    const todosCompradores = [...new Set([...idsCompradores, ...compExist.map((c: { id: string }) => c.id)])]
    log.push(`Compradores: ${todosCompradores.length}`)

    // ── 4. Contratos ───────────────────────────────────────
    const taxas = [10, 9, 8, 11, 10, 10, 9, 8]
    for (let i = 0; i < todosForns.length; i++) {
      const ex = await db.query('SELECT id FROM contratos WHERE fornecedor_id=$1 AND ativo=true', [todosForns[i]])
      if (ex.rows.length > 0) continue
      await db.query(`INSERT INTO contratos (fornecedor_id,taxa_comissao,ativo) VALUES ($1,$2,true)`,
        [todosForns[i], taxas[i % taxas.length]])
    }
    log.push('Contratos criados')

    // ── 5. Transportadoras e zonas ─────────────────────────
    const transportadorasDados = [
      { nome: 'Expresso Angola',       telefone: '244222333001', whatsapp: '244923444001' },
      { nome: 'Moto Entrega Rápida',   telefone: '244222333002', whatsapp: '244923444002' },
      { nome: 'Nacional Logística',    telefone: '244222333003', whatsapp: '244923444003' },
    ]
    const zonasConfig = [
      { transportadora: 'Expresso Angola',     origem: 'Luanda', destino: 'Luanda',   base: 1500, pkg: 100, pkm: 1, dist: 30 },
      { transportadora: 'Expresso Angola',     origem: 'Luanda', destino: 'Benguela', base: 3500, pkg: 150, pkm: 2, dist: 520 },
      { transportadora: 'Expresso Angola',     origem: 'Luanda', destino: 'Huambo',   base: 4000, pkg: 150, pkm: 2, dist: 630 },
      { transportadora: 'Expresso Angola',     origem: 'Luanda', destino: 'Cabinda',  base: 4500, pkg: 200, pkm: 3, dist: 600 },
      { transportadora: 'Moto Entrega Rápida', origem: 'Luanda', destino: 'Luanda',   base: 800,  pkg: 80,  pkm: 1, dist: 20 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Luanda',   base: 1200, pkg: 90,  pkm: 1, dist: 30 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Benguela', base: 3000, pkg: 130, pkm: 2, dist: 520 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Huambo',   base: 3800, pkg: 140, pkm: 2, dist: 630 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Huíla',    base: 4200, pkg: 160, pkm: 2, dist: 800 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Malanje',  base: 3200, pkg: 130, pkm: 2, dist: 380 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Cabinda',  base: 4000, pkg: 180, pkm: 3, dist: 600 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Namibe',   base: 4500, pkg: 170, pkm: 2, dist: 750 },
      { transportadora: 'Nacional Logística',  origem: 'Luanda', destino: 'Benguela', base: 3200, pkg: 135, pkm: 2, dist: 520 },
    ]
    const tIdPorNome: Record<string, string> = {}
    for (const t of transportadorasDados) {
      const ex = await db.query('SELECT id FROM transportadoras WHERE nome=$1', [t.nome])
      if (ex.rows.length > 0) { tIdPorNome[t.nome] = ex.rows[0].id as string; continue }
      const { rows: [tr] } = await db.query(
        `INSERT INTO transportadoras (nome,telefone,whatsapp) VALUES ($1,$2,$3) RETURNING id`,
        [t.nome, t.telefone, t.whatsapp])
      tIdPorNome[t.nome] = tr.id as string
    }
    const idsZonas: string[] = []
    for (const z of zonasConfig) {
      const tid = tIdPorNome[z.transportadora]
      if (!tid) continue
      const ex = await db.query(
        'SELECT id FROM zonas_entrega WHERE transportadora_id=$1 AND provincia_origem=$2 AND provincia_destino=$3',
        [tid, z.origem, z.destino])
      if (ex.rows.length > 0) { idsZonas.push(ex.rows[0].id as string); continue }
      const { rows: [zr] } = await db.query(
        `INSERT INTO zonas_entrega (transportadora_id,provincia,provincia_origem,provincia_destino,preco_base,preco_por_kg,preco_por_km,distancia_km) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [tid, z.destino, z.origem, z.destino, z.base, z.pkg, z.pkm, z.dist])
      idsZonas.push(zr.id as string)
    }
    const idsTransp = Object.values(tIdPorNome)
    log.push(`Transportadoras: ${idsTransp.length}, Zonas: ${idsZonas.length}`)

    // ── 6. 20 novas peças ──────────────────────────────────
    const novasPecas = [
      { titulo: 'Filtro de Óleo Toyota Corolla 2010-2018',         cat: 'motor-transmissao',         cond: 'novo',    preco: 8500,   est: 15, marca: 'Toyota',      modelo: 'Corolla',          ano_de: 2010, ano_ate: 2018 },
      { titulo: 'Pastilhas de Travão Dianteiras Hyundai Tucson',   cat: 'travagem',                  cond: 'bom',     preco: 22000,  est: 8,  marca: 'Hyundai',     modelo: 'Tucson',           ano_de: 2011, ano_ate: 2019 },
      { titulo: 'Amortecedor Dianteiro Kia Sportage 2012-2016',    cat: 'suspensao-direccao',        cond: 'bom',     preco: 45000,  est: 4,  marca: 'Kia',         modelo: 'Sportage',         ano_de: 2012, ano_ate: 2016 },
      { titulo: 'Correia Dentada Honda Civic 1.8',                 cat: 'motor-transmissao',         cond: 'novo',    preco: 18500,  est: 20, marca: 'Honda',       modelo: 'Civic',            ano_de: 2012, ano_ate: 2020 },
      { titulo: 'Radiador Toyota Hilux 2.5D',                      cat: 'motor-transmissao',         cond: 'regular', preco: 85000,  est: 3,  marca: 'Toyota',      modelo: 'Hilux',            ano_de: 2008, ano_ate: 2015 },
      { titulo: 'Bomba d\'Água Ford Ranger 3.0',                   cat: 'motor-transmissao',         cond: 'bom',     preco: 38000,  est: 6,  marca: 'Ford',        modelo: 'Ranger',           ano_de: 2009, ano_ate: 2016 },
      { titulo: 'Velas de Ignição Nissan X-Trail (jogo 4)',        cat: 'electricidade-electronica', cond: 'novo',    preco: 12000,  est: 25, marca: 'Nissan',      modelo: 'X-Trail',          ano_de: 2010, ano_ate: 2020 },
      { titulo: 'Sensor de Oxigénio Toyota RAV4',                  cat: 'electricidade-electronica', cond: 'bom',     preco: 28000,  est: 7,  marca: 'Toyota',      modelo: 'RAV4',             ano_de: 2013, ano_ate: 2019 },
      { titulo: 'Disco de Embraiagem Mitsubishi L200',             cat: 'motor-transmissao',         cond: 'regular', preco: 67000,  est: 5,  marca: 'Mitsubishi',  modelo: 'L200',             ano_de: 2007, ano_ate: 2016 },
      { titulo: 'Espelho Retrovisor Esquerdo BMW X5',              cat: 'carrocaria-vidros',         cond: 'bom',     preco: 55000,  est: 2,  marca: 'BMW',         modelo: 'X5',               ano_de: 2010, ano_ate: 2018 },
      { titulo: 'Para-choques Dianteiro Toyota Prado 150',         cat: 'carrocaria-vidros',         cond: 'regular', preco: 120000, est: 2,  marca: 'Toyota',      modelo: 'Land Cruiser Prado', ano_de: 2009, ano_ate: 2022 },
      { titulo: 'Manga de Eixo Dianteira Chevrolet S10',           cat: 'suspensao-direccao',        cond: 'bom',     preco: 42000,  est: 4,  marca: 'Chevrolet',   modelo: 'S10',              ano_de: 2008, ano_ate: 2018 },
      { titulo: 'Bomba de Combustível Ford F-250',                 cat: 'escape-combustivel',        cond: 'bom',     preco: 35000,  est: 6,  marca: 'Ford',        modelo: 'F-250',            ano_de: 2010, ano_ate: 2020 },
      { titulo: 'Condensador de AC Hyundai Elantra',               cat: 'ar-condicionado',           cond: 'novo',    preco: 48000,  est: 5,  marca: 'Hyundai',     modelo: 'Elantra',          ano_de: 2012, ano_ate: 2020 },
      { titulo: 'Intercooler Mitsubishi Pajero Sport',             cat: 'motor-transmissao',         cond: 'bom',     preco: 95000,  est: 3,  marca: 'Mitsubishi',  modelo: 'Pajero Sport',     ano_de: 2011, ano_ate: 2019 },
      { titulo: 'Módulo de Injecção Toyota Hilux 3.0',             cat: 'electricidade-electronica', cond: 'bom',     preco: 185000, est: 2,  marca: 'Toyota',      modelo: 'Hilux',            ano_de: 2010, ano_ate: 2018 },
      { titulo: 'Compressor de AC Kia Cerato 2014-2018',           cat: 'ar-condicionado',           cond: 'regular', preco: 72000,  est: 3,  marca: 'Kia',         modelo: 'Cerato',           ano_de: 2014, ano_ate: 2018 },
      { titulo: 'Disco de Travão Traseiro Volkswagen Tiguan',      cat: 'travagem',                  cond: 'novo',    preco: 31000,  est: 10, marca: 'Volkswagen',  modelo: 'Tiguan',           ano_de: 2012, ano_ate: 2020 },
      { titulo: 'Tensor da Correia Renault Duster 1.6',            cat: 'motor-transmissao',         cond: 'bom',     preco: 19500,  est: 8,  marca: 'Renault',     modelo: 'Duster',           ano_de: 2012, ano_ate: 2020 },
      { titulo: 'Caixa de Direção Assistida Toyota Land Cruiser',  cat: 'suspensao-direccao',        cond: 'regular', preco: 210000, est: 1,  marca: 'Toyota',      modelo: 'Land Cruiser',     ano_de: 2008, ano_ate: 2016 },
    ]
    const idsPecas: string[] = []
    for (let i = 0; i < novasPecas.length; i++) {
      const p = novasPecas[i]
      const catId = catPorSlug[p.cat]
      if (!catId) continue
      const fornId = todosForns[i % todosForns.length]
      const { rows: [peca] } = await db.query(
        `INSERT INTO pecas (fornecedor_id,categoria_id,titulo,descricao,preco,condicao,marca_veiculo,modelo_veiculo,ano_veiculo_de,ano_veiculo_ate,estoque,status,publicada_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'activo',NOW()) RETURNING id`,
        [fornId, catId, p.titulo,
          `${p.titulo}. Condição ${p.cond}. Compatível com ${p.marca} ${p.modelo} ${p.ano_de}–${p.ano_ate}. Peça testada e em bom funcionamento. Entrega disponível.`,
          p.preco, p.cond, p.marca, p.modelo, p.ano_de, p.ano_ate, p.est])
      idsPecas.push(peca.id as string)
    }
    log.push(`Peças novas: ${idsPecas.length}`)

    // ── 7. Endereços ───────────────────────────────────────
    const enderecos = [
      { prov: 'Luanda',   mun: 'Luanda',    bairro: 'Miramar',     ref: 'Próximo ao Hotel Presidente' },
      { prov: 'Luanda',   mun: 'Viana',     bairro: 'Kilamba',     ref: 'Bloco 21, Apto 4B' },
      { prov: 'Benguela', mun: 'Benguela',  bairro: 'Bairro Praia',ref: 'Casa amarela perto da praia' },
      { prov: 'Huambo',   mun: 'Huambo',   bairro: 'Centro',      ref: 'Rua da Juventude, nº 45' },
      { prov: 'Luanda',   mun: 'Talatona', bairro: 'Camama',      ref: 'Condomínio Solar, Lote 12' },
    ]
    const idsEnderecos: string[] = []
    for (let i = 0; i < todosCompradores.length && i < enderecos.length; i++) {
      const ex = await db.query('SELECT id FROM enderecos_entrega WHERE usuario_id=$1 LIMIT 1', [todosCompradores[i]])
      if (ex.rows.length > 0) { idsEnderecos.push(ex.rows[0].id as string); continue }
      const e = enderecos[i]
      const { rows: [end] } = await db.query(
        `INSERT INTO enderecos_entrega (usuario_id,nome,provincia,municipio,bairro,referencia,principal) VALUES ($1,'Casa',$2,$3,$4,$5,true) RETURNING id`,
        [todosCompradores[i], e.prov, e.mun, e.bairro, e.ref])
      idsEnderecos.push(end.id as string)
    }

    // ── 8. Todas as peças disponíveis ─────────────────────
    const { rows: todasPecas } = await db.query(
      "SELECT id, preco, fornecedor_id FROM pecas WHERE status='activo' ORDER BY criada_em DESC LIMIT 40"
    )
    if (todasPecas.length === 0) return reply.status(400).send({ erro: 'Sem peças para criar pedidos' })

    // ── 9. Pedidos ─────────────────────────────────────────
    type StatusPedido = 'entregue'|'enviado'|'em_preparacao'|'confirmado'|'cancelado'|'pendente'
    const planoPedidos: [StatusPedido, number, number, number][] = [
      ['entregue',       60, 0, 0], ['entregue', 55, 0, 2],
      ['entregue',       50, 1, 1], ['entregue', 45, 1, 4],
      ['entregue',       40, 2, 3], ['entregue', 35, 2, 5],
      ['entregue',       30, 3, 6], ['entregue', 25, 3, 7],
      ['enviado',        10, 0, 8], ['enviado',   8, 1, 9],  ['enviado', 6, 2, 10],
      ['em_preparacao',   5, 0, 11],['em_preparacao', 4, 1, 12], ['em_preparacao', 3, 2, 13],
      ['confirmado',      2, 3, 14],['confirmado', 2, 0, 15],
      ['cancelado',      20, 0, 16],['cancelado', 18, 1, 17],
      ['cancelado',      15, 2, 18],['cancelado', 12, 3, 19],
      ['pendente',        1, 0, 10],['pendente',  1, 1, 11],
    ]
    const metodos = ['Transferência bancária', 'Cash on delivery', 'Pagamento na entrega']
    const notasComp = ['Por favor confirme com urgência.', 'Aceito retirada no local.', null, null, null]
    const motivosCancelamento = [
      'Encontrei a peça localmente.', 'Carro foi vendido.', 'Peça incompatível.', 'Atraso na confirmação.',
    ]
    const idsVendas: string[] = []
    const vendasEntregues: string[] = []
    const vendasCanceladas: Array<{ vendaId: string; compradorId: string }> = []

    for (const [status, dias, ci, pi] of planoPedidos) {
      const compradorId = todosCompradores[ci % todosCompradores.length]
      const peca = todasPecas[pi % todasPecas.length] as { id: string; preco: string; fornecedor_id: string }
      const precoTotal = parseFloat(peca.preco)
      const { rows: [v] } = await db.query(
        `INSERT INTO vendas (peca_id,fornecedor_id,comprador_id,quantidade,preco_unitario,preco_total,status,metodo_pagamento,notas_comprador,motivo_cancelamento,cancelado_por,criada_em,atualizada_em)
         VALUES ($1,$2,$3,1,$4,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
        [peca.id, peca.fornecedor_id, compradorId, precoTotal, status,
          aleatorio(metodos), aleatorio(notasComp),
          status === 'cancelado' ? aleatorio(motivosCancelamento) : null,
          status === 'cancelado' ? aleatorio(['comprador','fornecedor']) : null,
          diasAtras(dias)])
      idsVendas.push(v.id as string)
      if (status === 'entregue') vendasEntregues.push(v.id as string)
      if (status === 'cancelado') vendasCanceladas.push({ vendaId: v.id as string, compradorId })
      // Debitar stock se não cancelado
      if (status !== 'cancelado') {
        await db.query('UPDATE pecas SET estoque=GREATEST(0,estoque-1) WHERE id=$1', [peca.id])
        await db.query(
          `INSERT INTO movimentos_estoque (peca_id,fornecedor_id,tipo,quantidade_anterior,quantidade_nova,variacao,venda_id) VALUES ($1,$2,'venda_plataforma',1,0,-1,$3)`,
          [peca.id, peca.fornecedor_id, v.id]).catch(() => {})
      } else {
        await db.query(
          `INSERT INTO movimentos_estoque (peca_id,fornecedor_id,tipo,quantidade_anterior,quantidade_nova,variacao,venda_id) VALUES ($1,$2,'cancelamento',0,1,1,$3)`,
          [peca.id, peca.fornecedor_id, v.id]).catch(() => {})
      }
    }
    log.push(`Pedidos: ${idsVendas.length}`)

    // ── 10. Comissões ──────────────────────────────────────
    for (const vendaId of vendasEntregues) {
      const { rows: [v] } = await db.query('SELECT fornecedor_id,preco_total FROM vendas WHERE id=$1', [vendaId])
      const { rows: [contrato] } = await db.query(
        'SELECT taxa_comissao FROM contratos WHERE fornecedor_id=$1 AND ativo=true LIMIT 1', [v.fornecedor_id])
      const taxa = contrato ? parseFloat(contrato.taxa_comissao) : 10
      const valorVenda = parseFloat(v.preco_total)
      await db.query(
        `INSERT INTO comissoes (venda_id,fornecedor_id,valor_venda,taxa_aplicada,valor_comissao,valor_liquido) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (venda_id) DO NOTHING`,
        [vendaId, v.fornecedor_id, valorVenda, taxa, valorVenda * taxa / 100, valorVenda * (1 - taxa / 100)])
      await db.query('UPDATE fornecedores SET total_vendas=total_vendas+1 WHERE id=$1', [v.fornecedor_id])
    }
    log.push(`Comissões: ${vendasEntregues.length}`)

    // ── 11. Fretes ─────────────────────────────────────────
    const statusParaFrete: Record<string, string> = { entregue: 'entregue', enviado: 'em_transito', em_preparacao: 'pendente' }
    let fretesCount = 0
    for (const vendaId of idsVendas) {
      const { rows: [v] } = await db.query('SELECT comprador_id,status FROM vendas WHERE id=$1', [vendaId])
      if (!statusParaFrete[v.status as string]) continue
      const endIdx = todosCompradores.indexOf(v.comprador_id as string)
      const enderecoId = endIdx >= 0 && endIdx < idsEnderecos.length ? idsEnderecos[endIdx] : idsEnderecos[0]
      const tid = aleatorio(idsTransp)
      const zonaId = idsZonas.length > 0 ? aleatorio(idsZonas) : null
      if (!zonaId) continue
      const { rows: [zona] } = await db.query('SELECT * FROM zonas_entrega WHERE id=$1', [zonaId])
      const pesoKg = Math.round((Math.random() * 8 + 0.5) * 10) / 10
      const valorFrete = parseFloat(zona.preco_base) + (pesoKg * parseFloat(zona.preco_por_kg)) + (zona.distancia_km * parseFloat(zona.preco_por_km))
      await db.query(
        `INSERT INTO fretes (venda_id,transportadora_id,zona_id,endereco_id,endereco_texto,peso_kg,distancia_km,valor_frete,status,codigo_rastreio,previsao_entrega,entregue_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,(CURRENT_DATE+INTERVAL '3 days'),$11) ON CONFLICT (venda_id) DO NOTHING`,
        [vendaId, tid, zonaId, enderecoId, `${zona.provincia_destino}, Angola`,
          pesoKg, zona.distancia_km, Math.round(valorFrete),
          statusParaFrete[v.status as string],
          v.status !== 'em_preparacao' ? `KF${Date.now().toString().slice(-8)}` : null,
          v.status === 'entregue' ? new Date(Date.now() - 86400000 * 2).toISOString() : null])
      fretesCount++
    }
    log.push(`Fretes: ${fretesCount}`)

    // ── 12. Avaliações ─────────────────────────────────────
    const notasAval = [5,5,5,4,4,4,3,3]
    const comentarios: Record<number, string[]> = {
      5: ['Excelente peça! Chegou rápido e em perfeito estado. Muito recomendo!', 'Peça original, embalagem cuidada. Funcionou na primeira!', 'Serviço de topo. Fornecedor honesto. Voltarei a comprar.'],
      4: ['Boa peça, chegou em 3 dias. Satisfeito no geral.', 'Produto conforme descrito. Entrega um pouco demorada mas ok.'],
      3: ['Peça boa mas embalagem danificada na chegada.', 'Demorou mais que o esperado mas produto em bom estado.'],
    }
    const respostas = ['Obrigado! Fico feliz que tenha ficado satisfeito. Estamos sempre à disposição.', 'Obrigado pelo feedback! Vamos melhorar. Esperamos voltar a trabalhar consigo.', 'Agradecemos a confiança! Qualquer questão contacte-nos no WhatsApp.']
    let avalCount = 0
    for (let i = 0; i < vendasEntregues.length; i++) {
      const { rows: [v] } = await db.query('SELECT comprador_id,fornecedor_id FROM vendas WHERE id=$1', [vendasEntregues[i]])
      const nota = notasAval[i % notasAval.length]
      const coments = comentarios[nota] ?? comentarios[4]
      await db.query(
        `INSERT INTO avaliacoes (venda_id,comprador_id,fornecedor_id,nota,comentario,resposta) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (venda_id) DO NOTHING`,
        [vendasEntregues[i], v.comprador_id, v.fornecedor_id, nota, aleatorio(coments), i < 4 ? aleatorio(respostas) : null])
      await db.query(
        `UPDATE fornecedores SET avaliacao_media=(SELECT ROUND(AVG(nota)::NUMERIC,2) FROM avaliacoes WHERE fornecedor_id=$1), total_avaliacoes=(SELECT COUNT(*) FROM avaliacoes WHERE fornecedor_id=$1) WHERE id=$1`,
        [v.fornecedor_id])
      avalCount++
    }
    log.push(`Avaliações: ${avalCount}`)

    // ── 13. Tickets SAC ────────────────────────────────────
    const statusTickets = ['resolvido','resolvido','em_atendimento','aberto','aberto']
    const prioridades   = ['normal','alta','normal','normal','alta']
    const msgUser = ['Boa tarde, o meu pedido foi cancelado sem explicação. Preciso de ajuda.', 'O meu pedido foi cancelado. Ainda não recebi o reembolso. O que aconteceu?', 'Tentei fazer pedido mas o fornecedor cancelou. Isto é normal?', 'Pedido cancelado. Podem ajudar a encontrar outro fornecedor para a mesma peça?']
    const msgAdmin = ['Pedimos desculpa! O fornecedor cancelou por falta de stock. Vamos ajudá-lo.', 'O cancelamento foi processado. O reembolso será feito em 3-5 dias úteis.', 'Acontece quando o fornecedor não tem stock. Podemos sugerir alternativas.', 'Vamos contactar o fornecedor. Aguarde 24h.']
    const { rows: [admin] } = await db.query("SELECT id FROM usuarios WHERE perfil='admin' LIMIT 1")
    let ticketsCount = 0
    for (let i = 0; i < vendasCanceladas.length; i++) {
      const { vendaId, compradorId } = vendasCanceladas[i]
      const stT = statusTickets[i % statusTickets.length]
      const { rows: [ticket] } = await db.query(
        `INSERT INTO tickets_sac (usuario_id,venda_id,assunto,descricao,tipo,prioridade,status,resolvido_em,criado_em)
         VALUES ($1,$2,'Pedido cancelado — necessito de ajuda',$3,'venda',$4,$5,$6,$7) RETURNING id`,
        [compradorId, vendaId, msgUser[i % msgUser.length], prioridades[i % prioridades.length], stT,
          stT === 'resolvido' ? diasAtras(Math.floor(Math.random() * 10) + 1) : null,
          diasAtras(Math.floor(Math.random() * 15) + 1)])
      await db.query(`INSERT INTO mensagens_sac (ticket_id,usuario_id,mensagem) VALUES ($1,$2,$3)`,
        [ticket.id, compradorId, msgUser[i % msgUser.length]])
      if (stT !== 'aberto' && admin) {
        await db.query(`INSERT INTO mensagens_sac (ticket_id,usuario_id,mensagem) VALUES ($1,$2,$3)`,
          [ticket.id, admin.id, msgAdmin[i % msgAdmin.length]])
        if (stT === 'resolvido') {
          await db.query(`INSERT INTO mensagens_sac (ticket_id,usuario_id,mensagem) VALUES ($1,$2,'Obrigado pela ajuda! Problema resolvido.')`,
            [ticket.id, compradorId])
        }
      }
      ticketsCount++
    }
    log.push(`Tickets SAC: ${ticketsCount}`)

    // ── 14. Movimentos manuais de stock ────────────────────
    for (let i = 0; i < Math.min(3, idsPecas.length); i++) {
      const { rows: [p] } = await db.query('SELECT estoque,fornecedor_id FROM pecas WHERE id=$1', [idsPecas[i]])
      if (!p) continue
      const qtd = (i + 1) * 5
      await db.query('UPDATE pecas SET estoque=estoque+$1 WHERE id=$2', [qtd, idsPecas[i]])
      await db.query(
        `INSERT INTO movimentos_estoque (peca_id,fornecedor_id,tipo,quantidade_anterior,quantidade_nova,variacao,motivo) VALUES ($1,$2,'stock_recebido',$3,$4,$5,'Reposição de stock — seed de teste')`,
        [idsPecas[i], p.fornecedor_id, p.estoque, p.estoque + qtd, qtd]).catch(() => {})
    }
    log.push('3 movimentos manuais de stock criados')

    // ── Contagens finais ───────────────────────────────────
    const contagens = await Promise.all([
      db.query("SELECT COUNT(*) FROM usuarios WHERE perfil='fornecedor'"),
      db.query("SELECT COUNT(*) FROM usuarios WHERE perfil='comprador'"),
      db.query('SELECT COUNT(*) FROM pecas'),
      db.query('SELECT COUNT(*) FROM vendas'),
      db.query('SELECT COUNT(*) FROM comissoes'),
      db.query('SELECT COUNT(*) FROM avaliacoes'),
      db.query('SELECT COUNT(*) FROM transportadoras'),
      db.query('SELECT COUNT(*) FROM zonas_entrega'),
      db.query('SELECT COUNT(*) FROM fretes'),
      db.query('SELECT COUNT(*) FROM tickets_sac'),
      db.query('SELECT COUNT(*) FROM mensagens_sac'),
      db.query('SELECT COUNT(*) FROM movimentos_estoque'),
    ])
    const nomes = ['fornecedores','compradores','pecas','vendas','comissoes','avaliacoes','transportadoras','zonas','fretes','tickets_sac','mensagens_sac','mov_estoque']
    const totais: Record<string, number> = {}
    contagens.forEach((r, i) => { totais[nomes[i]] = parseInt(r.rows[0].count as string) })

    return {
      ok: true,
      mensagem: 'Carga de dados de teste concluída com sucesso!',
      senha_teste: 'teste123',
      log,
      totais,
    }
  })

  // ── GET /seed/verificar — contagens de todas as tabelas ────────────────────
  servidor.get('/seed/verificar', async (req, reply) => {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_HABILITADO !== 'true') {
      return reply.status(404).send({ erro: 'Não encontrado' })
    }
    const chave = (req.query as { chave?: string }).chave
    if (chave !== 'kamba2026seed') {
      return reply.status(403).send({ erro: 'Não autorizado' })
    }

    const db = servidor.db

    const [
      totalUsuarios, admins, fornecedores, compradores,
      chaves, contratosActivos,
      pecasTotal, pecasActivas, pecasRascunho, pecasSuspensas,
      categorias,
      vendas, vendasEntregue, vendasConfirmado, vendasCancelado, vendasPendente,
      comissoes, totalComissoes,
      avaliacoes, mediaAvaliacao,
      transportadoras, zonas,
      fretes, fretesEntregue,
      tickets, ticketsAbertos, mensagens,
      movEstoque,
      contratos,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM usuarios'),
      db.query("SELECT COUNT(*) FROM usuarios WHERE perfil='admin'"),
      db.query("SELECT COUNT(*) FROM usuarios WHERE perfil='fornecedor'"),
      db.query("SELECT COUNT(*) FROM usuarios WHERE perfil='comprador'"),
      db.query('SELECT COUNT(*) FROM chaves_acesso'),
      db.query("SELECT COUNT(*) FROM contratos WHERE ativo=true"),
      db.query('SELECT COUNT(*) FROM pecas'),
      db.query("SELECT COUNT(*) FROM pecas WHERE status='activa'"),
      db.query("SELECT COUNT(*) FROM pecas WHERE status='rascunho'"),
      db.query("SELECT COUNT(*) FROM pecas WHERE status='suspenso'"),
      db.query('SELECT COUNT(*) FROM categorias'),
      db.query('SELECT COUNT(*) FROM vendas'),
      db.query("SELECT COUNT(*) FROM vendas WHERE status='entregue'"),
      db.query("SELECT COUNT(*) FROM vendas WHERE status IN ('confirmado','em_preparacao','enviado')"),
      db.query("SELECT COUNT(*) FROM vendas WHERE status='cancelado'"),
      db.query("SELECT COUNT(*) FROM vendas WHERE status='pendente'"),
      db.query('SELECT COUNT(*) FROM comissoes'),
      db.query('SELECT COALESCE(SUM(valor_comissao),0) FROM comissoes'),
      db.query('SELECT COUNT(*) FROM avaliacoes'),
      db.query('SELECT ROUND(AVG(nota),2) FROM avaliacoes'),
      db.query('SELECT COUNT(*) FROM transportadoras'),
      db.query('SELECT COUNT(*) FROM zonas_entrega'),
      db.query('SELECT COUNT(*) FROM fretes'),
      db.query("SELECT COUNT(*) FROM fretes WHERE status='entregue'"),
      db.query('SELECT COUNT(*) FROM tickets_sac'),
      db.query("SELECT COUNT(*) FROM tickets_sac WHERE status NOT IN ('fechado','resolvido')"),
      db.query('SELECT COUNT(*) FROM mensagens_sac'),
      db.query('SELECT COUNT(*) FROM movimentos_estoque'),
      db.query('SELECT COUNT(*) FROM contratos'),
    ])

    return {
      ok: true,
      verificado_em: new Date().toISOString(),
      tabelas: {
        usuarios: {
          total: parseInt(totalUsuarios.rows[0].count),
          admins: parseInt(admins.rows[0].count),
          fornecedores: parseInt(fornecedores.rows[0].count),
          compradores: parseInt(compradores.rows[0].count),
        },
        chaves_acesso:   parseInt(chaves.rows[0].count),
        contratos: {
          total:  parseInt(contratos.rows[0].count),
          activos: parseInt(contratosActivos.rows[0].count),
        },
        categorias: parseInt(categorias.rows[0].count),
        pecas: {
          total:    parseInt(pecasTotal.rows[0].count),
          activas:  parseInt(pecasActivas.rows[0].count),
          rascunho: parseInt(pecasRascunho.rows[0].count),
          suspensas: parseInt(pecasSuspensas.rows[0].count),
        },
        vendas: {
          total:      parseInt(vendas.rows[0].count),
          entregue:   parseInt(vendasEntregue.rows[0].count),
          em_curso:   parseInt(vendasConfirmado.rows[0].count),
          cancelado:  parseInt(vendasCancelado.rows[0].count),
          pendente:   parseInt(vendasPendente.rows[0].count),
        },
        comissoes: {
          total:       parseInt(comissoes.rows[0].count),
          valor_total_kz: parseFloat(totalComissoes.rows[0].coalesce),
        },
        avaliacoes: {
          total: parseInt(avaliacoes.rows[0].count),
          media: parseFloat(mediaAvaliacao.rows[0].round ?? '0'),
        },
        transportadoras: parseInt(transportadoras.rows[0].count),
        zonas_entrega:   parseInt(zonas.rows[0].count),
        fretes: {
          total:    parseInt(fretes.rows[0].count),
          entregue: parseInt(fretesEntregue.rows[0].count),
        },
        tickets_sac: {
          total:   parseInt(tickets.rows[0].count),
          abertos: parseInt(ticketsAbertos.rows[0].count),
          mensagens: parseInt(mensagens.rows[0].count),
        },
        movimentos_estoque: parseInt(movEstoque.rows[0].count),
      },
    }
  })
}
