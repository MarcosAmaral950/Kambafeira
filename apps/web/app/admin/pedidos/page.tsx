'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Pedido = {
  id: string; status: string; quantidade: number; preco_total: string
  criada_em: string; peca_titulo: string; fornecedor_nome: string; comprador_nome: string
}

const COR_STATUS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800', confirmado: 'bg-blue-100 text-blue-800',
  pago: 'bg-indigo-100 text-indigo-800', em_preparacao: 'bg-purple-100 text-purple-800',
  enviado: 'bg-orange-100 text-orange-800', entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', pago: 'Pago',
  em_preparacao: 'Em preparação', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
}

export default function PaginaPedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    api.admin.pedidos()
      .then(d => setPedidos(d as Pedido[]))
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.status === filtro)

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-xl font-bold text-[#111111]">Todos os Pedidos ({pedidos.length})</h1>

      {/* Filtro por status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['todos', 'pendente', 'confirmado', 'entregue', 'cancelado'].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              filtro === s ? 'bg-[#dc2626] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#dc2626]'
            }`}>
            {s === 'todos' ? 'Todos' : LABEL_STATUS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {filtrados.length === 0 ? (
          <p className="p-8 text-center text-gray-400">Nenhum pedido encontrado</p>
        ) : filtrados.map(p => (
          <div key={p.id} className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#111111] truncate">{p.peca_titulo}</p>
              <p className="text-sm text-gray-500">
                {p.comprador_nome} → {p.fornecedor_nome}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(p.criada_em).toLocaleDateString('pt-PT')} · Qtd: {p.quantidade}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-[#dc2626]">
                {Number(p.preco_total).toLocaleString('pt-AO')} Kz
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {LABEL_STATUS[p.status] ?? p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
