'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { api, ErroAPI } from '@/lib/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PecaAdmin = {
  id: string
  titulo: string
  preco: string
  status: string
  estoque: number
  condicao: string
  foto_principal: string | null
  marca_veiculo: string | null
  modelo_veiculo: string | null
  criada_em: string
  fornecedor_id: string
  fornecedor_nome: string
  categoria: string
}

type FornecedorOpcao = {
  id: string
  nome: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeStatus(status: string): string {
  switch (status) {
    case 'activo':   return 'bg-green-100 text-green-700'
    case 'rascunho': return 'bg-gray-100 text-gray-600'
    case 'suspenso': return 'bg-orange-100 text-orange-700'
    default:         return 'bg-gray-100 text-gray-600'
  }
}

function labelStatus(status: string): string {
  switch (status) {
    case 'activo':   return 'Activo'
    case 'rascunho': return 'Rascunho'
    case 'suspenso': return 'Suspenso'
    default:         return status
  }
}

function formatarPreco(preco: string): string {
  return `${Number(preco).toLocaleString('pt-PT')} Kz`
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PaginaPecasAdmin() {
  const [pecas, setPecas] = useState<PecaAdmin[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorOpcao[]>([])
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  // Carregar lista de fornecedores uma vez
  useEffect(() => {
    api.admin.fornecedoresLista()
      .then(d => setFornecedores(d as FornecedorOpcao[]))
      .catch(() => {})
  }, [])

  // Carregar peças ao mudar filtro
  useEffect(() => {
    carregarPecas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedorFiltro])

  async function carregarPecas() {
    setCarregando(true)
    setErro('')
    try {
      const dados = await api.admin.pecasAdmin(fornecedorFiltro || undefined)
      setPecas(dados as PecaAdmin[])
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao carregar peças')
    } finally {
      setCarregando(false)
    }
  }

  async function removerPeca(id: string, titulo: string) {
    if (!confirm(`Remover a peça "${titulo}"? Esta acção não pode ser desfeita.`)) return
    setRemovendoId(id)
    try {
      await api.pecas.remover(id)
      setPecas(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao remover peça')
    } finally {
      setRemovendoId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#111111]">Peças — Visão Geral</h1>
        <Link
          href="/admin/pecas/nova"
          className="px-4 py-2 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          + Cadastrar Peça
        </Link>
      </div>

      {/* Filtro por fornecedor */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por fornecedor</label>
        <select
          value={fornecedorFiltro}
          onChange={e => setFornecedorFiltro(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
        >
          <option value="">Todos os fornecedores</option>
          {fornecedores.map(f => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">{erro}</div>
      )}

      {carregando ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <div key={n} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : pecas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-medium">Sem peças encontradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Peça</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Fornecedor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Preço</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pecas.map(peca => (
                  <tr key={peca.id} className="hover:bg-gray-50">
                    {/* Peça */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {peca.foto_principal ? (
                            <Image
                              src={peca.foto_principal}
                              alt={peca.titulo}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">🔧</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#111111] truncate max-w-[180px]">{peca.titulo}</p>
                          {(peca.marca_veiculo || peca.modelo_veiculo) && (
                            <p className="text-xs text-gray-400 truncate">
                              {[peca.marca_veiculo, peca.modelo_veiculo].filter(Boolean).join(' ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 sm:hidden">{peca.fornecedor_nome}</p>
                        </div>
                      </div>
                    </td>

                    {/* Fornecedor */}
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      <span className="truncate block max-w-[140px]">{peca.fornecedor_nome}</span>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      <span className="truncate block max-w-[120px]">{peca.categoria}</span>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-3 text-right font-medium text-[#111111]">
                      {formatarPreco(peca.preco)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${peca.estoque <= 0 ? 'text-red-600' : peca.estoque <= 2 ? 'text-orange-500' : 'text-green-600'}`}>
                        {peca.estoque}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeStatus(peca.status)}`}>
                        {labelStatus(peca.status)}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {formatarData(peca.criada_em)}
                    </td>

                    {/* Acções */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/dashboard/pecas/${peca.id}/editar`}
                          className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => removerPeca(peca.id, peca.titulo)}
                          disabled={removendoId === peca.id}
                          className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {removendoId === peca.id ? '…' : 'Remover'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
