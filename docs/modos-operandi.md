# KambaFeira — Modo de Operação do Sistema

**Versão:** 1.0 | **Data:** Maio 2026  
**Público:** Equipa de operações, suporte e novos colaboradores

---

## Visão Geral

O KambaFeira é um marketplace de peças usadas de automóveis em Angola.  
O sistema envolve três tipos de utilizadores — **Admin**, **Fornecedor** e **Comprador** —  
que interagem numa sequência bem definida desde o cadastro até à avaliação final.

---

## PARTE 1 — Preparação (Admin)

### Passo 1 · Cadastrar transportadoras e zonas de entrega

Antes de qualquer venda, o admin deve configurar as opções de entrega.

1. Entrar em `/admin` com conta de administrador
2. Ir a **Entregas** no menu lateral
3. Clicar em **Nova Transportadora** e preencher:
   - Nome da empresa
   - Telefone e WhatsApp de contacto
4. Após criar a transportadora, clicar em **+ Zona** para definir as rotas e preços:

   | Campo | Exemplo |
   |---|---|
   | Província de origem | Luanda |
   | Província de destino | Benguela |
   | Distância (km) | 520 |
   | Preço base | 2.500 Kz |
   | Preço por kg | 150 Kz |
   | Preço por km | 2 Kz |

   > **Cálculo automático do frete:**  
   > `Frete = Preço base + (Peso × Preço/kg) + (Distância × Preço/km)`  
   > Exemplo: 2.500 + (3kg × 150) + (520km × 2) = **4.490 Kz**

5. Repetir para todas as rotas que a transportadora cobre.

---

### Passo 2 · Gerar chave-convite para o fornecedor

Os fornecedores só se registam com uma chave de convite gerada pelo admin.

1. Ir a **Chaves** no menu lateral
2. Clicar em **Gerar Chave**
3. O sistema gera uma chave única de 32 caracteres, válida por **30 dias**
4. Enviar a chave ao fornecedor por WhatsApp ou email

> ⚠️ Cada chave é de uso único. Após usada, fica inativa automaticamente.

---

## PARTE 2 — Cadastro do Fornecedor

### Passo 3 · Fornecedor cria a sua conta

O fornecedor acede ao site e regista-se como vendedor.

1. Ir a `/registo/fornecedor`
2. Preencher o formulário:
   - Nome completo
   - Email e password
   - Telefone e WhatsApp
   - Tipo de negócio (Independente / Desmanche / Stand / Empresa)
   - Província onde opera
   - **Chave de convite** recebida do admin
3. Clicar em **Criar conta**
4. O sistema valida a chave e cria a conta com perfil `fornecedor`
5. O fornecedor é redirecionado para o painel em `/dashboard`

---

### Passo 4 · Fornecedor cadastra as peças

Cada peça vendida na plataforma precisa de ser cadastrada individualmente.

1. No header, clicar em **Minha Loja → Cadastrar Peça**  
   (ou ir a `/dashboard/pecas/nova`)
2. Preencher o formulário:

   | Campo | Obrigatório | Descrição |
   |---|---|---|
   | Título | ✅ | Ex: "Alternador Toyota Hilux 2015" |
   | Categoria | ✅ | Motor, Suspensão, Travagem, etc. |
   | Condição | ✅ | Novo / Bom estado / Regular / Para peças |
   | Preço | ✅ | Em Kwanzas |
   | Estoque | ✅ | Quantidade disponível |
   | Descrição | ✅ | Detalhes, estado, observações |
   | Marca do veículo | — | Ex: Toyota, Hyundai |
   | Modelo do veículo | — | Ex: Hilux, Tucson |
   | Ano (de/até) | — | Ex: 2012–2018 |
   | Fotos | — | Até 5 fotos (recomendado: pelo menos 1) |

3. Escolher o estado inicial:
   - **Rascunho** — visível apenas para o fornecedor, não aparece no catálogo
   - **Activo** — visível publicamente no catálogo
4. Clicar em **Publicar**

> 💡 O fornecedor pode a qualquer momento pausar uma peça (Activo → Rascunho) ou  
> actualizar o estoque e preço diretamente na lista em `/dashboard/pecas`.

---

## PARTE 3 — O Comprador encontra e compra a peça

### Passo 5 · Comprador cria a sua conta

1. Ir a `/registo/comprador`
2. Preencher nome, email e password
3. Clicar em **Registar** — acesso imediato, sem chave-convite

---

### Passo 6 · Comprador pesquisa a peça

1. Na página principal `/`, usar a barra de pesquisa ou os filtros de categoria
2. Filtros disponíveis:
   - Categoria (Motor, Suspensão, Travagem, etc.)
   - Condição (Novo, Bom estado, Regular, Para peças)
   - Preço mínimo e máximo
   - Marca do veículo
   - Província do fornecedor
3. Clicar numa peça para ver os detalhes completos

---

### Passo 7 · Comprador faz o pedido

Na página da peça `/pecas/[id]`:

1. Clicar em **Fazer Pedido**
2. No modal de pedido, preencher:
   - **Quantidade** desejada
   - **Método de pagamento** (transferência, cash on delivery, etc.)
   - **Notas** para o fornecedor (opcional)
3. Confirmar o pedido

**O que acontece automaticamente:**
- O stock da peça é debitado imediatamente (proteção contra dupla compra)
- O fornecedor recebe notificação via **WhatsApp** com os detalhes do pedido
- O pedido aparece em `/pedidos` do comprador com estado **Pendente**

---

## PARTE 4 — O Fornecedor processa o pedido

### Passo 8 · Fornecedor confirma o pedido

1. O fornecedor recebe o WhatsApp com a notificação
2. Aceder ao painel: **Minha Loja → Pedidos** ou `/dashboard/pedidos`
3. Ver o pedido com estado **Pendente**
4. Clicar em **Confirmar** → estado passa a **Confirmado**
5. O comprador recebe notificação WhatsApp: *"O fornecedor confirmou o teu pedido"*

---

### Passo 9 · Fornecedor prepara e entrega à transportadora

1. No pedido, clicar em **Em Preparação** → estado passa a **Em preparação**
2. Embalar a peça adequadamente
3. Entregar à transportadora parceira
4. No pedido, clicar em **Enviado** → estado passa a **Enviado**
5. O comprador recebe notificação WhatsApp: *"A tua peça está a caminho"*

---

### Passo 10 · Comprador cria o frete (entrega)

Após o pedido ser confirmado, o comprador configura a entrega:

1. Ir a `/pedidos` e abrir o pedido confirmado
2. Clicar em **Configurar Entrega**
3. Preencher:
   - **Transportadora** (lista das disponíveis)
   - **Província de destino**
   - **Município e bairro**
   - **Referência local** (ponto de referência para o motorista)
   - **Peso estimado** da encomenda (em kg)
4. O sistema calcula automaticamente o valor do frete
5. Confirmar — o frete fica registado com estado **Pendente**

---

## PARTE 5 — A Transportadora faz a entrega

### Passo 11 · Rastreio da entrega (Admin ou Fornecedor)

O admin ou fornecedor actualiza o estado do frete à medida que a entrega progride:

| Estado | Significado |
|---|---|
| **Pendente** | Frete criado, aguarda recolha |
| **Recolhido** | Transportadora recolheu a encomenda |
| **Em trânsito** | A caminho do destino |
| **Saiu para entrega** | Motorista a caminho do comprador |
| **Entregue** | Comprador recebeu |
| **Falhou** | Tentativa de entrega falhada |

Em `/admin/fretes` ou `/dashboard/pedidos`, clicar no frete e atualizar:
- Estado atual
- Código de rastreio (se a transportadora fornecer)
- Data prevista de entrega

---

### Passo 12 · Confirmar entrega e fechar o pedido

1. Quando a peça chega, o admin ou fornecedor atualiza o pedido para **Entregue**
2. **Automaticamente o sistema:**
   - Calcula a comissão KambaFeira (8%–12% do valor da venda)
   - Regista a comissão na tabela de comissões
   - Incrementa o contador de vendas do fornecedor
   - Notifica o comprador via WhatsApp: *"A tua encomenda foi entregue!"*

---

## PARTE 6 — Avaliação

### Passo 13 · Comprador avalia o fornecedor

Após a entrega, o comprador pode avaliar a experiência:

1. Ir a `/pedidos`
2. No pedido entregue, clicar em **Avaliar**
3. Selecionar uma nota de **1 a 5 estrelas**
4. Escrever um comentário (opcional)
5. Submeter avaliação

**Impacto da avaliação:**
- A média de avaliações do fornecedor é actualizada automaticamente
- Aparece na página pública do fornecedor (`/fornecedores/[id]`)
- Aparece na listagem de peças do fornecedor

---

### Passo 14 · Fornecedor responde à avaliação

O fornecedor pode responder publicamente a qualquer avaliação:

1. Ir a **Minha Loja → Avaliações** ou `/dashboard/avaliacoes`
2. Ver todas as avaliações recebidas
3. Clicar em **Responder** numa avaliação
4. Escrever a resposta (máxima 500 caracteres)
5. A resposta aparece publicamente abaixo do comentário do comprador

---

## RESUMO DO FLUXO COMPLETO

```
[ADMIN]
  │
  ├─ 1. Cadastra transportadoras e zonas de entrega
  └─ 2. Gera chave-convite → envia ao fornecedor
         │
         ▼
[FORNECEDOR]
  │
  ├─ 3. Regista-se com a chave-convite
  └─ 4. Cadastra as peças (fotos, preço, estoque)
         │
         ▼
[COMPRADOR]
  │
  ├─ 5. Cria conta
  ├─ 6. Pesquisa a peça (filtros, categorias)
  └─ 7. Faz o pedido → stock debitado, WhatsApp ao fornecedor
         │
         ▼
[FORNECEDOR]
  │
  ├─ 8. Confirma o pedido → WhatsApp ao comprador
  └─ 9. Prepara e entrega à transportadora → "Enviado"
         │
         ▼
[COMPRADOR]
  └─ 10. Configura a entrega (transportadora, morada, peso)
          │
          ▼
[TRANSPORTADORA + ADMIN]
  └─ 11. Actualiza rastreio: recolhido → em trânsito → entregue
          │
          ▼
[SISTEMA — automático]
  └─ 12. Calcula comissão, atualiza estatísticas, notifica comprador
          │
          ▼
[COMPRADOR]
  └─ 13. Avalia a experiência (1–5 estrelas + comentário)
          │
          ▼
[FORNECEDOR]
  └─ 14. Responde à avaliação publicamente
```

---

## Casos Especiais

### Pedido cancelado
- Qualquer parte (comprador, fornecedor ou admin) pode cancelar antes do envio
- O stock é **restaurado automaticamente**
- Se já havia frete criado, o admin deve contactar a transportadora manualmente

### Peça com stock esgotado
- O sistema bloqueia novos pedidos automaticamente
- O fornecedor recebe indicação visual na lista de peças (badge vermelho "Esgotado")
- O fornecedor pode repor o stock manualmente em `/dashboard/stock`

### Fornecedor suspenso
- As peças do fornecedor ficam invisíveis no catálogo automaticamente
- Os pedidos em curso devem ser resolvidos manualmente pelo admin
- O admin pode reativar o fornecedor a qualquer momento em `/admin/fornecedores`

### Ticket de suporte (SAC)
- Comprador ou fornecedor abre ticket em `/sac` com fotos se necessário
- Admin responde em `/admin/sac`
- O estado do ticket muda automaticamente: Aberto → Em atendimento → Aguarda utilizador → Resolvido

---

## Painel de Controlo por Perfil

### Admin — `/admin`
| Secção | O que faz |
|---|---|
| Resumo | KPIs gerais: utilizadores, peças, vendas, comissões |
| Fornecedores | Suspender, reativar, repor password |
| Utilizadores | Pesquisar todos os utilizadores, repor passwords |
| Peças | Ver e moderar todas as peças da plataforma |
| Stock | Ver stock de todos os fornecedores |
| Pedidos | Ver todos os pedidos da plataforma |
| Entregas | Gerir transportadoras e zonas com preços |
| Fretes | Ver e atualizar rastreio de todas as entregas |
| SAC | Responder tickets de suporte, gerir prioridades |
| Chaves | Gerar chaves-convite para novos fornecedores |

### Fornecedor — `/dashboard`
| Secção | O que faz |
|---|---|
| Painel | Resumo: vendas, receita, avaliação média |
| Peças | Cadastrar, editar, pausar, remover peças |
| Stock | Ver histórico de movimentos, ajustar manualmente |
| Pedidos | Confirmar, preparar, enviar pedidos |
| Avaliações | Ver e responder avaliações dos compradores |
| Suporte | Abrir e acompanhar tickets de suporte |

### Comprador — navegação principal
| Secção | O que faz |
|---|---|
| Catálogo (`/`) | Pesquisar e filtrar peças |
| Pedidos (`/pedidos`) | Ver histórico, rastrear entregas, avaliar |
| Perfil (`/perfil`) | Editar dados pessoais, alterar password |
| Suporte (`/sac`) | Abrir e acompanhar tickets com fotos |

---

*KambaFeira · Feito em Angola · Para Angola*
