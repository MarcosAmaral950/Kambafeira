const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

  const res = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
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
    login: (email: string, password: string) =>
      apiFetch('/auth/login', { metodo: 'POST', corpo: { email, password } }),
    registoComprador: (dados: { email: string; password: string; nome: string; telefone?: string }) =>
      apiFetch('/auth/registo/comprador', { metodo: 'POST', corpo: dados }),
    registoFornecedor: (dados: object) =>
      apiFetch('/auth/registo/fornecedor', { metodo: 'POST', corpo: dados }),
    logout: () => apiFetch('/auth/logout', { metodo: 'POST' }),
    me:     () => apiFetch('/auth/me'),
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

  // ── Dashboard Fornecedor ──────────────────────────────────────
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
}
