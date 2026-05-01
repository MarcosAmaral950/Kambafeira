# KambaFeira — Especificação da API REST

Base URL (produção): `https://api.kambafeira.ao/v1`
Base URL (desenvolvimento): `http://localhost:3001/v1`

Todas as respostas são JSON. Erros seguem o formato:
```json
{ "erro": "mensagem legível", "codigo": "CODIGO_ERRO" }
```

Autenticação: Bearer token JWT no header `Authorization: Bearer <token>`

---

## AUTH — /auth

### POST /auth/login
Login para todos os perfis.

**Body:**
```json
{ "email": "user@example.com", "password": "senha123" }
```
**Resposta 200:**
```json
{
  "token": "eyJ...",
  "usuario": { "id": "uuid", "nome": "...", "perfil": "comprador" }
}
```

### POST /auth/registar/comprador
Registo livre para compradores.

**Body:**
```json
{ "email": "...", "password": "...", "nome": "...", "telefone": "..." }
```

### POST /auth/registar/fornecedor
Registo com chave-convite (obrigatório).

**Body:**
```json
{
  "chave_convite": "abc123...",
  "email": "...", "password": "...", "nome": "...",
  "nome_empresa": "...", "tipo": "desmanche", "whatsapp": "...",
  "provincia": "Luanda", "municipio": "...", "bairro": "..."
}
```

### POST /auth/logout
Revoga o token actual. Requer auth.

### POST /auth/refresh
Renova o token JWT. Requer auth.

---

## PEÇAS — /pecas

### GET /pecas
Listagem pública com filtros e paginação.

**Query params:**
- `q` — pesquisa textual (full-text search)
- `categoria` — slug da categoria
- `marca` — marca do veículo
- `condicao` — novo | bom | regular | para_pecas
- `preco_min`, `preco_max`
- `provincia`
- `pagina` (default: 1), `por_pagina` (default: 20, max: 50)
- `ordenar` — preco_asc | preco_desc | mais_recente | mais_visto

**Resposta 200:**
```json
{
  "dados": [ { "id": "...", "titulo": "...", "preco": 150.00, "foto_principal": "...", "fornecedor": { "nome": "...", "avaliacao_media": 4.5 } } ],
  "total": 120,
  "pagina": 1,
  "por_pagina": 20
}
```

### GET /pecas/:id
Detalhes de uma peça. Incrementa visualizacoes.

### POST /pecas
Criar peça. Requer perfil `fornecedor`.

**Body:**
```json
{
  "titulo": "Motor 1.4 Polo 2018",
  "descricao": "Motor em bom estado...",
  "preco": 250.00,
  "categoria_id": "uuid",
  "condicao": "bom",
  "marca_veiculo": "Volkswagen",
  "modelo_veiculo": "Polo",
  "ano_veiculo_de": 2016,
  "ano_veiculo_ate": 2020,
  "estoque": 1,
  "fotos": ["https://res.cloudinary.com/..."]
}
```

### PATCH /pecas/:id
Editar peça própria. Requer `fornecedor` (dono) ou `admin`.

**Body:** qualquer subconjunto dos campos de criação + `status`.

### DELETE /pecas/:id
Remove (marca como `removido`). Requer `fornecedor` (dono) ou `admin`.

### POST /pecas/upload-foto
Upload de foto para Cloudinary. Requer `fornecedor`.
Content-Type: `multipart/form-data`, campo `foto`.

**Resposta 200:**
```json
{ "url": "https://res.cloudinary.com/kambafeira/..." }
```

---

## CATEGORIAS — /categorias

### GET /categorias
Lista todas as categorias activas (árvore hierárquica).

### GET /categorias/:slug
Detalhes + subcategorias de uma categoria.

### POST /categorias
Criar categoria. Requer `admin`.

### PATCH /categorias/:id
Editar categoria. Requer `admin`.

---

## VENDAS — /vendas

### POST /vendas
Iniciar pedido de compra. Requer `comprador`.

**Body:**
```json
{
  "peca_id": "uuid",
  "quantidade": 1,
  "endereco_id": "uuid",
  "notas_comprador": "Prefiro entrega de manhã"
}
```

**Resposta 201:**
```json
{ "id": "uuid", "status": "pendente", "preco_total": 150.00 }
```
> Dispara notificação WhatsApp ao fornecedor.

### GET /vendas
Lista vendas do utilizador autenticado (comprador vê as suas, fornecedor as suas, admin todas).

**Query params:** `status`, `pagina`, `por_pagina`

### GET /vendas/:id
Detalhe de uma venda. Requer ser parte da venda ou admin.

### PATCH /vendas/:id/status
Actualizar status. Requer a parte correta:
- `confirmado` → apenas fornecedor
- `cancelado` → comprador ou fornecedor (com motivo)
- `pago`, `em_preparacao`, `enviado` → fornecedor ou admin
- `entregue` → comprador (confirma recepção)

**Body:**
```json
{ "status": "confirmado", "motivo_cancelamento": "..." }
```

### GET /vendas/:id/comissao
Ver comissão desta venda. Requer `admin` ou o fornecedor dono.

---

## FORNECEDORES — /fornecedores

### GET /fornecedores
Lista pública de fornecedores verificados.

### GET /fornecedores/:id
Perfil público de um fornecedor + últimas peças.

### PATCH /fornecedores/perfil
Editar o próprio perfil. Requer `fornecedor`.

### GET /fornecedores/dashboard
Dashboard do fornecedor autenticado: vendas, comissões, peças activas, avaliação. Requer `fornecedor`.

---

## AVALIAÇÕES — /avaliacoes

### POST /avaliacoes
Avaliar um fornecedor após venda entregue. Requer `comprador`.

**Body:**
```json
{ "venda_id": "uuid", "nota": 5, "comentario": "Excelente serviço!" }
```

### GET /avaliacoes/fornecedor/:id
Avaliações públicas de um fornecedor.

### POST /avaliacoes/:id/responder
Fornecedor responde a uma avaliação. Requer `fornecedor` (dono).

---

## ENTREGAS — /entregas

### GET /entregas/transportadoras
Lista transportadoras activas. Público.

### GET /entregas/zonas
Zonas de entrega disponíveis. Query: `provincia`, `municipio`.

### PATCH /entregas/:venda_id
Actualizar info de frete (código de rastreio, status). Requer `admin` ou fornecedor dono.

### GET /entregas/:venda_id
Estado de entrega de uma venda.

---

## ENDEREÇOS — /enderecos

### GET /enderecos
Endereços do utilizador autenticado.

### POST /enderecos
Adicionar endereço. Requer `comprador`.

**Body:**
```json
{
  "nome": "Casa",
  "provincia": "Luanda",
  "municipio": "Talatona",
  "bairro": "Benfica",
  "referencia": "Próximo à escola...",
  "telefone": "+244 9xx xxx xxx",
  "principal": true
}
```

### PATCH /enderecos/:id
Editar endereço.

### DELETE /enderecos/:id
Remover endereço.

---

## SAC — /sac

### POST /sac/tickets
Abrir ticket de suporte. Requer qualquer perfil autenticado.

**Body:**
```json
{
  "assunto": "Peça não chegou",
  "descricao": "...",
  "tipo": "entrega",
  "venda_id": "uuid"
}
```

### GET /sac/tickets
Lista tickets do utilizador. Admin vê todos.

### GET /sac/tickets/:id
Detalhe de um ticket.

### PATCH /sac/tickets/:id
Actualizar status/resposta. Requer `admin`.

---

## ADMIN — /admin

Todos os endpoints abaixo requerem perfil `admin`.

### GET /admin/dashboard
Métricas gerais: vendas totais, comissões, fornecedores activos, compradores, tickets abertos.

### GET /admin/usuarios
Lista todos os utilizadores com filtros.

### PATCH /admin/usuarios/:id/suspender
Suspender/activar utilizador.

### POST /admin/chaves
Gerar chave-convite para novo fornecedor.

**Body:**
```json
{ "tipo": "fornecedor" }
```
**Resposta 201:**
```json
{ "chave": "abc123...", "expira_em": "2026-06-01T00:00:00Z" }
```

### GET /admin/chaves
Lista todas as chaves (usadas, pendentes, expiradas).

### GET /admin/comissoes
Relatório de comissões com filtros de data e fornecedor.

### PATCH /admin/comissoes/:id/pagar
Marcar comissão como paga.

### GET /admin/relatorio/vendas
Relatório de vendas por período. Query: `data_inicio`, `data_fim`, `fornecedor_id`.

### GET /admin/relatorio/pecas
Peças mais visualizadas, mais vendidas, sem stock.
