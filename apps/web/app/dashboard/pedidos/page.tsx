'use client'
import { useEffect, useState } from 'react'
import { api, ErroAPI } from '@/lib/api'

type Pedido = {
  id: string; status: string; quantidade: number
  preco_total: string; criada_em: string
  peca_titulo: string; peca_foto?: string
  comprador_nome: string; comprador_telefone?: string
  notas_comprador?: string; notas_fornecedor?: string
}

const COR_STATUS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800', confirmado: 'bg-blue-100 text-blue-800',
  pago: 'bg-indigo-100 text-indigo-800', em_preparacao: 'bg-purple-100 text-purple-800',
  enviado: 'bg-orange-100 text-orange-800', entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', pago: 'Pago',
  em_preparacao: 'Em preparação', enviado: 'Enviado',
  entregue: 'Entregue', cancelado: 'Cancelado',
}

// Transições permitidas para o fornecedor
const PROXIMOS_STATUS: Record<string, string[]> = {
  pendente:      ['confirmado', 'cancelado'],
  confirmado:    ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado'],
  enviado:       ['entregue'],
}

export default function PaginaPedidosFornecedor() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  useEffect(() => {
    api.pedidos.doFornecedor()
      .then(d => setPedidos(d as Pedido[]))
      .finally(() => setCarregando(false))
  }, [])

  async function atualizarStatus(id: string, novoStatus: string) {
    setAtualizando(id)
    try {
      const atualizado = await api.pedidos.atualizarStatus(id, { status: novoStatus }) as Pedido
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: atualizado.status } : p))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao actualizar')
    } finally {
      setAtualizando(null)
    }
  }

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-xl font-bold text-[#111111]">Pedidos recebidos</h1>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400">Ainda não recebeste nenhum pedido</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map(pedido => {
            const proximos = PROXIMOS_STATUS[pedido.status] ?? []
            return (
              <div key={pedido.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#111111] truncate">{pedido.peca_titulo}</p>
                    <p className="text-sm text-gray-500">
                      {pedido.comprador_nome}
                      {pedido.comprador_telefone && (
                        <a href={`https://wa.me/${pedido.comprador_telefone.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="ml-2 text-green-600 hover:underline">
                          WhatsApp
                        </a>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(pedido.criada_em).toLocaleDateString('pt-PT')}
                      {' · '}Qtd: {pedido.quantidade}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#dc2626]">
                      {Number(pedido.preco_total).toLocaleString('pt-AO')} Kz
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[pedido.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {LABEL_STATUS[pedido.status] ?? pedido.status}
                    </span>
                  </div>
                </div>

                {pedido.notas_comprador && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">
                    💬 {pedido.notas_comprador}
                  </p>
                )}

                {/* Botões de transição de estado */}
                {proximos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {proximos.map(status => (
                      <button
                        key={status}
                        onClick={() => atualizarStatus(pedido.id, status)}
                        disabled={atualizando === pedido.id}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          status === 'cancelado'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-[#dc2626] text-white hover:bg-red-700'
                        }`}
                      >
                        {atualizando === pedido.id ? '…' : `Marcar ${LABEL_STATUS[status]}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
