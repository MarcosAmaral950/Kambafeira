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
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'
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
  },

  // ── Peças ─────────────────────────────────────────────────────
  pecas: {
    listar: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/pecas${qs}`)
    },
    obter:  (id: string)            => apiFetch(`/pecas/${id}`),
    criar:  (dados: object)         => apiFetch('/pecas',      { metodo: 'POST',   corpo: dados }),
    editar: (id: string, dados: object) => apiFetch(`/pecas/${id}`, { metodo: 'PUT', corpo: dados }),
    remover:(id: string)            => apiFetch(`/pecas/${id}`, { metodo: 'DELETE' }),
    minhas: ()                      => apiFetch('/fornecedor/pecas'),
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
