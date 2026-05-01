const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type OpcoesFetch = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  corpo?: unknown
  token?: string
}

export class ErroAPI extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(rota: string, opcoes: OpcoesFetch = {}): Promise<T> {
  const { metodo = 'GET', corpo, token } = opcoes

  const cabecalhos: Record<string, string> = {
    'Content-Type': 'application/json',
  }
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

// Auth
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/login', { metodo: 'POST', corpo: { email, password } }),
    registoComprador: (dados: { email: string; password: string; nome: string; telefone?: string }) =>
      apiFetch('/auth/registo/comprador', { metodo: 'POST', corpo: dados }),
    registoFornecedor: (dados: object) =>
      apiFetch('/auth/registo/fornecedor', { metodo: 'POST', corpo: dados }),
    logout: () => apiFetch('/auth/logout', { metodo: 'POST' }),
    me: () => apiFetch('/auth/me'),
  },
  pecas: {
    listar: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch(`/pecas${qs}`)
    },
    obter: (id: string) => apiFetch(`/pecas/${id}`),
    criar: (dados: object) => apiFetch('/pecas', { metodo: 'POST', corpo: dados }),
    editar: (id: string, dados: object) => apiFetch(`/pecas/${id}`, { metodo: 'PUT', corpo: dados }),
    remover: (id: string) => apiFetch(`/pecas/${id}`, { metodo: 'DELETE' }),
    minhas: () => apiFetch('/fornecedor/pecas'),
  },
  categorias: {
    listar: () => apiFetch('/categorias'),
  },
}
