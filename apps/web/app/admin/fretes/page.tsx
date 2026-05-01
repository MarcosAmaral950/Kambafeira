'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Frete {
  id: string
  venda_id: string
  peca_titulo: string
  comprador_nome: string
  fornecedor_nome: string
  transportadora_nome: string
  valor_frete: number
  peso_kg: number
  distancia_km: number
  endereco_texto: string | null
  codigo_rastreio: string | null
  previsao_entrega: string | null
  notas: string | null
  status: string
  label_status: string
  criado_em: string
}

const FILTROS_STATUS = [
  { valor: '', label: 'Todos' },
  { valor: 'pendente', label: 'Pendente' },
  { valor: 'recolhido', label: 'Recolhido' },
  { valor: 'em_transito', label: 'Em trânsito' },
  { valor: 'saiu_para_entrega', label: 'Saiu para entrega' },
  { valor: 'entregue', label: 'Entregue' },
  { valor: 'falhou', label: 'Falhou' },
]

function corStatus(status: string) {
  switch (status) {
    case 'pendente': return 'bg-gray-100 text-gray-600'
    case 'recolhido': return 'bg-blue-100 text-blue-700'
    case 'em_transito': return 'bg-amber-100 text-amber-700'
    case 'saiu_para_entrega': return 'bg-orange-100 text-orange-700'
    case 'entregue': return 'bg-green-100 text-green-700'
    case 'falhou': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function PaginaAdminFretes() {
  const [fretes, setFretes] = useState<Frete[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [formAtualizar, setFormAtualizar] = useState({ status: '', codigo_rastreio: '', previsao_entrega: '', notas: '' })
  const [submetendo, setSubmetendo] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await api.fretes.admin() as Frete[]
      setFretes(dados)
    } catch {
      // falha silenciosa, deixar lista vazia
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const fretesFiltrados = filtroStatus ? fretes.filter(f => f.status === filtroStatus) : fretes

  function abrirEditar(frete: Frete) {
    setEditando(frete.id)
    setFormAtualizar({
      status: frete.status,
      codigo_rastreio: frete.codigo_rastreio ?? '',
      previsao_entrega: frete.previsao_entrega ?? '',
      notas: frete.notas ?? '',
    })
  }

  async function submeterAtualizacao(freteId: string, e: React.FormEvent) {
    e.preventDefault()
    setSubmetendo(true)
    try {
      const corpo: Record<string, string> = {}
      if (formAtualizar.status) corpo.status = formAtualizar.status
      if (formAtualizar.codigo_rastreio) corpo.codigo_rastreio = formAtualizar.codigo_rastreio
      if (formAtualizar.previsao_entrega) corpo.previsao_entrega = formAtualizar.previsao_entrega
      if (formAtualizar.notas) corpo.notas = formAtualizar.notas
      await api.fretes.atualizar(freteId, corpo)
      setEditando(null)
      await carregar()
    } catch {
      // erro tratado pela UI
    } finally {
      setSubmetendo(false)
    }
  }

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const formatarPreco = (v: number) => `${Number(v).toLocaleString('pt-AO')} Kz`

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Fretes</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhar e gerir todas as entregas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTROS_STATUS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFiltroStatus(f.valor)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroStatus === f.valor
                ? 'bg-[#dc2626] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>
      ) : fretesFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum frete encontrado</div>
      ) : (
        <div className="space-y-2">
          {fretesFiltrados.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === f.id ? null : f.id)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${corStatus(f.status)}`}>
                    {f.label_status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#111111] truncate">{f.peca_titulo}</p>
                    <p className="text-xs text-gray-500">
                      {f.comprador_nome} · {f.fornecedor_nome} · {f.transportadora_nome}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#111111]">{formatarPreco(f.valor_frete)}</p>
                    <p className="text-xs text-gray-400">{formatarData(f.criado_em)}</p>
                  </div>
                </div>
              </div>

              {/* Detalhe expandido */}
              {expandido === f.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Endereço</p>
                      <p className="font-medium">{f.endereco_texto ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Peso</p>
                      <p className="font-medium">{f.peso_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Distância</p>
                      <p className="font-medium">{f.distancia_km} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Código rastreio</p>
                      <p className="font-medium">{f.codigo_rastreio ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Previsão entrega</p>
                      <p className="font-medium">{f.previsao_entrega ? formatarData(f.previsao_entrega) : '—'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-xs text-gray-400">Notas</p>
                      <p className="font-medium">{f.notas ?? '—'}</p>
                    </div>
                  </div>

                  {editando === f.id ? (
                    <form onSubmit={(e) => submeterAtualizacao(f.id, e)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                        <select value={formAtualizar.status} onChange={e => setFormAtualizar(v => ({ ...v, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
                          {FILTROS_STATUS.filter(s => s.valor).map(s => (
                            <option key={s.valor} value={s.valor}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Código de rastreio</label>
                        <input value={formAtualizar.codigo_rastreio} onChange={e => setFormAtualizar(v => ({ ...v, codigo_rastreio: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Previsão de entrega</label>
                        <input type="date" value={formAtualizar.previsao_entrega} onChange={e => setFormAtualizar(v => ({ ...v, previsao_entrega: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                        <input value={formAtualizar.notas} onChange={e => setFormAtualizar(v => ({ ...v, notas: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                      </div>
                      <div className="sm:col-span-2 flex gap-2">
                        <button type="submit" disabled={submetendo}
                          className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                          {submetendo ? 'A guardar…' : 'Guardar'}
                        </button>
                        <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => abrirEditar(f)}
                      className="text-sm text-[#dc2626] font-medium hover:underline">
                      Actualizar estado / rastreio
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
