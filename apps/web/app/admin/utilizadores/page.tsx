'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, ErroAPI } from '@/lib/api'

type Utilizador = {
  id: string
  nome: string
  email: string
  telefone?: string
  perfil: 'comprador' | 'fornecedor' | 'admin'
  ativo: boolean
  criado_em: string
  fornecedor_id?: string
  verificado?: boolean
  suspenso?: boolean
  total_vendas?: number
}

const COR_PERFIL: Record<string, string> = {
  admin:      'bg-purple-100 text-purple-800',
  fornecedor: 'bg-blue-100 text-blue-800',
  comprador:  'bg-green-100 text-green-800',
}

export default function PaginaUtilizadoresAdmin() {
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([])
  const [carregando, setCarregando]     = useState(true)
  const [pesquisa, setPesquisa]         = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<string>('todos')
  const [emAccao, setEmAccao]           = useState<string | null>(null)

  const carregar = useCallback(async (q?: string) => {
    setCarregando(true)
    try {
      const dados = await api.admin.usuarios(q) as Utilizador[]
      setUtilizadores(dados)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Pesquisa com debounce
  useEffect(() => {
    const t = setTimeout(() => carregar(pesquisa || undefined), 400)
    return () => clearTimeout(t)
  }, [pesquisa, carregar])

  async function reporPassword(u: Utilizador) {
    const novaPwd = prompt(`Nova password para ${u.nome}:\n(mínimo 8 caracteres)`)
    if (!novaPwd) return
    if (novaPwd.length < 8) { alert('A password deve ter pelo menos 8 caracteres'); return }
    setEmAccao(u.id)
    try {
      const res = await api.admin.resetarPassword(u.id, novaPwd) as { mensagem: string }
      alert(res.mensagem)
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao repor password')
    } finally {
      setEmAccao(null)
    }
  }

  const lista = utilizadores.filter(u =>
    filtroPerfil === 'todos' || u.perfil === filtroPerfil
  )

  const contagens = {
    todos:      utilizadores.length,
    comprador:  utilizadores.filter(u => u.perfil === 'comprador').length,
    fornecedor: utilizadores.filter(u => u.perfil === 'fornecedor').length,
    admin:      utilizadores.filter(u => u.perfil === 'admin').length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">Utilizadores</h1>
        <span className="text-sm text-gray-500">{lista.length} resultado{lista.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Pesquisa */}
      <input
        type="search"
        placeholder="Pesquisar por nome ou email…"
        value={pesquisa}
        onChange={e => setPesquisa(e.target.value)}
        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
      />

      {/* Filtro por perfil */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'comprador', 'fornecedor', 'admin'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFiltroPerfil(p)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filtroPerfil === p
                ? 'bg-[#dc2626] text-white border-[#dc2626]'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
            <span className="ml-1 text-xs opacity-75">({contagens[p]})</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          Nenhum utilizador encontrado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {lista.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                u.perfil === 'admin' ? 'bg-purple-600' : u.perfil === 'fornecedor' ? 'bg-[#dc2626]' : 'bg-gray-500'
              }`}>
                {u.nome.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[#111111] truncate text-sm">{u.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_PERFIL[u.perfil]}`}>
                    {u.perfil}
                  </span>
                  {!u.ativo && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactivo</span>
                  )}
                  {u.suspenso && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Suspenso</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {u.telefone && (
                    <p className="text-xs text-gray-400">{u.telefone}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Desde {new Date(u.criado_em).toLocaleDateString('pt-AO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  {u.perfil === 'fornecedor' && u.total_vendas !== undefined && (
                    <p className="text-xs text-gray-400">{u.total_vendas} venda{u.total_vendas !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>

              {/* Acções */}
              {u.perfil !== 'admin' && (
                <div className="shrink-0">
                  <button
                    onClick={() => reporPassword(u)}
                    disabled={emAccao === u.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    {emAccao === u.id ? '…' : 'Repor password'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
