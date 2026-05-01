const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Chave para localStorage
const TOKEN_KEY = 'kambafeira_token'

// Guardar / ler / remover token
export const tokenStore = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => typeof window !== 'undefined' && localStorage.setItem(TOKEN_KEY, t),
  clear: () => typeof window !== 'undefined' && localStorage.removeItem(TOKEN_KEY),
}

type OpcoesFetch = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  corpo?: unknown
}

export class ErroAPI extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(rota: string, opcoes: OpcoesFetch = {}): Promise<T> {
  const { metodo = 'GET', corpo } = opcoes

  const cabecalhos: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Incluir token se existir
  const token = tokenStore.get()
  if (token) cabecalhos['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: cabecalhos,
    credentials: 'include',
    body: corpo ? JSON.stringify(corpo) : undefined,
  })

  const dados = await res.json()
  if (!res.ok) throw new ErroAPI(res.status, dados.erro ?? 'Erro desconhecido')
  return dados as T
}

export const api = {
  // ── Autenticação ──────────────────────────────────────────────
  auth: {
    login: async (email: string, password: string) => {
      const dados = await apiFetch<{ usuario: object; token: string }>(
        '/auth/login', { metodo: 'POST', corpo: { email, password } }
      )
      tokenStore.set(dados.token)
      return dados
    },
    registoComprador: async (dados: { email: string; password: string; nome: string; telefone?: string }) => {
      const res = await apiFetch<{ usuario: object; token: string }>(
        '/auth/registo/comprador', { metodo: 'POST', corpo: dados }
      )
      tokenStore.set(res.token)
      return res
    },
    registoFornecedor: async (dados: object) => {
      const res = await apiFetch<{ usuario: object; token: string }>(
        '/auth/registo/fornecedor', { metodo: 'POST', corpo: dados }
      )
      tokenStore.set(res.token)
      return res
    },
    logout: async () => {
      tokenStore.clear()
      return apiFetch('/auth/logout', { metodo: 'POST' })
    },
    me: () => apiFetch('/auth/me'),
    alterarPassword: (dados: { password_actual: string; password_nova: string }) =>
      apiFetch('/auth/alterar-password', { metodo: 'PUT', corpo: dados }),
    actualizarPerfil: (dados: { nome: string; telefone?: string }) =>
      apiFetch('/auth/me/actualizar', { metodo: 'PUT', corpo: dados }),
  },

  // ── Peças ─────────────────────────────────────────────────────
  pecas: {
    listar: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/pecas${qs}`)
    },
    obter:       (id: string)             => apiFetch(`/pecas/${id}`),
    // Obter peça própria (qualquer status, incluindo rascunho/suspenso)
    obterMinha:  (id: string)             => apiFetch(`/fornecedor/pecas/${id}`),
    criar:       (dados: object)          => apiFetch('/pecas',      { metodo: 'POST',   corpo: dados }),
    editar:      (id: string, dados: object) => apiFetch(`/pecas/${id}`, { metodo: 'PUT', corpo: dados }),
    remover:     (id: string)             => apiFetch(`/pecas/${id}`, { metodo: 'DELETE' }),
    minhas:      ()                       => apiFetch('/fornecedor/pecas'),
    // Actualização rápida de estoque, preço e/ou status
    atualizarRapido: (id: string, dados: { estoque?: number; preco?: number; status?: string }) =>
      apiFetch(`/fornecedor/pecas/${id}/estoque`, { metodo: 'PATCH', corpo: dados }),
    doFornecedor: (fornecedorId: string) =>
      apiFetch(`/pecas?fornecedor_id=${fornecedorId}&limite=50`),
    meuId: () => apiFetch('/fornecedor/meu-id'),
  },

  // ── Categorias ────────────────────────────────────────────────
  categorias: {
    listar: () => apiFetch('/categorias'),
  },

  // ── Pedidos ───────────────────────────────────────────────────
  pedidos: {
    criar:        (dados: object)   => apiFetch('/pedidos', { metodo: 'POST', corpo: dados }),
    meus:         ()                => apiFetch('/pedidos/meus'),
    doFornecedor: ()                => apiFetch('/fornecedor/pedidos'),
    obter:        (id: string)      => apiFetch(`/pedidos/${id}`),
    atualizarStatus: (id: string, dados: { status: string; notas_fornecedor?: string; motivo_cancelamento?: string }) =>
      apiFetch(`/pedidos/${id}/status`, { metodo: 'PUT', corpo: dados }),
  },

  // ── Dashboard ─────────────────────────────────────────────────
  dashboard: {
    resumoFornecedor: () => apiFetch('/fornecedor/resumo'),
  },

  // ── Admin ─────────────────────────────────────────────────────
  admin: {
    resumo:       ()                => apiFetch('/admin/resumo'),
    usuarios:     (q?: string)      => apiFetch(`/admin/usuarios${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    fornecedores: ()                => apiFetch('/admin/fornecedores'),
    suspenderFornecedor: (id: string, dados: { suspenso: boolean; motivo?: string }) =>
      apiFetch(`/admin/fornecedores/${id}/suspender`, { metodo: 'PUT', corpo: dados }),
    pedidos:      ()                => apiFetch('/admin/pedidos'),
    chaves:       ()                => apiFetch('/admin/chaves'),
    gerarChave:   ()                => apiFetch('/admin/chaves', { metodo: 'POST' }),
    pecasAdmin:       (fornecedorId?: string) => apiFetch(`/admin/pecas${fornecedorId ? `?fornecedor_id=${fornecedorId}` : ''}`),
    fornecedoresLista: ()                     => apiFetch('/admin/fornecedores-lista'),
    criarPecaAdmin:   (dados: object)         => apiFetch('/pecas', { metodo: 'POST', corpo: dados }),
    suspenderPeca: (id: string, status: string) =>
      apiFetch(`/admin/pecas/${id}/status`, { metodo: 'PATCH', corpo: { status } }),
    resetarPassword: (id: string, password_nova: string) =>
      apiFetch(`/admin/usuarios/${id}/reset-password`, { metodo: 'PUT', corpo: { password_nova } }),
    compradores: () => apiFetch('/admin/compradores'),
    pedidoManual: (dados: { peca_id: string; comprador_id: string; quantidade: number; notas_comprador?: string; metodo_pagamento?: string }) =>
      apiFetch('/pedidos', { metodo: 'POST', corpo: dados }),
  },

  // ── Stock ─────────────────────────────────────────────────────
  stock: {
    doFornecedor:    ()                                => apiFetch('/fornecedor/stock'),
    ajustar:         (pecaId: string, dados: object)   => apiFetch(`/fornecedor/stock/${pecaId}`, { metodo: 'PATCH', corpo: dados }),
    movimentos:      (pecaId: string)                  => apiFetch(`/fornecedor/stock/${pecaId}/movimentos`),
    admin:           (fornecedorId?: string)           => apiFetch(`/admin/stock${fornecedorId ? `?fornecedor_id=${fornecedorId}` : ''}`),
    ajustarAdmin:    (pecaId: string, dados: object)   => apiFetch(`/admin/stock/${pecaId}`, { metodo: 'PATCH', corpo: dados }),
    movimentosAdmin: (pecaId: string)                  => apiFetch(`/admin/stock/${pecaId}/movimentos`),
  },

  // ── Upload de ficheiros ───────────────────────────────────────
  upload: {
    imagem: async (ficheiro: File): Promise<{ url: string; public_id: string }> => {
      const form = new FormData()
      form.append('imagem', ficheiro)
      const token = tokenStore.get()
      const cabecalhos: Record<string, string> = {}
      if (token) cabecalhos['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/upload/imagem`, {
        method: 'POST',
        headers: cabecalhos,
        body: form,
        credentials: 'include',
      })
      const dados = await res.json()
      if (!res.ok) throw new ErroAPI(res.status, dados.erro ?? 'Erro no upload')
      return dados as { url: string; public_id: string }
    },
  },

  // ── Fornecedores (público) ────────────────────────────────────
  fornecedores: {
    obter: (id: string) => apiFetch(`/fornecedores/${id}`),
  },

  // ── Transportadoras ───────────────────────────────────────────
  transportadoras: {
    listar: () => apiFetch('/transportadoras'),
    calcular: (params: { transportadora_id: string; provincia_destino: string; peso_kg: number; provincia_origem?: string }) => {
      const qs = new URLSearchParams({
        transportadora_id: params.transportadora_id,
        provincia_destino: params.provincia_destino,
        peso_kg: String(params.peso_kg),
        ...(params.provincia_origem ? { provincia_origem: params.provincia_origem } : {}),
      })
      return apiFetch(`/transportadoras/calcular?${qs}`)
    },
    admin: {
      listar: () => apiFetch('/admin/transportadoras'),
      criar: (dados: object) => apiFetch('/admin/transportadoras', { metodo: 'POST', corpo: dados }),
      editar: (id: string, dados: object) => apiFetch(`/admin/transportadoras/${id}`, { metodo: 'PUT', corpo: dados }),
      adicionarZona: (id: string, dados: object) => apiFetch(`/admin/transportadoras/${id}/zonas`, { metodo: 'POST', corpo: dados }),
      editarZona: (id: string, dados: object) => apiFetch(`/admin/zonas/${id}`, { metodo: 'PUT', corpo: dados }),
      removerZona: (id: string) => apiFetch(`/admin/zonas/${id}`, { metodo: 'DELETE' }),
    },
  },

  // ── Fretes ────────────────────────────────────────────────────
  fretes: {
    criar: (dados: object) => apiFetch('/fretes', { metodo: 'POST', corpo: dados }),
    meus: () => apiFetch('/fretes/meus'),
    obter: (id: string) => apiFetch(`/fretes/${id}`),
    atualizar: (id: string, dados: object) => apiFetch(`/fretes/${id}`, { metodo: 'PUT', corpo: dados }),
    doFornecedor: () => apiFetch('/fornecedor/fretes'),
    admin: () => apiFetch('/admin/fretes'),
  },

  // ── SAC ───────────────────────────────────────────────────────
  sac: {
    abrirTicket: (dados: object) => apiFetch('/sac/tickets', { metodo: 'POST', corpo: dados }),
    meusTickets: () => apiFetch('/sac/tickets/meus'),
    obterTicket: (id: string) => apiFetch(`/sac/tickets/${id}`),
    responder: (id: string, dados: object) => apiFetch(`/sac/tickets/${id}/mensagens`, { metodo: 'POST', corpo: dados }),
    admin: {
      listar: (filtros?: { status?: string; prioridade?: string }) => {
        const qs = filtros ? '?' + new URLSearchParams(filtros as Record<string, string>).toString() : ''
        return apiFetch(`/admin/sac/tickets${qs}`)
      },
      atualizar: (id: string, dados: object) => apiFetch(`/admin/sac/tickets/${id}`, { metodo: 'PUT', corpo: dados }),
    },
  },

  // ── Endereços de entrega ───────────────────────────────────────
  enderecos: {
    meus: () => apiFetch('/enderecos'),
  },

  // ── Avaliações ────────────────────────────────────────────────
  avaliacoes: {
    criar: (vendaId: string, dados: { nota: number; comentario?: string }) =>
      apiFetch(`/avaliacoes/${vendaId}`, { metodo: 'POST', corpo: dados }),
    doFornecedor: (fornecedorId: string) =>
      apiFetch(`/fornecedor/${fornecedorId}/avaliacoes`),
    minhas: () =>
      apiFetch('/fornecedor/minhas/avaliacoes'),
    pedidosParaAvaliar: () =>
      apiFetch('/pedidos/meus/avaliar'),
    responder: (id: string, resposta: string) =>
      apiFetch(`/avaliacoes/${id}/resposta`, { metodo: 'PUT', corpo: { resposta } }),
  },
}
