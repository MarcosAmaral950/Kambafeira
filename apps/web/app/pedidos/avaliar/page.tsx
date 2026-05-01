'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

type PedidoParaAvaliar = {
  id: string
  preco_total: string
  criada_em: string
  peca_titulo: string
  peca_foto?: string
  fornecedor_nome: string
}

function Estrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hover || valor) >= i ? 'text-[#f59e0b]' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  )
}

const LABEL_NOTA: Record<number, string> = {
  1: 'Muito mau',
  2: 'Mau',
  3: 'Aceitável',
  4: 'Bom',
  5: 'Excelente',
}

function FormularioAvaliacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { usuario, carregando: authCarregando } = useAuth()
  const pedidoPreSelecionado = searchParams.get('pedido')

  const [pedidos, setPedidos] = useState<PedidoParaAvaliar[]>([])
  const [carregando, setCarregando] = useState(true)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string>(pedidoPreSelecionado ?? '')
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (authCarregando) return
    if (!usuario) { router.replace('/login'); return }
    if (usuario.perfil !== 'comprador') { router.replace('/'); return }

    api.avaliacoes.pedidosParaAvaliar()
      .then(d => {
        const lista = d as PedidoParaAvaliar[]
        setPedidos(lista)
        // Se veio com pedido pré-selecionado, verificar se ainda está na lista
        if (pedidoPreSelecionado && lista.some(p => p.id === pedidoPreSelecionado)) {
          setPedidoSelecionado(pedidoPreSelecionado)
        } else if (lista.length > 0) {
          setPedidoSelecionado(lista[0].id)
        }
      })
      .finally(() => setCarregando(false))
  }, [usuario, authCarregando, router, pedidoPreSelecionado])

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    if (!pedidoSelecionado || nota === 0) return

    setEnviando(true)
    try {
      await api.avaliacoes.criar(pedidoSelecionado, {
        nota,
        comentario: comentario.trim() || undefined,
      })
      setSucesso(true)
      // Remover pedido da lista
      setPedidos(prev => prev.filter(p => p.id !== pedidoSelecionado))
      setNota(0)
      setComentario('')
      // Seleccionar próximo pedido se existir
      const restantes = pedidos.filter(p => p.id !== pedidoSelecionado)
      setPedidoSelecionado(restantes.length > 0 ? restantes[0].id : '')
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao enviar avaliação')
    } finally {
      setEnviando(false)
      // Esconder mensagem de sucesso após 3s
      setTimeout(() => setSucesso(false), 3000)
    }
  }

  const pedidoAtivo = pedidos.find(p => p.id === pedidoSelecionado)

  if (authCarregando || carregando) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-48 mb-6" />
        <div className="h-48 bg-gray-200 animate-pulse rounded-xl" />
      </div>
    )
  }

  if (pedidos.length === 0 && !sucesso) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-[#111111] mb-6">Avaliar compra</h1>
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">Não tens compras por avaliar</p>
          <p className="text-sm text-gray-400 mt-1">Todas as tuas compras entregues já foram avaliadas</p>
          <Link href="/pedidos" className="mt-4 inline-block text-sm text-[#dc2626] hover:underline">
            ← Ver todos os pedidos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pedidos" className="text-gray-400 hover:text-[#dc2626]">
          ← Pedidos
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-[#111111]">Avaliar compra</h1>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <p className="text-green-700 font-medium text-sm">Avaliação enviada com sucesso!</p>
        </div>
      )}

      {pedidos.length > 0 && (
        <form onSubmit={submeter} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Selecção de pedido */}
          {pedidos.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Selecciona a compra
              </label>
              <div className="space-y-2">
                {pedidos.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      pedidoSelecionado === p.id
                        ? 'border-[#dc2626] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pedido"
                      value={p.id}
                      checked={pedidoSelecionado === p.id}
                      onChange={() => setPedidoSelecionado(p.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{p.peca_titulo}</p>
                      <p className="text-xs text-gray-500">{p.fornecedor_nome}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Peça selecionada (quando só há uma) */}
          {pedidos.length === 1 && pedidoAtivo && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-[#111111]">{pedidoAtivo.peca_titulo}</p>
              <p className="text-sm text-gray-500 mt-0.5">{pedidoAtivo.fornecedor_nome}</p>
            </div>
          )}

          {/* Estrelas */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              A tua avaliação <span className="text-red-500">*</span>
            </label>
            <Estrelas valor={nota} onChange={setNota} />
            {nota > 0 && (
              <p className="text-sm text-gray-500 mt-1">{LABEL_NOTA[nota]}</p>
            )}
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Comentário <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Descreve a tua experiência com este fornecedor e peça..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comentario.length}/1000</p>
          </div>

          <button
            type="submit"
            disabled={nota === 0 || enviando}
            className="w-full bg-[#dc2626] text-white font-semibold py-3.5 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? 'A enviar…' : 'Publicar avaliação'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function PaginaAvaliar() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 bg-gray-200 animate-pulse rounded-xl" /></div>}>
        <FormularioAvaliacao />
      </Suspense>
    </div>
  )
}
