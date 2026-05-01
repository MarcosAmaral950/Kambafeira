# KambaFeira — Arquitectura do Sistema

## Visão Geral

O sistema é uma aplicação web monorepo com duas apps separadas:
- `apps/web` → Frontend Next.js (PWA)
- `apps/api` → Backend Fastify (REST API)

Ambas correm na mesma instância Railway para minimizar custos no MVP.

---

## Arquitectura em Camadas

```
┌─────────────────────────────────────────────────┐
│  CLIENTES                                        │
│  Admin (3 fixos) | Fornecedor (convite) | Comprador (livre) │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / PWA
┌────────────────────▼────────────────────────────┐
│  FRONTEND — Next.js 14 + React + Tailwind        │
│  App Router · PWA · Service Worker               │
│  Optimizado para 3G/2G (cache offline)           │
└────────────────────┬────────────────────────────┘
                     │ REST API / JSON
┌────────────────────▼────────────────────────────┐
│  BACKEND — Node.js 20 + Fastify                  │
│  Auth | Catálogo | Vendas | Entregas | SAC        │
└────────────────────┬────────────────────────────┘
                     │ SQL (node-postgres)
┌────────────────────▼────────────────────────────┐
│  BASE DE DADOS — PostgreSQL 15 (Supabase)        │
│  15 tabelas · Triggers · Full-text search        │
└─────────────────────────────────────────────────┘
         │              │             │
    Cloudinary      WhatsApp      Railway
    (imagens)      (notif.)      (hosting)
```

---

## Frontend — Next.js 14

### Decisões técnicas

**Por que Next.js?**
- SSR (Server-Side Rendering) para SEO das peças no catálogo
- App Router com React Server Components reduz JS no cliente
- Suporte nativo a PWA com next-pwa
- Deploy simples no Railway com `next start`

**Por que PWA?**
- Angola tem conectividade instável (2G/3G)
- Cache do Service Worker permite navegar offline
- "Instalar no ecrã" sem necessidade de App Store
- Reduz consumo de dados (imagens cacheadas)

### Estrutura de páginas

```
app/
├── (publica)/
│   ├── page.tsx                  → Home / catálogo
│   ├── pecas/
│   │   ├── page.tsx              → Listagem com filtros
│   │   └── [id]/page.tsx         → Detalhe da peça
│   ├── fornecedores/[id]/page.tsx → Perfil do fornecedor
│   └── categorias/[slug]/page.tsx → Peças por categoria
├── (auth)/
│   ├── login/page.tsx
│   ├── registar/page.tsx
│   └── registar/fornecedor/page.tsx
├── dashboard/                    → Protegido (fornecedor)
│   ├── page.tsx                  → Resumo
│   ├── pecas/page.tsx            → Gerir peças
│   ├── vendas/page.tsx           → Pedidos recebidos
│   └── perfil/page.tsx
└── admin/                        → Protegido (admin)
    ├── page.tsx                  → Dashboard
    ├── usuarios/page.tsx
    ├── chaves/page.tsx
    ├── comissoes/page.tsx
    └── relatorios/page.tsx
```

### Optimização de imagens (Angola)

```js
// next.config.js
images: {
  domains: ['res.cloudinary.com'],
  formats: ['image/webp'],
  deviceSizes: [360, 414, 768],   // tamanhos de telemóvel comuns em Angola
  minimumCacheTTL: 86400,
}

// Cloudinary transform URL para thumbnails
// Original: https://res.cloudinary.com/kambafeira/image/upload/v1/pecas/motor.jpg
// Thumb 3G: https://res.cloudinary.com/kambafeira/image/upload/w_400,q_60,f_webp/v1/pecas/motor.jpg
```

---

## Backend — Fastify

### Por que Fastify?
- 2x mais rápido que Express nos benchmarks
- Schema validation nativo (via Ajv/Zod) — sem overhead adicional
- Plugin system organizado — cada domínio é um plugin
- Menor consumo de memória — importante para Railway free tier (512 MB RAM)

### Estrutura

```
apps/api/src/
├── server.ts                 → bootstrap do Fastify
├── plugins/
│   ├── db.ts                 → pool PostgreSQL (node-postgres)
│   ├── auth.ts               → JWT verify + decorators
│   ├── cors.ts               → CORS configurado para kambafeira.ao
│   └── cloudinary.ts         → cliente Cloudinary
├── routes/
│   ├── auth.ts
│   ├── pecas.ts
│   ├── categorias.ts
│   ├── vendas.ts
│   ├── fornecedores.ts
│   ├── avaliacoes.ts
│   ├── entregas.ts
│   ├── enderecos.ts
│   ├── sac.ts
│   └── admin.ts
├── services/
│   ├── auth.service.ts       → lógica de auth e tokens
│   ├── pecas.service.ts      → CRUD + pesquisa full-text
│   ├── vendas.service.ts     → fluxo de compra + comissões
│   ├── whatsapp.service.ts   → envio de notificações
│   └── cloudinary.service.ts → upload e transformação
├── schemas/
│   └── *.ts                  → schemas Zod por domínio
└── migrations/
    ├── 001_schema_inicial.sql
    └── 002_seed_admins.sql
```

### Autenticação e perfis

```
POST /auth/login
  → verifica email + bcrypt.compare(password, hash)
  → gera JWT com { id, perfil, nome }
  → regista sessão na tabela sessoes
  → retorna token

Middleware de auth (aplicado por rota):
  → extrai Bearer token
  → verifica JWT (assinatura + expiração)
  → verifica se sessão não foi revogada
  → decora request com request.usuario

Guardiões por perfil (decorators Fastify):
  → request.requerPerfil('admin')
  → request.requerPerfil('fornecedor')
  → request.requerPerfil('comprador', 'fornecedor', 'admin')
```

---

## Base de Dados — PostgreSQL / Supabase

### Por que Supabase?
- PostgreSQL gerido com backups automáticos diários
- Free tier generoso (500 MB, conexões ilimitadas)
- Dashboard visual para gestão e debug
- Auth integrado (usado como fallback para gestão de sessões)
- Facilidade de migração para instância paga quando necessário

### Decisão: sem ORM

Usamos `node-postgres` (pg) directamente porque:
- Controlo total das queries — sem magia escondida
- SQL gerado é previsível e debugável
- Sem overhead de hidratação de objectos
- Full-text search e triggers em PostgreSQL nativo
- Mais fácil para o desenvolvedor brasileiro adaptar

### Padrão de query (service layer)

```typescript
// pecas.service.ts
export async function listarPecas(filtros: FiltrosPecas, pool: Pool) {
  const { rows } = await pool.query(`
    SELECT p.*, f.nome as fornecedor_nome, f.avaliacao_media
    FROM pecas p
    JOIN fornecedores f ON f.id = p.fornecedor_id
    WHERE p.status = 'activo'
      AND ($1::text IS NULL OR to_tsvector('portuguese', p.titulo || ' ' || p.descricao) @@ plainto_tsquery('portuguese', $1))
      AND ($2::uuid IS NULL OR p.categoria_id = $2)
      AND ($3::numeric IS NULL OR p.preco >= $3)
      AND ($4::numeric IS NULL OR p.preco <= $4)
    ORDER BY p.criada_em DESC
    LIMIT $5 OFFSET $6
  `, [filtros.q, filtros.categoria_id, filtros.preco_min, filtros.preco_max, filtros.por_pagina, filtros.offset]);

  return rows;
}
```

### Full-text search em português

```sql
-- Index criado no schema.sql:
CREATE INDEX idx_pecas_fts ON pecas
    USING gin(to_tsvector('portuguese', titulo || ' ' || descricao));

-- Query de pesquisa:
WHERE to_tsvector('portuguese', titulo || ' ' || descricao)
   @@ plainto_tsquery('portuguese', 'motor polo 2018')
```

---

## Notificações WhatsApp

### Fluxo

```
Venda criada (POST /vendas)
  → vendas.service.ts cria registo na DB
  → whatsapp.service.ts envia mensagem ao fornecedor:

"🛒 Novo pedido na KambaFeira!
Peça: Motor 1.4 Polo 2018
Comprador: João Silva
Valor: 250 USD
Acesse kambafeira.ao/dashboard para confirmar."

Venda confirmada (PATCH /vendas/:id/status → confirmado)
  → notificação ao comprador:

"✅ O seu pedido foi confirmado!
Fornecedor: Auto Peças Luanda
Entre em contacto: +244 9xx xxx xxx
Acompanhe em kambafeira.ao/vendas/:id"
```

### Implementação

```typescript
// whatsapp.service.ts
const WHATSAPP_API = 'https://graph.facebook.com/v18.0';

export async function enviarMensagem(telefone: string, mensagem: string) {
  await fetch(`${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone.replace(/\D/g, ''),
      type: 'text',
      text: { body: mensagem },
    }),
  });
}
```

---

## Deploy — Railway

### Configuração

```toml
# railway.toml
[build]
builder = "NIXPACKS"

[[services]]
name = "api"
startCommand = "node apps/api/dist/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 30

[[services]]
name = "web"
startCommand = "node apps/web/.next/standalone/server.js"
```

### Variáveis de ambiente no Railway

```
DATABASE_URL          → connection string Supabase
JWT_SECRET            → string aleatória de 64 chars
CLOUDINARY_CLOUD_NAME → nome da conta Cloudinary
CLOUDINARY_API_KEY    → chave API Cloudinary
CLOUDINARY_API_SECRET → segredo Cloudinary
WHATSAPP_TOKEN        → token Meta Business
WHATSAPP_PHONE_ID     → ID do número WhatsApp
NEXT_PUBLIC_API_URL   → URL do backend no Railway
```

---

## Segurança

| Risco | Mitigação |
|-------|-----------|
| SQL Injection | Queries parametrizadas sempre ($1, $2...) — nunca string concatenation |
| XSS | Next.js escapa HTML por defeito; CSP headers no Fastify |
| Autenticação | bcrypt (cost=12) + JWT com expiração de 7 dias |
| Autorização | Middleware verifica perfil em todas as rotas protegidas |
| Upload de ficheiros | Cloudinary valida tipo MIME; tamanho máximo 5 MB por foto |
| Rate limiting | Fastify rate-limit plugin: 100 req/min por IP |
| CORS | Apenas kambafeira.ao e localhost em desenvolvimento |

---

## Custos Mensais MVP

| Serviço | Custo |
|---------|-------|
| Railway (backend + frontend) | ~5 USD |
| Supabase PostgreSQL | 0 USD (free tier) |
| Cloudinary CDN imagens | 0 USD (free tier, ~25 GB) |
| WhatsApp Business API | ~15 USD |
| Domínio kambafeira.ao | ~2 USD/mês |
| **Total tecnologia** | **~22 USD/mês** |

(Pessoal não incluído — ver relatório de custos completo)

---

## Como Arrancar o Desenvolvimento

```bash
# 1. Clonar / iniciar repositório
git init kambafeira && cd kambafeira

# 2. Copiar este pacote de especificações para a raiz
cp -r kambafeira-claude-code/* .

# 3. Instalar dependências
npm install

# 4. Configurar variáveis de ambiente
cp .env.example .env.local
# editar .env.local com as credenciais reais

# 5. Criar base de dados
psql $DATABASE_URL < docs/schema.sql

# 6. Arrancar em desenvolvimento
npm run dev   # inicia api (porta 3001) + web (porta 3000)
```
