'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { api, ErroAPI } from '@/lib/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ItemStockAdmin = {
  id: string
  titulo: string
  foto_principal: string | null
  estoque: number
  preco: string
  status: string
  marca_veiculo: string | null
  fornecedor_id: string
  fornecedor_nome: string
  total_vendido: number
  ultima_venda: string | null
}

type Movimento = {
  id: string
  tipo: string
  quantidade_anterior: number
  quantidade_nova: number
  variacao: number
  motivo: string | null
  criado_em: string
  criado_por_nome: string | null
}

type FornecedorOpcao = {
  id: string
  nome: string
}

type TipoAjuste = 'venda_externa' | 'stock_recebido' | 'correcao' | 'dano_perda'

type EstadoPainel = {
  pecaId: string
  estoqueNovo: string
  tipo: TipoAjuste
  observacao: string
  carregando: boolean
  erro: string
  movimentos: Movimento[] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function corEstoque(qtd: number): string {
  if (qtd <= 0) return 'text-red-600 font-bold'
  if (qtd <= 2) return 'text-orange-500 font-semibold'
  return 'text-green-600 font-semibold'
}

function labelEstoque(qtd: number): string {
  if (qtd <= 0) return 'Esgotado'
  if (qtd <= 2) return `${qtd} (Baixo)`
  return String(qtd)
}

function iconeMovimento(tipo: string): string {
  switch (tipo) {
    case 'venda_plataforma': return '🛒'
    case 'venda_externa':    return '💰'
    case 'stock_recebido':   return '📥'
    case 'correcao':         return '✏️'
    case 'dano_perda':       return '⚠️'
    case 'cancelamento':     return '↩️'
    default:                 return '📋'
  }
}

function labelTipo(tipo: string): string {
  switch (tipo) {
    case 'venda_plataforma': return 'Venda plataforma'
    case 'venda_externa':    return 'Venda externa'
    case 'stock_recebido':   return 'Stock recebido'
    case 'correcao':         return 'Correcção'
    case 'dano_perda':       return 'Dano / perda'
    case 'cancelamento':     return 'Cancelamento'
    default:                 return tipo
  }
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PaginaStockAdmin() {
  const [itens, setItens] = useState<ItemStockAdmin[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorOpcao[]>([])
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [painel, setPainel] = useState<EstadoPainel | null>(null)

  // Carregar lista de fornecedores uma vez
  useEffect(() => {
    api.admin.fornecedoresLista()
      .then(d => setFornecedores(d as FornecedorOpcao[]))
      .catch(() => {})
  }, [])

  // Carregar stock ao mudar filtro
  useEffect(() => {
    carregarStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedorFiltro])

  async function carregarStock() {
    setCarregando(true)
    setErro('')
    try {
      const dados = await api.stock.admin(fornecedorFiltro || undefined)
      setItens(dados as ItemStockAdmin[])
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao carregar stock')
    } finally {
      setCarregando(false)
    }
  }

  function abrirPainel(peca: ItemStockAdmin) {
    if (painel?.pecaId === peca.id) {
      setPainel(null)
      return
    }
    setPainel({
      pecaId: peca.id,
      estoqueNovo: String(peca.estoque),
      tipo: 'correcao',
      observacao: '',
      carregando: false,
      erro: '',
      movimentos: null,
    })
  }

  async function confirmarAjuste(peca: ItemStockAdmin) {
    if (!painel) return
    setPainel(prev => prev ? { ...prev, carregando: true, erro: '' } : null)
    try {
      await api.stock.ajustarAdmin(peca.id, {
        estoque: parseInt(painel.estoqueNovo),
        tipo: painel.tipo,
        observacao: painel.observacao || undefined,
      })
      const [novosItens, movimentos] = await Promise.all([
        api.stock.admin(fornecedorFiltro || undefined),
        api.stock.movimentosAdmin(peca.id),
      ])
      setItens(novosItens as ItemStockAdmin[])
      setPainel(prev => prev ? {
        ...prev,
        carregando: false,
        movimentos: (movimentos as Movimento[]).slice(0, 5),
        estoqueNovo: String((novosItens as ItemStockAdmin[]).find(i => i.id === peca.id)?.estoque ?? painel.estoqueNovo),
      } : null)
    } catch (err) {
      const msg = err instanceof ErroAPI ? err.message : 'Erro ao ajustar stock'
      setPainel(prev => prev ? { ...prev, carregando: false, erro: msg } : null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#111111]">Stock — Visão Global</h1>
        <button onClick={carregarStock} className="text-sm text-gray-500 hover:text-[#dc2626]">Actualizar</button>
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
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">Sem peças encontradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(peca => (
            <div key={peca.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Linha principal */}
              <div className="flex items-center gap-3 p-4">
                {/* Foto */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {peca.foto_principal ? (
                    <Image
                      src={peca.foto_principal}
                      alt={peca.titulo}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🔧</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#111111] truncate">{peca.titulo}</p>
                  <p className="text-xs text-gray-400 truncate">{peca.fornecedor_nome}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-sm ${corEstoque(peca.estoque)}`}>
                      {labelEstoque(peca.estoque)} unid.
                    </span>
                    {Number(peca.total_vendido) > 0 && (
                      <span className="text-xs text-gray-400">
                        {peca.total_vendido} vendidas {peca.ultima_venda ? `· ${formatarData(peca.ultima_venda)}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão ajustar */}
                <button
                  onClick={() => abrirPainel(peca)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    painel?.pecaId === peca.id
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-[#dc2626] text-white hover:bg-red-700'
                  }`}
                >
                  {painel?.pecaId === peca.id ? 'Fechar' : 'Ajustar'}
                </button>
              </div>

              {/* Painel de ajuste inline */}
              {painel?.pecaId === peca.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Ajuste de stock — {peca.fornecedor_nome}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nova quantidade *</label>
                      <input
                        type="number"
                        min={0}
                        value={painel.estoqueNovo}
                        onChange={e => setPainel(prev => prev ? { ...prev, estoqueNovo: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Motivo *</label>
                      <select
                        value={painel.tipo}
                        onChange={e => setPainel(prev => prev ? { ...prev, tipo: e.target.value as TipoAjuste } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                      >
                        <option value="venda_externa">Venda externa</option>
                        <option value="stock_recebido">Stock recebido</option>
                        <option value="correcao">Correcção de inventário</option>
                        <option value="dano_perda">Dano ou perda</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observação</label>
                    <input
                      type="text"
                      value={painel.observacao}
                      onChange={e => setPainel(prev => prev ? { ...prev, observacao: e.target.value } : null)}
                      placeholder="Ex: Ajuste após inventário físico"
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                    />
                  </div>

                  {painel.erro && <p className="text-sm text-red-600">{painel.erro}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmarAjuste(peca)}
                      disabled={painel.carregando || painel.estoqueNovo === ''}
                      className="px-4 py-2 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {painel.carregando ? 'A guardar…' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setPainel(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Últimos 5 movimentos */}
                  {painel.movimentos !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Últimos movimentos</p>
                      {painel.movimentos.length === 0 ? (
                        <p className="text-xs text-gray-400">Sem movimentos registados.</p>
                      ) : (
                        <div className="space-y-2">
                          {painel.movimentos.map(mov => (
                            <div key={mov.id} className="flex items-center gap-2 text-xs">
                              <span className="text-base">{iconeMovimento(mov.tipo)}</span>
                              <span className={`font-semibold w-8 text-right ${mov.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mov.variacao >= 0 ? `+${mov.variacao}` : mov.variacao}
                              </span>
                              <span className="text-gray-500">{labelTipo(mov.tipo)}</span>
                              {mov.motivo && <span className="text-gray-400 truncate">· {mov.motivo}</span>}
                              {mov.criado_por_nome && <span className="text-gray-300">({mov.criado_por_nome})</span>}
                              <span className="text-gray-300 ml-auto flex-shrink-0">{formatarData(mov.criado_em)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
