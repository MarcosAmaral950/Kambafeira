'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

type Avaliacao = {
  id: string
  nota: number
  comentario?: string
  resposta?: string
  criada_em: string
  comprador_nome: string
}

type Peca = {
  id: string; titulo: string; descricao: string; preco: number
  condicao: string; fotos: string[]; foto_principal: string | null
  marca_veiculo: string | null; modelo_veiculo: string | null
  ano_veiculo_de: number | null; ano_veiculo_ate: number | null
  numero_parte: string | null; estoque: number; visualizacoes: number
  categoria: string; categoria_slug: string
  fornecedor_id: string
  fornecedor_nome: string; provincia: string; municipio: string | null
  avaliacao_media: number; total_avaliacoes: number
  fornecedor_whatsapp: string | null
  status: string
}

type Comprador = {
  id: string
  nome: string
  email: string
  telefone: string | null
}

const ETIQUETA_CONDICAO: Record<string, { texto: string; cor: string }> = {
  novo:       { texto: 'Novo',        cor: 'bg-green-100 text-green-700' },
  bom:        { texto: 'Bom estado',  cor: 'bg-blue-100 text-blue-700' },
  regular:    { texto: 'Regular',     cor: 'bg-yellow-100 text-yellow-700' },
  para_pecas: { texto: 'Para peças',  cor: 'bg-gray-100 text-gray-600' },
}

const METODOS_PAGAMENTO = [
  { valor: 'transferencia_bancaria', texto: 'Transferência bancária' },
  { valor: 'dinheiro_na_entrega',    texto: 'Dinheiro na entrega' },
  { valor: 'tpa_na_entrega',         texto: 'TPA na entrega' },
  { valor: 'mpesa',                  texto: 'M-Pesa' },
]

// ── Modal Fazer Pedido (comprador) ────────────────────────────────────────────
function ModalFazerPedido({
  peca,
  estaLogado,
  onFechar,
  onSucesso,
}: {
  peca: Peca
  estaLogado: boolean
  onFechar: () => void
  onSucesso: () => void
}) {
  const router = useRouter()
  const [quantidade, setQuantidade] = useState(1)
  const [metodoPagamento, setMetodoPagamento] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const preco = Number(peca.preco)
  const subtotal = preco * quantidade
  const subtotalFormatado = subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })
  const precoUnitFormatado = preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

  function fecharEReset() {
    setQuantidade(1)
    setMetodoPagamento('')
    setNotas('')
    setMensagemErro('')
    setSucesso(false)
    onFechar()
  }

  async function confirmarPedido() {
    if (!estaLogado) {
      router.push(`/login?redirect=/pecas/${peca.id}`)
      return
    }

    setEnviando(true)
    setMensagemErro('')

    try {
      await api.pedidos.criar({
        peca_id: peca.id,
        quantidade,
        metodo_pagamento: metodoPagamento || undefined,
        notas_comprador: notas || undefined,
      })
      setSucesso(true)
      setTimeout(() => {
        fecharEReset()
        onSucesso()
        router.push('/pedidos')
      }, 2000)
    } catch (err) {
      if (err instanceof ErroAPI) {
        if (err.message.toLowerCase().includes('estoque')) {
          setMensagemErro('Estoque insuficiente para a quantidade solicitada.')
        } else {
          setMensagemErro(err.message)
        }
      } else {
        setMensagemErro('Erro ao processar pedido. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) fecharEReset() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111] text-base">Fazer Pedido</h2>
          <button onClick={fecharEReset} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumo da peça */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
          {peca.foto_principal && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={peca.foto_principal} alt={peca.titulo} fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111] text-sm truncate">{peca.titulo}</p>
            <p className="text-[#dc2626] font-bold text-base">{precoUnitFormatado}</p>
            <p className="text-xs text-gray-400">{peca.estoque} em stock</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Estado de sucesso */}
          {sucesso && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium text-sm">Pedido feito! O fornecedor será notificado.</p>
            </div>
          )}

          {/* Erro */}
          {mensagemErro && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{mensagemErro}</p>
            </div>
          )}

          {!sucesso && (
            <>
              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                    disabled={quantidade <= 1}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-[#111111] w-8 text-center">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade(q => Math.min(peca.estoque, q + 1))}
                    disabled={quantidade >= peca.estoque}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400 ml-1">máx. {peca.estoque}</span>
                </div>
              </div>

              {/* Método de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de pagamento</label>
                <select
                  value={metodoPagamento}
                  onChange={e => setMetodoPagamento(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#dc2626] bg-white"
                >
                  <option value="">Seleccionar método...</option>
                  {METODOS_PAGAMENTO.map(m => (
                    <option key={m.valor} value={m.valor}>{m.texto}</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observações para o fornecedor…"
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#dc2626] resize-none"
                />
              </div>

              {/* Subtotal */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-bold text-[#dc2626] text-base">{subtotalFormatado}</span>
              </div>
            </>
          )}
        </div>

        {/* Botões */}
        {!sucesso && (
          <div className="flex gap-3 p-4 border-t border-gray-100">
            <button
              onClick={fecharEReset}
              className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarPedido}
              disabled={enviando}
              className="flex-1 bg-[#dc2626] text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A processar…
                </>
              ) : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal Pedido Manual (admin) ───────────────────────────────────────────────
function ModalPedidoManual({
  peca,
  onFechar,
}: {
  peca: Peca
  onFechar: () => void
}) {
  const [compradores, setCompradores] = useState<Comprador[]>([])
  const [compradorId, setCompradorId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [metodoPagamento, setMetodoPagamento] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregandoCompradores, setCarregandoCompradores] = useState(true)

  const preco = Number(peca.preco)
  const subtotal = preco * quantidade
  const subtotalFormatado = subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })
  const precoUnitFormatado = preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

  useEffect(() => {
    api.admin.compradores()
      .then((r: unknown) => {
        setCompradores(r as Comprador[])
      })
      .catch(() => {})
      .finally(() => setCarregandoCompradores(false))
  }, [])

  function fecharEReset() {
    setCompradorId('')
    setQuantidade(1)
    setMetodoPagamento('')
    setNotas('')
    setMensagemErro('')
    setSucesso(false)
    onFechar()
  }

  async function confirmarPedido() {
    if (!compradorId) {
      setMensagemErro('Seleccione um comprador.')
      return
    }

    setEnviando(true)
    setMensagemErro('')

    try {
      await api.admin.pedidoManual({
        peca_id: peca.id,
        comprador_id: compradorId,
        quantidade,
        metodo_pagamento: metodoPagamento || undefined,
        notas_comprador: notas || undefined,
      })
      setSucesso(true)
      setTimeout(() => {
        fecharEReset()
      }, 2000)
    } catch (err) {
      if (err instanceof ErroAPI) {
        setMensagemErro(err.message)
      } else {
        setMensagemErro('Erro ao processar pedido. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) fecharEReset() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111] text-base">Pedido Manual — Admin</h2>
          <button onClick={fecharEReset} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumo da peça */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
          {peca.foto_principal && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={peca.foto_principal} alt={peca.titulo} fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111] text-sm truncate">{peca.titulo}</p>
            <p className="text-[#dc2626] font-bold text-base">{precoUnitFormatado}</p>
            <p className="text-xs text-gray-400">{peca.estoque} em stock</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Estado de sucesso */}
          {sucesso && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium text-sm">Pedido manual registado!</p>
            </div>
          )}

          {/* Erro */}
          {mensagemErro && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{mensagemErro}</p>
            </div>
          )}

          {!sucesso && (
            <>
              {/* Seleccionar comprador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprador <span className="text-[#dc2626]">*</span>
                </label>
                {carregandoCompradores ? (
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ) : (
                  <select
                    value={compradorId}
                    onChange={e => setCompradorId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#dc2626] bg-white"
                  >
                    <option value="">Seleccionar comprador...</option>
                    {compradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.email}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                    disabled={quantidade <= 1}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-[#111111] w-8 text-center">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade(q => Math.min(peca.estoque, q + 1))}
                    disabled={quantidade >= peca.estoque}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400 ml-1">máx. {peca.estoque}</span>
                </div>
              </div>

              {/* Método de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de pagamento</label>
                <select
                  value={metodoPagamento}
                  onChange={e => setMetodoPagamento(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#dc2626] bg-white"
                >
                  <option value="">Seleccionar método...</option>
                  {METODOS_PAGAMENTO.map(m => (
                    <option key={m.valor} value={m.valor}>{m.texto}</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observações para o fornecedor…"
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#dc2626] resize-none"
                />
              </div>

              {/* Subtotal */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-bold text-[#dc2626] text-base">{subtotalFormatado}</span>
              </div>
            </>
          )}
        </div>

        {/* Botões */}
        {!sucesso && (
          <div className="flex gap-3 p-4 border-t border-gray-100">
            <button
              onClick={fecharEReset}
              className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarPedido}
              disabled={enviando || !compradorId}
              className="flex-1 bg-[#dc2626] text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A processar…
                </>
              ) : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PaginaDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { usuario } = useAuth()

  const [peca, setPeca] = useState<Peca | null>(null)
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [modalPedidoAberto, setModalPedidoAberto] = useState(false)
  const [modalPedidoManualAberto, setModalPedidoManualAberto] = useState(false)
  const [fornecedorIdProprio, setFornecedorIdProprio] = useState<string | null>(null)

  useEffect(() => {
    api.pecas.obter(params.id)
      .then(dados => {
        const p = dados as Peca
        setPeca(p)
        setCarregando(false)
        // Carregar avaliações do fornecedor (não bloquear)
        if (p.fornecedor_id) {
          api.avaliacoes.doFornecedor(p.fornecedor_id)
            .then((r: unknown) => {
              const res = r as { avaliacoes: Avaliacao[] }
              setAvaliacoes(res.avaliacoes ?? [])
            })
            .catch(() => {})
        }
      })
      .catch(err => {
        if (err instanceof ErroAPI && err.status === 404) router.push('/')
        setCarregando(false)
      })
  }, [params.id, router])

  useEffect(() => {
    // Se é fornecedor, obter o seu fornecedor_id para comparar com a peça
    if (usuario?.perfil === 'fornecedor') {
      api.pecas.meuId()
        .then((d: unknown) => {
          const r = d as { fornecedor_id: string }
          setFornecedorIdProprio(r.fornecedor_id)
        })
        .catch(() => {})
    }
  }, [usuario])

  // É o fornecedor dono desta peça?
  const eDonoDaPeca = usuario?.perfil === 'fornecedor' && fornecedorIdProprio === peca?.fornecedor_id

  // Toggle de status pelo fornecedor (dono)
  async function toggleStatusFornecedor() {
    if (!peca) return
    const novoStatus = peca.status === 'activo' ? 'rascunho' : 'activo'
    try {
      await api.pecas.atualizarRapido(peca.id, { status: novoStatus })
      setPeca(prev => prev ? { ...prev, status: novoStatus } : prev)
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao actualizar')
    }
  }

  // Toggle de status pelo admin
  async function toggleStatusAdmin() {
    if (!peca) return
    const novoStatus = peca.status === 'suspenso' ? 'activo' : 'suspenso'
    try {
      await api.admin.suspenderPeca(peca.id, novoStatus)
      setPeca(prev => prev ? { ...prev, status: novoStatus } : prev)
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao actualizar')
    }
  }

  // Partilhar via Web Share API
  async function partilhar() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: peca!.titulo, text: `Encontrei esta peça no KambaFeira: ${peca!.titulo}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copiado para a área de transferência!')
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-4" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!peca) return null

  const fotos = peca.fotos.length > 0 ? peca.fotos : (peca.foto_principal ? [peca.foto_principal] : [])
  const condicao = ETIQUETA_CONDICAO[peca.condicao] ?? ETIQUETA_CONDICAO.regular
  const preco = Number(peca.preco).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

  const mensagemWhatsapp = encodeURIComponent(
    `Olá! Vi a peça "${peca.titulo}" no KambaFeira e tenho interesse. Ainda disponível?`
  )
  const linkWhatsapp = peca.fornecedor_whatsapp
    ? `https://wa.me/${peca.fornecedor_whatsapp.replace(/\D/g, '')}?text=${mensagemWhatsapp}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Modais */}
      {modalPedidoAberto && (
        <ModalFazerPedido
          peca={peca}
          estaLogado={!!usuario}
          onFechar={() => setModalPedidoAberto(false)}
          onSucesso={() => setModalPedidoAberto(false)}
        />
      )}
      {modalPedidoManualAberto && (
        <ModalPedidoManual
          peca={peca}
          onFechar={() => setModalPedidoManualAberto(false)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-[#dc2626]">Peças</Link>
          <span>/</span>
          <Link href={`/?categoria=${peca.categoria_slug}`} className="hover:text-[#dc2626]">{peca.categoria}</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[180px]">{peca.titulo}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galeria */}
          <div>
            <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-2">
              {fotos.length > 0 ? (
                <Image
                  src={fotos[fotoAtiva]}
                  alt={peca.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {fotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {fotos.map((foto, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoAtiva(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === fotoAtiva ? 'border-[#dc2626]' : 'border-gray-200'
                    }`}
                  >
                    <Image src={foto} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">{peca.categoria}</p>
              <h1 className="text-xl font-bold text-[#111111] leading-tight mb-2">{peca.titulo}</h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${condicao.cor}`}>
                  {condicao.texto}
                </span>
                {peca.estoque > 1 && (
                  <span className="text-xs text-gray-400">{peca.estoque} em stock</span>
                )}
              </div>
            </div>

            <p className="text-3xl font-bold text-[#dc2626]">{preco}</p>

            {/* Compatibilidade */}
            {(peca.marca_veiculo || peca.numero_parte) && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">Compatibilidade</p>
                {peca.marca_veiculo && <p className="text-gray-600"><span className="text-gray-400">Marca:</span> {peca.marca_veiculo}</p>}
                {peca.modelo_veiculo && <p className="text-gray-600"><span className="text-gray-400">Modelo:</span> {peca.modelo_veiculo}</p>}
                {(peca.ano_veiculo_de || peca.ano_veiculo_ate) && (
                  <p className="text-gray-600">
                    <span className="text-gray-400">Anos:</span>{' '}
                    {[peca.ano_veiculo_de, peca.ano_veiculo_ate].filter(Boolean).join(' – ')}
                  </p>
                )}
                {peca.numero_parte && <p className="text-gray-600"><span className="text-gray-400">Nº peça:</span> {peca.numero_parte}</p>}
              </div>
            )}

            {/* Fornecedor */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Fornecedor</p>
              <p className="font-semibold text-[#111111]">{peca.fornecedor_nome}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {[peca.provincia, peca.municipio].filter(Boolean).join(', ')}
              </p>
              {peca.total_avaliacoes > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#f59e0b]">★</span>
                  <span className="text-sm font-medium">{Number(peca.avaliacao_media).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({peca.total_avaliacoes} avaliações)</span>
                </div>
              )}
            </div>

            {/* Painel de acções contextual */}
            <div className="flex flex-col gap-3">

              {/* ── COMPRADOR ou visitante não logado ── */}
              {(!usuario || usuario.perfil === 'comprador') && (
                <>
                  {/* Fazer Pedido — só se tiver stock */}
                  {peca.estoque > 0 ? (
                    <button
                      onClick={() => setModalPedidoAberto(true)}
                      className="flex items-center justify-center gap-2 bg-[#dc2626] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-red-700 transition-colors text-sm"
                    >
                      🛒 Fazer Pedido
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-semibold py-3.5 px-6 rounded-xl text-sm cursor-not-allowed">
                      ❌ Sem stock disponível
                    </div>
                  )}

                  {/* WhatsApp */}
                  {linkWhatsapp && (
                    <a
                      href={linkWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.113 1.527 5.842L0 24l6.302-1.516A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.376l-.36-.214-3.732.897.934-3.629-.235-.373A9.818 9.818 0 0112 2.182c5.427 0 9.818 4.391 9.818 9.818 0 5.428-4.391 9.818-9.818 9.818z"/>
                      </svg>
                      Contactar via WhatsApp
                    </a>
                  )}

                  {/* Partilhar */}
                  <button
                    onClick={partilhar}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    🔗 Partilhar esta peça
                  </button>

                  {/* Ver mais deste fornecedor */}
                  <Link
                    href={`/?fornecedor_id=${peca.fornecedor_id}`}
                    className="text-center text-sm text-[#dc2626] hover:underline py-1"
                  >
                    Ver mais peças de {peca.fornecedor_nome} →
                  </Link>
                </>
              )}

              {/* ── FORNECEDOR — dono desta peça ── */}
              {eDonoDaPeca && (
                <>
                  <Link
                    href={`/dashboard/pecas/${peca.id}/editar`}
                    className="flex items-center justify-center gap-2 bg-[#111111] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    ✏️ Editar esta peça
                  </Link>
                  <Link
                    href="/dashboard/stock"
                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:border-[#dc2626] hover:text-[#dc2626] transition-colors text-sm"
                  >
                    📦 Ajustar stock
                  </Link>
                  <button
                    onClick={toggleStatusFornecedor}
                    className={`flex items-center justify-center gap-2 font-medium py-3 px-6 rounded-xl transition-colors text-sm border ${
                      peca.status === 'activo'
                        ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                        : 'border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {peca.status === 'activo' ? '⏸ Pausar publicação' : '▶ Activar publicação'}
                  </button>
                </>
              )}

              {/* ── FORNECEDOR — peça de outro fornecedor (não pode fazer pedido) ── */}
              {usuario?.perfil === 'fornecedor' && !eDonoDaPeca && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-yellow-700">Fornecedores não podem fazer pedidos.</p>
                </div>
              )}

              {/* ── ADMIN ── */}
              {usuario?.perfil === 'admin' && (
                <>
                  <button
                    onClick={() => setModalPedidoManualAberto(true)}
                    className="flex items-center justify-center gap-2 bg-[#dc2626] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-red-700 transition-colors text-sm"
                  >
                    🛒 Pedido Manual
                  </button>
                  <Link
                    href={`/dashboard/pecas/${peca.id}/editar`}
                    className="flex items-center justify-center gap-2 bg-[#111111] text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    ✏️ Editar Peça
                  </Link>
                  <button
                    onClick={toggleStatusAdmin}
                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:border-yellow-400 hover:text-yellow-700 transition-colors text-sm"
                  >
                    {peca.status === 'suspenso' ? '▶ Activar Peça' : '⏸ Suspender Peça'}
                  </button>
                  <Link
                    href="/admin/pedidos"
                    className="text-center text-sm text-gray-500 hover:text-[#dc2626] py-1"
                  >
                    Ver pedidos desta peça →
                  </Link>
                </>
              )}

            </div>

            <p className="text-xs text-gray-400 text-center">{peca.visualizacoes} pessoas viram esta peça</p>
          </div>
        </div>

        {/* Descrição */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-[#111111] mb-3">Descrição</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{peca.descricao}</p>
        </div>

        {/* Avaliações do fornecedor */}
        {avaliacoes.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-bold text-[#111111]">Avaliações do fornecedor</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[#f59e0b] text-lg">★</span>
                <span className="font-semibold">{Number(peca.avaliacao_media).toFixed(1)}</span>
                <span className="text-sm text-gray-400">({peca.total_avaliacoes})</span>
              </div>
            </div>
            <div className="space-y-4">
              {avaliacoes.slice(0, 5).map(av => (
                <div key={av.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{av.comprador_nome}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(av.criada_em).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className="text-sm">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={i <= av.nota ? 'text-[#f59e0b]' : 'text-gray-300'}>★</span>
                      ))}
                    </span>
                  </div>
                  {av.comentario && (
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{av.comentario}</p>
                  )}
                  {av.resposta && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border-l-2 border-[#dc2626]">
                      <p className="text-xs font-medium text-[#dc2626] mb-0.5">Resposta do fornecedor:</p>
                      <p className="text-xs text-gray-600">{av.resposta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
