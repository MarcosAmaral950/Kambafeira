'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, ErroAPI } from '@/lib/api'

type ContratoFornecedor = {
  fornecedor_id: string
  nome: string
  email: string
  provincia: string
  suspenso: boolean
  total_vendas: number
  avaliacao_media: string
  contrato_id: string | null
  taxa_comissao: string | null
  data_inicio: string | null
  contrato_ativo: boolean | null
  observacoes: string | null
  contrato_criado_em: string | null
  total_comissoes: string
  total_liquido: string
  total_vendas_comissionadas: string
}

type Historico = {
  id: string
  taxa_comissao: string
  data_inicio: string
  data_fim: string | null
  ativo: boolean
  observacoes: string | null
  criado_em: string
}

const COR_TAXA = (taxa: number) => {
  if (taxa <= 8.5)  return 'text-green-700 bg-green-50 border-green-200'
  if (taxa <= 10)   return 'text-blue-700 bg-blue-50 border-blue-200'
  if (taxa <= 11)   return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

export default function PaginaContratos() {
  const [contratos, setContratos]       = useState<ContratoFornecedor[]>([])
  const [carregando, setCarregando]     = useState(true)
  const [editando, setEditando]         = useState<string | null>(null)
  const [historico, setHistorico]       = useState<{ id: string; dados: Historico[] } | null>(null)
  const [salvando, setSalvando]         = useState<string | null>(null)
  const [novaTaxa, setNovaTaxa]         = useState<Record<string, string>>({})
  const [novaObs, setNovaObs]           = useState<Record<string, string>>({})

  // Totais globais
  const totalComissoes = contratos.reduce((s, c) => s + parseFloat(c.total_comissoes || '0'), 0)
  const totalLiquido   = contratos.reduce((s, c) => s + parseFloat(c.total_liquido   || '0'), 0)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await api.admin.contratos() as ContratoFornecedor[]
      setContratos(dados)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarTaxa(fornecedorId: string) {
    const taxa = parseFloat(novaTaxa[fornecedorId] ?? '')
    if (isNaN(taxa) || taxa < 8 || taxa > 12) {
      alert('A taxa deve estar entre 8% e 12%')
      return
    }
    setSalvando(fornecedorId)
    try {
      await api.admin.definirTaxa(fornecedorId, {
        taxa_comissao: taxa,
        observacoes: novaObs[fornecedorId] ?? undefined,
      })
      setEditando(null)
      await carregar()
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao guardar taxa')
    } finally {
      setSalvando(null)
    }
  }

  async function verHistorico(fornecedorId: string) {
    if (historico?.id === fornecedorId) { setHistorico(null); return }
    try {
      const dados = await api.admin.historicoContrato(fornecedorId) as Historico[]
      setHistorico({ id: fornecedorId, dados })
    } catch {
      alert('Erro ao carregar histórico')
    }
  }

  function iniciarEdicao(c: ContratoFornecedor) {
    setEditando(c.fornecedor_id)
    setNovaTaxa(prev => ({ ...prev, [c.fornecedor_id]: c.taxa_comissao ?? '10' }))
    setNovaObs(prev => ({ ...prev,  [c.fornecedor_id]: c.observacoes ?? '' }))
  }

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111111]">Contratos e Comissões</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Define a taxa de comissão por fornecedor (entre 8% e 12%). A taxa é aplicada automaticamente quando um pedido é marcado como entregue.
        </p>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Fornecedores</p>
          <p className="text-2xl font-bold text-[#111111]">{contratos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Com contrato activo</p>
          <p className="text-2xl font-bold text-green-600">
            {contratos.filter(c => c.contrato_ativo).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total comissões cobradas</p>
          <p className="text-lg font-bold text-[#dc2626]">
            {totalComissoes.toLocaleString('pt-AO')} Kz
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total líquido fornecedores</p>
          <p className="text-lg font-bold text-[#111111]">
            {totalLiquido.toLocaleString('pt-AO')} Kz
          </p>
        </div>
      </div>

      {/* Aviso: fornecedores sem contrato */}
      {contratos.some(c => !c.contrato_ativo) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {contratos.filter(c => !c.contrato_ativo).length} fornecedor(es) sem contrato activo
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Estes fornecedores usarão a taxa padrão de <strong>10%</strong> até um contrato ser definido.
            </p>
          </div>
        </div>
      )}

      {/* Lista de contratos */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {contratos.map(c => {
          const taxa = parseFloat(c.taxa_comissao ?? '10')
          const estaEditando = editando === c.fornecedor_id
          const estaSalvando = salvando === c.fornecedor_id
          const verHistoricoAberto = historico?.id === c.fornecedor_id

          return (
            <div key={c.fornecedor_id}>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${c.suspenso ? 'bg-gray-400' : 'bg-[#dc2626]'}`}>
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[#111111] text-sm truncate">{c.nome}</p>
                      {c.suspenso && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Suspenso</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{c.email} · {c.provincia}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.total_vendas} vendas ·{' '}
                      {parseFloat(c.total_comissoes).toLocaleString('pt-AO')} Kz em comissões
                    </p>
                  </div>
                </div>

                {/* Taxa actual */}
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {!estaEditando ? (
                    <>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Taxa actual</p>
                        <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full border ${COR_TAXA(taxa)}`}>
                          {c.taxa_comissao ? `${taxa.toFixed(1)}%` : '10% (padrão)'}
                        </span>
                      </div>
                      {c.data_inicio && (
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-gray-400 mb-1">Desde</p>
                          <p className="text-xs text-gray-600">
                            {new Date(c.data_inicio).toLocaleDateString('pt-AO')}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => iniciarEdicao(c)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors"
                        >
                          ✏️ Alterar taxa
                        </button>
                        <button
                          onClick={() => verHistorico(c.fornecedor_id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${verHistoricoAberto ? 'border-gray-400 text-gray-700 bg-gray-50' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                        >
                          Histórico
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Formulário de edição inline */
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 shrink-0">Taxa (8–12%)</label>
                        <input
                          type="number"
                          min={8} max={12} step={0.5}
                          value={novaTaxa[c.fornecedor_id] ?? '10'}
                          onChange={e => setNovaTaxa(prev => ({ ...prev, [c.fornecedor_id]: e.target.value }))}
                          className="w-20 px-2 py-1 text-sm border border-[#dc2626] rounded focus:outline-none font-bold text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Observação (opcional)"
                        value={novaObs[c.fornecedor_id] ?? ''}
                        onChange={e => setNovaObs(prev => ({ ...prev, [c.fornecedor_id]: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => salvarTaxa(c.fornecedor_id)}
                          disabled={estaSalvando}
                          className="text-xs bg-[#dc2626] text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {estaSalvando ? 'A guardar…' : '✓ Guardar'}
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico expandido */}
              {verHistoricoAberto && historico && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-3 mb-2">
                    Histórico de contratos
                  </p>
                  {historico.dados.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhum contrato registado</p>
                  ) : (
                    <div className="space-y-1.5">
                      {historico.dados.map(h => (
                        <div key={h.id} className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-medium border ${h.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {parseFloat(h.taxa_comissao).toFixed(1)}%
                          </span>
                          <span className="text-gray-600">
                            {new Date(h.data_inicio).toLocaleDateString('pt-AO')}
                            {h.data_fim ? ` → ${new Date(h.data_fim).toLocaleDateString('pt-AO')}` : ' → actual'}
                          </span>
                          {h.observacoes && <span className="text-gray-400 italic">{h.observacoes}</span>}
                          {h.ativo && <span className="text-green-600 font-medium">● Activo</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legenda das cores */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legenda das taxas</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '8% – 8.5%', cor: 'text-green-700 bg-green-50 border-green-200', desc: 'Taxa mínima (fornecedor premium)' },
            { label: '8.5% – 10%', cor: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'Taxa reduzida' },
            { label: '10% – 11%', cor: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Taxa padrão' },
            { label: '11% – 12%', cor: 'text-red-700 bg-red-50 border-red-200', desc: 'Taxa máxima' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${l.cor}`}>{l.label}</span>
              <span className="text-xs text-gray-500">{l.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
