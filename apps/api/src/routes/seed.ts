import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'

// Endpoint temporário de seed — remover após uso
export async function rotasSeed(servidor: FastifyInstance) {
  servidor.post('/seed/reset', async (req, reply) => {
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
}
