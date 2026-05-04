/**
 * Seed de dados de teste — KambaFeira
 * Cria ~157 registos para testar todas as funcionalidades do sistema.
 *
 * Executar: npx tsx src/services/seed-teste.ts
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
})

// ── Utilitários ────────────────────────────────────────────────
function diasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Dados base ─────────────────────────────────────────────────
const SENHA_TESTE = 'teste123'

const NOVOS_FORNECEDORES = [
  { nome: 'Carlos Eduardo Mbemba',  email: 'carlos.mbemba@teste.ao',  tipo: 'desmanche',    provincia: 'Luanda',   whatsapp: '244923111001', nome_empresa: 'Auto Peças Luanda' },
  { nome: 'Helena Ferreira Costa',  email: 'helena.costa@teste.ao',   tipo: 'stand',         provincia: 'Benguela', whatsapp: '244923111002', nome_empresa: 'Stand Motor Sul' },
  { nome: 'Joaquim Teixeira Neto',  email: 'joaquim.neto@teste.ao',   tipo: 'independente',  provincia: 'Huambo',   whatsapp: '244923111003', nome_empresa: 'Oficina Central KW' },
]

const NOVOS_COMPRADORES = [
  { nome: 'António Sebastião',     email: 'antonio@teste.ao',  telefone: '244912001001' },
  { nome: 'Maria da Conceição',    email: 'maria@teste.ao',    telefone: '244912001002' },
  { nome: 'Pedro Luvualu',         email: 'pedro@teste.ao',    telefone: '244912001003' },
  { nome: 'Fátima Neto Silva',     email: 'fatima@teste.ao',   telefone: '244912001004' },
]

const TAXAS_COMISSAO = [10.00, 9.00, 8.00, 11.00, 10.00]

const TRANSPORTADORAS = [
  { nome: 'Expresso Angola',        telefone: '244222333001', whatsapp: '244923444001' },
  { nome: 'Moto Entrega Rápida',    telefone: '244222333002', whatsapp: '244923444002' },
  { nome: 'Nacional Logística',     telefone: '244222333003', whatsapp: '244923444003' },
]

// Zonas: [provincia_origem, provincia_destino, preco_base, preco_por_kg, preco_por_km, distancia_km]
const ZONAS: Record<string, [string, string, number, number, number, number][]> = {
  'Expresso Angola': [
    ['Luanda', 'Luanda',   1500, 100, 1,  30],
    ['Luanda', 'Benguela', 3500, 150, 2, 520],
    ['Luanda', 'Huambo',   4000, 150, 2, 630],
    ['Luanda', 'Cabinda',  4500, 200, 3, 600],
  ],
  'Moto Entrega Rápida': [
    ['Luanda', 'Luanda',   800,  80,  1,  20],
    ['Luanda', 'Luanda',   800,  80,  1,  25],
  ],
  'Nacional Logística': [
    ['Luanda', 'Luanda',   1200, 90,  1,  30],
    ['Luanda', 'Benguela', 3000, 130, 2, 520],
    ['Luanda', 'Huambo',   3800, 140, 2, 630],
    ['Luanda', 'Huíla',    4200, 160, 2, 800],
    ['Luanda', 'Malanje',  3200, 130, 2, 380],
    ['Luanda', 'Cabinda',  4000, 180, 3, 600],
    ['Luanda', 'Namibe',   4500, 170, 2, 750],
  ],
}

// 20 peças novas
const NOVAS_PECAS = [
  { titulo: 'Filtro de Óleo Toyota Corolla 2010-2018',         categoria: 'motor-transmissao',         condicao: 'novo',       preco: 8500,   estoque: 15, marca: 'Toyota',     modelo: 'Corolla',        ano_de: 2010, ano_ate: 2018 },
  { titulo: 'Pastilhas de Travão Dianteiras Hyundai Tucson',   categoria: 'travagem',                  condicao: 'bom',        preco: 22000,  estoque: 8,  marca: 'Hyundai',    modelo: 'Tucson',         ano_de: 2011, ano_ate: 2019 },
  { titulo: 'Amortecedor Dianteiro Kia Sportage 2012-2016',    categoria: 'suspensao-direccao',        condicao: 'bom',        preco: 45000,  estoque: 4,  marca: 'Kia',        modelo: 'Sportage',       ano_de: 2012, ano_ate: 2016 },
  { titulo: 'Correia Dentada Honda Civic 1.8',                 categoria: 'motor-transmissao',         condicao: 'novo',       preco: 18500,  estoque: 20, marca: 'Honda',      modelo: 'Civic',          ano_de: 2012, ano_ate: 2020 },
  { titulo: 'Radiador Toyota Hilux 2.5D',                      categoria: 'motor-transmissao',         condicao: 'regular',    preco: 85000,  estoque: 3,  marca: 'Toyota',     modelo: 'Hilux',          ano_de: 2008, ano_ate: 2015 },
  { titulo: 'Bomba d\'Água Ford Ranger 3.0',                   categoria: 'motor-transmissao',         condicao: 'bom',        preco: 38000,  estoque: 6,  marca: 'Ford',       modelo: 'Ranger',         ano_de: 2009, ano_ate: 2016 },
  { titulo: 'Velas de Ignição Nissan X-Trail (jogo 4)',        categoria: 'electricidade-electronica', condicao: 'novo',       preco: 12000,  estoque: 25, marca: 'Nissan',     modelo: 'X-Trail',        ano_de: 2010, ano_ate: 2020 },
  { titulo: 'Sensor de Oxigénio Toyota RAV4',                  categoria: 'electricidade-electronica', condicao: 'bom',        preco: 28000,  estoque: 7,  marca: 'Toyota',     modelo: 'RAV4',           ano_de: 2013, ano_ate: 2019 },
  { titulo: 'Disco de Embraiagem Mitsubishi L200',             categoria: 'motor-transmissao',         condicao: 'regular',    preco: 67000,  estoque: 5,  marca: 'Mitsubishi', modelo: 'L200',           ano_de: 2007, ano_ate: 2016 },
  { titulo: 'Espelho Retrovisor Esquerdo BMW X5',              categoria: 'carrocaria-vidros',         condicao: 'bom',        preco: 55000,  estoque: 2,  marca: 'BMW',        modelo: 'X5',             ano_de: 2010, ano_ate: 2018 },
  { titulo: 'Para-choques Dianteiro Toyota Prado 150',         categoria: 'carrocaria-vidros',         condicao: 'regular',    preco: 120000, estoque: 2,  marca: 'Toyota',     modelo: 'Land Cruiser Prado', ano_de: 2009, ano_ate: 2022 },
  { titulo: 'Manga de Eixo Dianteira Chevrolet S10',           categoria: 'suspensao-direccao',        condicao: 'bom',        preco: 42000,  estoque: 4,  marca: 'Chevrolet',  modelo: 'S10',            ano_de: 2008, ano_ate: 2018 },
  { titulo: 'Bomba de Combustível Ford F-250',                 categoria: 'escape-combustivel',        condicao: 'bom',        preco: 35000,  estoque: 6,  marca: 'Ford',       modelo: 'F-250',          ano_de: 2010, ano_ate: 2020 },
  { titulo: 'Condensador de AC Hyundai Elantra',               categoria: 'ar-condicionado',           condicao: 'novo',       preco: 48000,  estoque: 5,  marca: 'Hyundai',    modelo: 'Elantra',        ano_de: 2012, ano_ate: 2020 },
  { titulo: 'Intercooler Mitsubishi Pajero Sport',             categoria: 'motor-transmissao',         condicao: 'bom',        preco: 95000,  estoque: 3,  marca: 'Mitsubishi', modelo: 'Pajero Sport',   ano_de: 2011, ano_ate: 2019 },
  { titulo: 'Módulo de Injecção Toyota Hilux 3.0',             categoria: 'electricidade-electronica', condicao: 'bom',        preco: 185000, estoque: 2,  marca: 'Toyota',     modelo: 'Hilux',          ano_de: 2010, ano_ate: 2018 },
  { titulo: 'Compressor de AC Kia Cerato 2014-2018',           categoria: 'ar-condicionado',           condicao: 'regular',    preco: 72000,  estoque: 3,  marca: 'Kia',        modelo: 'Cerato',         ano_de: 2014, ano_ate: 2018 },
  { titulo: 'Disco de Travão Traseiro Volkswagen Tiguan',      categoria: 'travagem',                  condicao: 'novo',       preco: 31000,  estoque: 10, marca: 'Volkswagen', modelo: 'Tiguan',         ano_de: 2012, ano_ate: 2020 },
  { titulo: 'Tensor da Correia Renault Duster 1.6',            categoria: 'motor-transmissao',         condicao: 'bom',        preco: 19500,  estoque: 8,  marca: 'Renault',    modelo: 'Duster',         ano_de: 2012, ano_ate: 2020 },
  { titulo: 'Caixa de Direção Assistida Toyota Land Cruiser',  categoria: 'suspensao-direccao',        condicao: 'regular',    preco: 210000, estoque: 1,  marca: 'Toyota',     modelo: 'Land Cruiser',   ano_de: 2008, ano_ate: 2016 },
]

const COMENTARIOS_AVALIACOES: Record<number, string[]> = {
  5: [
    'Excelente peça! Chegou rápido e em perfeito estado. Muito recomendo este fornecedor.',
    'Peça original, embalagem cuidada. Já instalei e funcionou na primeira.',
    'Serviço de topo. Fornecedor honesto, peça como descrita. Voltarei a comprar.',
  ],
  4: [
    'Boa peça, chegou em 3 dias. Só demora um pouco na confirmação mas no geral satisfeito.',
    'Produto conforme descrito. Entrega um pouco demorada mas chegou em bom estado.',
    'Bom fornecedor, peça de qualidade. Recomendo.',
  ],
  3: [
    'Peça chegou mas a embalagem estava um pouco danificada. A peça em si está boa.',
    'Demorou mais do que esperado mas o produto está em bom estado. Poderia comunicar melhor.',
  ],
}

const RESPOSTAS_FORNECEDOR = [
  'Obrigado pela avaliação! Fico feliz que a peça tenha chegado em bom estado. Estamos sempre à disposição.',
  'Obrigado pelo feedback! Vamos melhorar o tempo de entrega. Esperamos voltar a trabalhar consigo.',
  'Agradecemos a confiança! Qualquer questão estamos disponíveis no WhatsApp.',
  'Obrigado! Trabalhamos para garantir a melhor qualidade. Até à próxima.',
]

const NOTAS_FORNECEDOR = [
  'Por favor confirme com urgência, preciso da peça para amanhã.',
  'Aceito retirada no local se possível.',
  'Pode embalar bem, é para transportar para o interior.',
  null,
  null,
]

const MOTIVOS_CANCELAMENTO = [
  'Encontrei a peça localmente por melhor preço.',
  'Preciso de cancelar, o carro foi vendido.',
  'A peça não era compatível com o meu modelo.',
  'Demora na confirmação, precisei resolver urgente.',
]

const MENSAGENS_SAC_UTILIZADOR = [
  'Boa tarde, fiz um pedido há 5 dias e foi cancelado sem explicação. Preciso de ajuda.',
  'O meu pedido foi cancelado mas ainda não recebi o meu dinheiro de volta. O que aconteceu?',
  'Tentei fazer pedido mas o fornecedor cancelou. Isto é normal na plataforma?',
  'Olá, o meu pedido foi cancelado. Podem ajudar-me a encontrar outro fornecedor para a mesma peça?',
]

const MENSAGENS_SAC_ADMIN = [
  'Bom dia! Pedimos desculpa pelo inconveniente. O fornecedor cancelou por falta de stock. Vamos ajudá-lo a encontrar alternativa.',
  'Olá! O cancelamento foi processado pelo fornecedor. O reembolso será feito em 3-5 dias úteis.',
  'Boa tarde! Sim, acontece quando o fornecedor não tem stock disponível. Podemos sugerir fornecedores alternativos.',
  'Olá! Vamos entrar em contacto com o fornecedor para perceber o motivo. Aguarde 24h.',
]

const PROVINCIAS_ENDERECOS = [
  { provincia: 'Luanda',   municipio: 'Luanda',      bairro: 'Miramar',        referencia: 'Próximo ao Hotel Presidente' },
  { provincia: 'Luanda',   municipio: 'Viana',       bairro: 'Kilamba',        referencia: 'Bloco 21, Apartamento 4B' },
  { provincia: 'Benguela', municipio: 'Benguela',    bairro: 'Bairro Praia',   referencia: 'Casa amarela perto da praia' },
  { provincia: 'Huambo',   municipio: 'Huambo',      bairro: 'Centro',         referencia: 'Rua da Juventude, nº 45' },
  { provincia: 'Luanda',   municipio: 'Talatona',    bairro: 'Camama',         referencia: 'Condomínio Solar, Lote 12' },
]

// ── Script principal ───────────────────────────────────────────
async function correrSeed() {
  console.log('\n🚀 KambaFeira — Seed de dados de teste')
  console.log('═'.repeat(50))

  const hash = await bcrypt.hash(SENHA_TESTE, 10)

  // ── 1. Buscar dados existentes ─────────────────────────────
  console.log('\n📊 A verificar dados existentes...')

  const { rows: categoriasExistentes } = await db.query(
    'SELECT id, slug FROM categorias WHERE ativa = true'
  )
  const catPorSlug: Record<string, string> = {}
  categoriasExistentes.forEach(c => { catPorSlug[c.slug] = c.id as string })

  const { rows: fornecedoresExistentes } = await db.query(
    'SELECT f.id, u.nome, u.email FROM fornecedores f JOIN usuarios u ON f.usuario_id = u.id'
  )
  console.log(`   Fornecedores existentes: ${fornecedoresExistentes.length}`)

  const { rows: compradoresExistentes } = await db.query(
    "SELECT id, nome FROM usuarios WHERE perfil = 'comprador'"
  )
  console.log(`   Compradores existentes: ${compradoresExistentes.length}`)

  const { rows: pecasExistentes } = await db.query(
    "SELECT id, fornecedor_id FROM pecas WHERE status = 'activo'"
  )
  console.log(`   Peças existentes: ${pecasExistentes.length}`)

  // ── 2. Criar novos fornecedores ────────────────────────────
  console.log('\n👤 A criar fornecedores...')
  const idsFornecedores: string[] = fornecedoresExistentes.map(f => f.id as string)

  for (const f of NOVOS_FORNECEDORES) {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [f.email])
    if (existe.rows.length > 0) {
      console.log(`   ⚠️  Fornecedor já existe: ${f.email}`)
      // obter fornecedor_id
      const forn = await db.query(
        'SELECT f.id FROM fornecedores f JOIN usuarios u ON f.usuario_id = u.id WHERE u.email = $1',
        [f.email]
      )
      if (forn.rows.length > 0) idsFornecedores.push(forn.rows[0].id as string)
      continue
    }
    const { rows: [u] } = await db.query(
      `INSERT INTO usuarios (email, password_hash, perfil, nome, telefone)
       VALUES ($1, $2, 'fornecedor', $3, $4) RETURNING id`,
      [f.email, hash, f.nome, f.whatsapp]
    )
    const { rows: [forn] } = await db.query(
      `INSERT INTO fornecedores (usuario_id, nome_empresa, tipo, provincia, whatsapp, verificado)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [u.id, f.nome_empresa, f.tipo, f.provincia, f.whatsapp]
    )
    idsFornecedores.push(forn.id as string)
    console.log(`   ✅ Fornecedor criado: ${f.nome} (${f.provincia})`)
  }

  // ── 3. Criar novos compradores ─────────────────────────────
  console.log('\n👤 A criar compradores...')
  const idsCompradores: string[] = compradoresExistentes.map(c => c.id as string)

  for (const c of NOVOS_COMPRADORES) {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [c.email])
    if (existe.rows.length > 0) {
      console.log(`   ⚠️  Comprador já existe: ${c.email}`)
      idsCompradores.push(existe.rows[0].id as string)
      continue
    }
    const { rows: [u] } = await db.query(
      `INSERT INTO usuarios (email, password_hash, perfil, nome, telefone)
       VALUES ($1, $2, 'comprador', $3, $4) RETURNING id`,
      [c.email, hash, c.nome, c.telefone]
    )
    idsCompradores.push(u.id as string)
    console.log(`   ✅ Comprador criado: ${c.nome}`)
  }

  // ── 4. Contratos para todos os fornecedores ────────────────
  console.log('\n💰 A criar contratos...')
  for (let i = 0; i < idsFornecedores.length; i++) {
    const taxa = TAXAS_COMISSAO[i % TAXAS_COMISSAO.length]
    const existeContrato = await db.query(
      'SELECT id FROM contratos WHERE fornecedor_id = $1 AND ativo = true',
      [idsFornecedores[i]]
    )
    if (existeContrato.rows.length > 0) {
      console.log(`   ⚠️  Contrato já existe para fornecedor ${i + 1}`)
      continue
    }
    await db.query(
      `INSERT INTO contratos (fornecedor_id, taxa_comissao, ativo)
       VALUES ($1, $2, true)`,
      [idsFornecedores[i], taxa]
    )
    console.log(`   ✅ Contrato criado: ${taxa}% para fornecedor ${i + 1}`)
  }

  // ── 5. Transportadoras e zonas ─────────────────────────────
  console.log('\n🚚 A criar transportadoras e zonas...')
  const idsTransportadoras: string[] = []
  const idsZonas: string[] = []

  for (const t of TRANSPORTADORAS) {
    const existe = await db.query('SELECT id FROM transportadoras WHERE nome = $1', [t.nome])
    let tid: string
    if (existe.rows.length > 0) {
      tid = existe.rows[0].id as string
      console.log(`   ⚠️  Transportadora já existe: ${t.nome}`)
    } else {
      const { rows: [tr] } = await db.query(
        `INSERT INTO transportadoras (nome, telefone, whatsapp) VALUES ($1, $2, $3) RETURNING id`,
        [t.nome, t.telefone, t.whatsapp]
      )
      tid = tr.id as string
      console.log(`   ✅ Transportadora criada: ${t.nome}`)
    }
    idsTransportadoras.push(tid)

    const zonas = ZONAS[t.nome] ?? []
    for (const [orig, dest, base, pkg, pkm, dist] of zonas) {
      const existeZona = await db.query(
        'SELECT id FROM zonas_entrega WHERE transportadora_id = $1 AND provincia_origem = $2 AND provincia_destino = $3',
        [tid, orig, dest]
      )
      if (existeZona.rows.length > 0) {
        idsZonas.push(existeZona.rows[0].id as string)
        continue
      }
      const { rows: [z] } = await db.query(
        `INSERT INTO zonas_entrega (transportadora_id, provincia_origem, provincia_destino, preco_base, preco_por_kg, preco_por_km, distancia_km)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [tid, orig, dest, base, pkg, pkm, dist]
      )
      idsZonas.push(z.id as string)
    }
  }
  console.log(`   ✅ ${idsZonas.length} zonas de entrega criadas`)

  // ── 6. 20 novas peças ──────────────────────────────────────
  console.log('\n🔧 A criar peças...')
  const idsPecas: string[] = pecasExistentes.map(p => p.id as string)

  for (let i = 0; i < NOVAS_PECAS.length; i++) {
    const p = NOVAS_PECAS[i]
    const catId = catPorSlug[p.categoria]
    if (!catId) { console.log(`   ⚠️  Categoria não encontrada: ${p.categoria}`); continue }

    const fornId = idsFornecedores[i % idsFornecedores.length]
    const { rows: [peca] } = await db.query(
      `INSERT INTO pecas
         (fornecedor_id, categoria_id, titulo, descricao, preco, condicao,
          marca_veiculo, modelo_veiculo, ano_veiculo_de, ano_veiculo_ate,
          estoque, status, publicada_em, criada_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'activo',NOW(),$12)
       RETURNING id`,
      [
        fornId, catId, p.titulo,
        `${p.titulo}. Condição: ${p.condicao}. Compatível com ${p.marca} ${p.modelo} de ${p.ano_de} a ${p.ano_ate}. Peça testada e em bom funcionamento. Entrega disponível em todo o país.`,
        p.preco, p.condicao === 'bom' ? 'bom' : p.condicao === 'novo' ? 'novo' : 'regular',
        p.marca, p.modelo, p.ano_de, p.ano_ate,
        p.estoque,
        diasAtras(Math.floor(Math.random() * 60) + 5),
      ]
    )
    idsPecas.push(peca.id as string)
  }
  console.log(`   ✅ 20 peças criadas`)

  // ── 7. Endereços de entrega ────────────────────────────────
  console.log('\n🏠 A criar endereços de entrega...')
  const idsEnderecos: string[] = []

  for (let i = 0; i < idsCompradores.length && i < PROVINCIAS_ENDERECOS.length; i++) {
    const e = PROVINCIAS_ENDERECOS[i]
    const existeEnd = await db.query(
      'SELECT id FROM enderecos_entrega WHERE usuario_id = $1 LIMIT 1',
      [idsCompradores[i]]
    )
    if (existeEnd.rows.length > 0) {
      idsEnderecos.push(existeEnd.rows[0].id as string)
      continue
    }
    const { rows: [end] } = await db.query(
      `INSERT INTO enderecos_entrega (usuario_id, nome, provincia, municipio, bairro, referencia, principal)
       VALUES ($1,'Casa',$2,$3,$4,$5,true) RETURNING id`,
      [idsCompradores[i], e.provincia, e.municipio, e.bairro, e.referencia]
    )
    idsEnderecos.push(end.id as string)
  }
  console.log(`   ✅ ${idsEnderecos.length} endereços criados`)

  // ── 8. Vendas / Pedidos ────────────────────────────────────
  console.log('\n🛒 A criar pedidos...')

  // Definição dos 22 pedidos: [status, diasAtras, compradorIdx, pecaIdx, quantidade]
  const PEDIDOS: [string, number, number, number, number][] = [
    // Entregues (8) — vão gerar comissões e avaliações
    ['entregue',       60, 0, 0,  1],
    ['entregue',       55, 0, 3,  2],
    ['entregue',       50, 1, 1,  1],
    ['entregue',       45, 1, 6,  4],
    ['entregue',       40, 2, 4,  1],
    ['entregue',       35, 2, 7,  1],
    ['entregue',       30, 3, 2,  1],
    ['entregue',       25, 3, 9,  1],
    // Enviados (3)
    ['enviado',        10, 0, 5,  1],
    ['enviado',         8, 1, 8,  1],
    ['enviado',         6, 4 % idsCompradores.length, 10, 1],
    // Em preparação (3)
    ['em_preparacao',   5, 2, 11, 1],
    ['em_preparacao',   4, 3, 13, 1],
    ['em_preparacao',   3, 4 % idsCompradores.length, 14, 2],
    // Confirmados (2)
    ['confirmado',      2, 0, 15, 1],
    ['confirmado',      2, 1, 17, 1],
    // Cancelados (4) — vão gerar tickets SAC
    ['cancelado',      20, 0, 16, 1],
    ['cancelado',      18, 1, 18, 1],
    ['cancelado',      15, 2, 19, 1],
    ['cancelado',      12, 3, 12, 1],
    // Pendentes (2)
    ['pendente',        1, 2, 5,  1],
    ['pendente',        1, 3, 6,  1],
  ]

  const idsVendas: string[] = []
  const vendasEntregues: string[] = []
  const vendasCanceladas: Array<{ vendaId: string; compradorId: string }> = []

  for (const [status, dias, ci, pi, qtd] of PEDIDOS) {
    const compradorId = idsCompradores[ci] ?? idsCompradores[0]
    const peca = await db.query('SELECT id, preco, fornecedor_id FROM pecas WHERE id = $1', [idsPecas[pi] ?? idsPecas[0]])
    if (!peca.rows[0]) continue

    const { id: pecaId, preco, fornecedor_id: fornecedorId } = peca.rows[0] as { id: string; preco: string; fornecedor_id: string }
    const precoTotal = parseFloat(preco) * qtd
    const criada_em = diasAtras(dias)
    const metodos = ['Transferência bancária', 'Cash on delivery', 'Pagamento na entrega']

    const { rows: [venda] } = await db.query(
      `INSERT INTO vendas
         (peca_id, fornecedor_id, comprador_id, quantidade, preco_unitario, preco_total,
          status, metodo_pagamento, notas_comprador, motivo_cancelamento, cancelado_por, criada_em, atualizada_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
       RETURNING id`,
      [
        pecaId, fornecedorId, compradorId, qtd, preco, precoTotal,
        status, aleatorio(metodos),
        aleatorio(NOTAS_FORNECEDOR),
        status === 'cancelado' ? aleatorio(MOTIVOS_CANCELAMENTO) : null,
        status === 'cancelado' ? aleatorio(['comprador', 'fornecedor']) : null,
        criada_em,
      ]
    )

    idsVendas.push(venda.id as string)
    if (status === 'entregue') vendasEntregues.push(venda.id as string)
    if (status === 'cancelado') vendasCanceladas.push({ vendaId: venda.id as string, compradorId })

    // Debitar stock
    await db.query(
      'UPDATE pecas SET estoque = GREATEST(0, estoque - $1) WHERE id = $2',
      [status === 'cancelado' ? 0 : qtd, pecaId]
    )

    // Registar movimento de stock
    if (status !== 'cancelado' && status !== 'pendente') {
      await db.query(
        `INSERT INTO movimentos_estoque
           (peca_id, fornecedor_id, tipo, quantidade_anterior, quantidade_nova, variacao, venda_id)
         VALUES ($1,$2,'venda_plataforma',$3,$4,$5,$6)`,
        [pecaId, fornecedorId, qtd + qtd, qtd, -qtd, venda.id]
      ).catch(() => {})
    }
    if (status === 'cancelado') {
      await db.query(
        `INSERT INTO movimentos_estoque
           (peca_id, fornecedor_id, tipo, quantidade_anterior, quantidade_nova, variacao, venda_id)
         VALUES ($1,$2,'cancelamento',0,$3,$3,$4)`,
        [pecaId, fornecedorId, qtd, venda.id]
      ).catch(() => {})
    }
  }
  console.log(`   ✅ ${idsVendas.length} pedidos criados`)

  // ── 9. Comissões para pedidos entregues ───────────────────
  console.log('\n💰 A calcular comissões...')
  for (const vendaId of vendasEntregues) {
    const { rows: [v] } = await db.query(
      'SELECT fornecedor_id, preco_total FROM vendas WHERE id = $1',
      [vendaId]
    )
    const { rows: [contrato] } = await db.query(
      'SELECT taxa_comissao FROM contratos WHERE fornecedor_id = $1 AND ativo = true LIMIT 1',
      [v.fornecedor_id]
    )
    const taxa = contrato ? parseFloat(contrato.taxa_comissao) : 10.00
    const valorVenda = parseFloat(v.preco_total)
    const valorComissao = valorVenda * taxa / 100
    const valorLiquido = valorVenda - valorComissao

    await db.query(
      `INSERT INTO comissoes (venda_id, fornecedor_id, valor_venda, taxa_aplicada, valor_comissao, valor_liquido)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (venda_id) DO NOTHING`,
      [vendaId, v.fornecedor_id, valorVenda, taxa, valorComissao, valorLiquido]
    )
    await db.query(
      'UPDATE fornecedores SET total_vendas = total_vendas + 1 WHERE id = $1',
      [v.fornecedor_id]
    )
  }
  console.log(`   ✅ ${vendasEntregues.length} comissões registadas`)

  // ── 10. Fretes para pedidos entregues/enviados/em_prep ─────
  console.log('\n📦 A criar fretes...')
  let fretesCount = 0

  const statusFrete: Record<string, string> = {
    'entregue':      'entregue',
    'enviado':       'em_transito',
    'em_preparacao': 'pendente',
  }

  for (const vendaId of idsVendas) {
    const { rows: [v] } = await db.query(
      'SELECT id, comprador_id, status FROM vendas WHERE id = $1', [vendaId]
    )
    if (!statusFrete[v.status as string]) continue

    const endIdx = idsCompradores.indexOf(v.comprador_id as string)
    const enderecoId = endIdx >= 0 && endIdx < idsEnderecos.length ? idsEnderecos[endIdx] : idsEnderecos[0]
    const transportadoraId = aleatorio(idsTransportadoras)
    const zonaId = aleatorio(idsZonas)

    const { rows: [zona] } = await db.query('SELECT * FROM zonas_entrega WHERE id = $1', [zonaId])
    const pesoKg = Math.round((Math.random() * 8 + 0.5) * 10) / 10
    const valorFrete = parseFloat(zona.preco_base) + (pesoKg * parseFloat(zona.preco_por_kg)) + (zona.distancia_km * parseFloat(zona.preco_por_km))

    await db.query(
      `INSERT INTO fretes
         (venda_id, transportadora_id, zona_id, endereco_id, endereco_texto,
          peso_kg, distancia_km, valor_frete, status, codigo_rastreio, previsao_entrega,
          entregue_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         (CURRENT_DATE + INTERVAL '3 days'),
         $11)
       ON CONFLICT (venda_id) DO NOTHING`,
      [
        vendaId, transportadoraId, zonaId, enderecoId,
        `${zona.provincia_destino}, Angola`,
        pesoKg, zona.distancia_km, Math.round(valorFrete),
        statusFrete[v.status as string],
        v.status === 'entregue' || v.status === 'enviado' ? `KF${Date.now().toString().slice(-8)}` : null,
        v.status === 'entregue' ? diasAtras(Math.floor(Math.random() * 5) + 1) : null,
      ]
    )
    fretesCount++
  }
  console.log(`   ✅ ${fretesCount} fretes criados`)

  // ── 11. Avaliações para pedidos entregues ─────────────────
  console.log('\n⭐ A criar avaliações...')
  const notas = [5, 5, 5, 4, 4, 4, 3, 3]
  let avalCount = 0

  for (let i = 0; i < vendasEntregues.length; i++) {
    const vendaId = vendasEntregues[i]
    const { rows: [v] } = await db.query(
      'SELECT comprador_id, fornecedor_id FROM vendas WHERE id = $1', [vendaId]
    )
    const nota = notas[i % notas.length]
    const comentarios = COMENTARIOS_AVALIACOES[nota]
    const comentario = aleatorio(comentarios)
    const temResposta = i < 4 // primeiros 4 têm resposta

    const { rows: [aval] } = await db.query(
      `INSERT INTO avaliacoes (venda_id, comprador_id, fornecedor_id, nota, comentario, resposta)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (venda_id) DO NOTHING
       RETURNING id`,
      [
        vendaId, v.comprador_id, v.fornecedor_id, nota, comentario,
        temResposta ? aleatorio(RESPOSTAS_FORNECEDOR) : null,
      ]
    )
    if (aval) {
      // Actualizar média do fornecedor
      await db.query(
        `UPDATE fornecedores SET
           avaliacao_media = (SELECT ROUND(AVG(nota)::NUMERIC,2) FROM avaliacoes WHERE fornecedor_id = $1),
           total_avaliacoes = (SELECT COUNT(*) FROM avaliacoes WHERE fornecedor_id = $1)
         WHERE id = $1`,
        [v.fornecedor_id]
      )
      avalCount++
    }
  }
  console.log(`   ✅ ${avalCount} avaliações criadas`)

  // ── 12. Tickets SAC para pedidos cancelados ───────────────
  console.log('\n🎧 A criar tickets SAC...')
  const statusTickets = ['resolvido', 'resolvido', 'em_atendimento', 'aberto', 'aberto']
  const prioridades   = ['normal', 'alta', 'normal', 'normal', 'alta']
  let ticketsCount = 0

  for (let i = 0; i < vendasCanceladas.length; i++) {
    const { vendaId, compradorId } = vendasCanceladas[i]
    const stTicket = statusTickets[i % statusTickets.length]
    const prior = prioridades[i % prioridades.length]

    const { rows: [ticket] } = await db.query(
      `INSERT INTO tickets_sac
         (usuario_id, venda_id, assunto, descricao, tipo, prioridade, status,
          resolvido_em, criado_em)
       VALUES ($1,$2,$3,$4,'venda',$5,$6,$7,$8)
       RETURNING id`,
      [
        compradorId, vendaId,
        'Pedido cancelado — necessito de ajuda',
        MENSAGENS_SAC_UTILIZADOR[i % MENSAGENS_SAC_UTILIZADOR.length],
        prior, stTicket,
        stTicket === 'resolvido' ? diasAtras(Math.floor(Math.random() * 10) + 1) : null,
        diasAtras(Math.floor(Math.random() * 15) + 1),
      ]
    )

    // Mensagem inicial do utilizador
    await db.query(
      `INSERT INTO mensagens_sac (ticket_id, usuario_id, mensagem)
       VALUES ($1,$2,$3)`,
      [ticket.id, compradorId, MENSAGENS_SAC_UTILIZADOR[i % MENSAGENS_SAC_UTILIZADOR.length]]
    )

    // Resposta do admin (para tickets não apenas abertos)
    if (stTicket !== 'aberto') {
      const { rows: [admin] } = await db.query(
        "SELECT id FROM usuarios WHERE perfil = 'admin' LIMIT 1"
      )
      if (admin) {
        await db.query(
          `INSERT INTO mensagens_sac (ticket_id, usuario_id, mensagem)
           VALUES ($1,$2,$3)`,
          [ticket.id, admin.id, MENSAGENS_SAC_ADMIN[i % MENSAGENS_SAC_ADMIN.length]]
        )
        // Resposta final do utilizador nos resolvidos
        if (stTicket === 'resolvido') {
          await db.query(
            `INSERT INTO mensagens_sac (ticket_id, usuario_id, mensagem)
             VALUES ($1,$2,'Obrigado pela ajuda! Problema resolvido.')`,
            [ticket.id, compradorId]
          )
        }
      }
    }
    ticketsCount++
  }
  console.log(`   ✅ ${ticketsCount} tickets SAC criados`)

  // ── 13. Movimentos manuais de stock ────────────────────────
  console.log('\n📊 A criar movimentos manuais de stock...')
  const pecasParaAjuste = idsPecas.slice(0, 3)
  for (let i = 0; i < pecasParaAjuste.length; i++) {
    const { rows: [peca] } = await db.query(
      'SELECT estoque, fornecedor_id FROM pecas WHERE id = $1', [pecasParaAjuste[i]]
    )
    if (!peca) continue
    const qtdAdicional = (i + 1) * 5
    await db.query(
      'UPDATE pecas SET estoque = estoque + $1 WHERE id = $2', [qtdAdicional, pecasParaAjuste[i]]
    )
    await db.query(
      `INSERT INTO movimentos_estoque
         (peca_id, fornecedor_id, tipo, quantidade_anterior, quantidade_nova, variacao, motivo)
       VALUES ($1,$2,'stock_recebido',$3,$4,$5,'Reposição de stock — seed de teste')`,
      [
        pecasParaAjuste[i], peca.fornecedor_id,
        peca.estoque, peca.estoque + qtdAdicional, qtdAdicional,
      ]
    )
  }
  console.log(`   ✅ 3 movimentos manuais criados`)

  // ── Resumo final ───────────────────────────────────────────
  const counts = await Promise.all([
    db.query("SELECT COUNT(*) FROM usuarios WHERE perfil = 'fornecedor'"),
    db.query("SELECT COUNT(*) FROM usuarios WHERE perfil = 'comprador'"),
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
    db.query('SELECT COUNT(*) FROM contratos WHERE ativo = true'),
    db.query('SELECT COUNT(*) FROM enderecos_entrega'),
  ])

  console.log('\n' + '═'.repeat(50))
  console.log('✅ SEED CONCLUÍDO — Estado final da base de dados:')
  console.log('═'.repeat(50))
  const labels = ['Fornecedores','Compradores','Peças','Pedidos','Comissões','Avaliações','Transportadoras','Zonas entrega','Fretes','Tickets SAC','Mensagens SAC','Movimentos stock','Contratos activos','Endereços']
  counts.forEach((r, i) => {
    console.log(`   ${labels[i].padEnd(20)} ${r.rows[0].count}`)
  })
  console.log('\n🔑 Password de todos os utilizadores de teste: teste123')
  console.log('═'.repeat(50) + '\n')

  await db.end()
}

correrSeed().catch(err => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})
