# KambaFeira — Briefing Completo para Desenvolvimento

Este ficheiro é lido automaticamente pelo Claude Code em cada sessão.
Contém TODO o contexto necessário para construir o sistema KambaFeira.

---

## O Projecto

**KambaFeira** é um marketplace digital de peças usadas de automóveis em Angola (Luanda),
com visão de expandir para outras categorias no futuro.

- Domínio: kambafeira.ao
- Fase actual: MVP (Prova de Conceito) — 12 meses
- Custo total estimado: ~19.892 USD (com 10% contingência)

## Sociedade

| Empresa | Participação | Responsabilidade |
|---------|-------------|-----------------|
| Angola CIA | 70% | Operação local: fornecedores, campo, atendimento ao cliente |
| Brasil CIA | 30% | Desenvolvimento e gestão do sistema (site, banco de dados) |

## Identidade Visual

- **Paleta**: Vermelho #dc2626 · Preto #111111 · Ouro #f59e0b · Branco #ffffff
- **Tipografia**: Inter (UI) + fonte bold para logótipo
- **Logo**: Duas bandas (vermelho/KAMBA em cima, preto/FEIRA em baixo), separador dourado
- **Tagline**: "Feito em Angola · Para Angola"

---

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router) + React
- **Estilo**: Tailwind CSS
- **PWA**: Service Worker para cache offline (optimizado para 3G/2G angolano)
- **Auth**: JWT armazenado em httpOnly cookie

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify (mais rápido que Express, importante para Railway free tier)
- **Validação**: Zod para schemas de request/response
- **Auth**: bcrypt para passwords + JWT (jsonwebtoken)

### Base de Dados
- **Engine**: PostgreSQL 15 (via Supabase)
- **ORM**: Nenhum — usar pg (node-postgres) directamente para controlo total
- **Migrações**: ficheiros SQL numerados em /migrations/

### Serviços Externos
| Serviço | Uso | Custo |
|---------|-----|-------|
| Railway | Hosting backend + frontend | ~5 USD/mês |
| Supabase | PostgreSQL gerido + Auth | Free tier |
| Cloudinary | CDN de imagens (upload de peças) | Free tier |
| WhatsApp Business API (Meta) | Notificações e contacto | ~15 USD/mês |

---

## Modelo de Negócio

- **Comissão**: 8% a 12% por transacção concluída (cobrada ao fornecedor)
- **Compradores**: sem custo, registo livre
- **Fornecedores**: registo apenas com chave-convite gerada por admin

### Fluxo de uma venda
1. Fornecedor publica peça (fotos + preço + condição + localização)
2. Comprador encontra a peça via pesquisa/categoria
3. Comprador inicia pedido → notificação WhatsApp ao fornecedor
4. Fornecedor confirma → pagamento processado → comissão debitada automaticamente
5. Entrega coordenada com transportadora → rastreio disponível na plataforma
6. Comprador confirma recepção → avaliação do fornecedor

---

## Sistema de Acesso e Perfis

### Perfis de utilizador (3)

**admin**
- 3 contas fixas criadas no setup inicial (pré-seed)
- Pode gerar chaves-convite para fornecedores
- Acesso total: dashboard, relatórios, gestão de utilizadores, configurações
- Pode suspender/banir fornecedores

**fornecedor**
- Registo APENAS com chave-convite válida gerada por admin
- Pode publicar, editar e remover as suas peças
- Vê o seu dashboard de vendas e comissões
- Não vê dados de outros fornecedores

**comprador**
- Registo livre (email + password)
- Pode pesquisar, ver peças, iniciar pedidos e avaliar
- Histórico de compras pessoal

### Chaves-convite
- Geradas por admin, uso único
- Expiram ao fim de 30 dias se não usadas
- Associadas ao fornecedor no momento do registo
- Tabela: `chaves_acesso`

---

## Base de Dados — 15 Tabelas

Ver ficheiro completo em: `docs/schema.sql`

### Grupos de tabelas

| Grupo | Tabelas |
|-------|---------|
| Autenticação | usuarios, chaves_acesso, sessoes |
| Fornecedores | fornecedores, contratos |
| Catálogo | categorias, pecas |
| Comercial | vendas, comissoes, avaliacoes |
| Logística | transportadoras, zonas_entrega, enderecos_entrega, fretes |
| SAC | tickets_sac |

---

## Estrutura de Directórios do Projecto

```
kambafeira/
├── CLAUDE.md                  ← este ficheiro
├── docs/
│   ├── schema.sql             ← schema completo PostgreSQL
│   ├── api-spec.md            ← especificação de todos os endpoints
│   └── architecture.md        ← decisões técnicas detalhadas
├── apps/
│   ├── web/                   ← Next.js frontend (PWA)
│   │   ├── app/               ← App Router pages
│   │   ├── components/        ← componentes React
│   │   ├── lib/               ← utilitários, api client, auth
│   │   └── public/            ← assets estáticos
│   └── api/                   ← Fastify backend
│       ├── src/
│       │   ├── routes/        ← rotas por domínio
│       │   ├── plugins/       ← plugins Fastify (auth, db, cors)
│       │   ├── schemas/       ← schemas Zod
│       │   └── services/      ← lógica de negócio
│       └── migrations/        ← ficheiros SQL de migração
└── package.json               ← monorepo com npm workspaces
```

---

## Regras de Desenvolvimento

1. **Português em todo o código**: variáveis, comentários, mensagens de erro — tudo em PT-AO quando possível
2. **Mobile-first obrigatório**: o mercado angolano usa maioritariamente telemóvel
3. **PWA com cache**: qualquer página visitada deve funcionar offline parcialmente
4. **Imagens optimizadas**: usar next/image + Cloudinary transforms para servir WebP em 3G
5. **Sem ORM**: usar pg directamente — mais controlo, menos magia, mais fácil de debugar em Railway
6. **Migrations versionadas**: nunca alterar a base de dados sem um ficheiro de migração numerado
7. **Variáveis de ambiente**: nunca hardcodar credenciais — usar .env.local (dev) e variáveis Railway (prod)

## Variáveis de Ambiente Necessárias

```env
# Base de dados
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# WhatsApp
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...

# App
NEXT_PUBLIC_API_URL=https://api.kambafeira.ao
NODE_ENV=production
```

---

## Prioridade de Desenvolvimento (MVP)

### Fase 1 — Fundação (Meses 1-3)
- [ ] Setup monorepo (npm workspaces)
- [ ] Schema PostgreSQL + migrações iniciais
- [ ] Backend: auth completo (login, chave-convite, JWT)
- [ ] Backend: CRUD de peças (criar, listar, editar, remover)
- [ ] Frontend: páginas de auth (login, registo comprador, registo fornecedor)
- [ ] Frontend: catálogo de peças (listagem + detalhe)
- [ ] Upload de imagens via Cloudinary
- [ ] Deploy inicial no Railway

### Fase 2 — Lançamento (Meses 4-6)
- [ ] Fluxo de venda completo (pedido → confirmação → pagamento)
- [ ] Cálculo e registo de comissões
- [ ] Notificações WhatsApp (pedido recebido, confirmado, entregue)
- [ ] Dashboard fornecedor (vendas, comissões, peças activas)
- [ ] Dashboard admin (visão geral, gestão de utilizadores)
- [ ] Sistema de avaliações

### Fase 3 — Crescimento (Meses 7-9)
- [ ] Sistema de entregas (transportadoras, zonas, fretes)
- [ ] Rastreio de entrega
- [ ] SAC (tickets de suporte)
- [ ] Pesquisa avançada (filtros por categoria, preço, localização)
- [ ] PWA push notifications

### Fase 4 — Consolidação (Meses 10-12)
- [ ] Analytics dashboard para sócios
- [ ] Relatórios de desempenho
- [ ] Optimizações de performance
- [ ] Testes automatizados
- [ ] Auditoria de segurança
