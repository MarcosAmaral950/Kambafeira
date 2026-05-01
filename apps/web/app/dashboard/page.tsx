'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type Resumo = {
  pecas: { activas: string; rascunhos: string; vendidas: string; total: string }
  pedidos: { pendentes: string; confirmados: string; concluidos: string; total: string }
  financeiro: { total_vendas: string; total_comissoes: string; total_liquido: string }
  pedidos_recentes: {
    id: string; status: string; preco_total: string; criada_em: string
    peca_titulo: string; comprador_nome: string
  }[]
}

const COR_STATUS: Record<string, string> = {
  pendente:      'bg-yellow-100 text-yellow-800',
  confirmado:    'bg-blue-100 text-blue-800',
  pago:          'bg-indigo-100 text-indigo-800',
  em_preparacao: 'bg-purple-100 text-purple-800',
  enviado:       'bg-orange-100 text-orange-800',
  entregue:      'bg-green-100 text-green-800',
  cancelado:     'bg-red-100 text-red-800',
}

const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Confirmado', pago: 'Pago',
  em_preparacao: 'Em preparação', enviado: 'Enviado',
  entregue: 'Entregue', cancelado: 'Cancelado',
}

function formatKz(valor: string | number) {
  return Number(valor).toLocaleString('pt-AO') + ' Kz'
}

function CartaoEstat({ titulo, valor, sub, cor }: { titulo: string; valor: string; sub?: string; cor: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function PaginaDashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.dashboard.resumoFornecedor()
      .then(d => setResumo(d as Resumo))
      .catch(() => setErro('Erro ao carregar resumo'))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (erro || !resumo) {
    return <div className="p-6 text-red-600">{erro || 'Sem dados'}</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">Painel do Fornecedor</h1>
        <Link
          href="/dashboard/pecas/nova"
          className="bg-[#dc2626] text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          + Nova Peça
        </Link>
      </div>

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CartaoEstat
          titulo="Peças activas"
          valor={resumo.pecas.activas}
          sub={`${resumo.pecas.rascunhos} rascunhos`}
          cor="text-[#111111]"
        />
        <CartaoEstat
          titulo="Pedidos pendentes"
          valor={resumo.pedidos.pendentes}
          sub={`${resumo.pedidos.total} no total`}
          cor="text-yellow-600"
        />
        <CartaoEstat
          titulo="Vendas concluídas"
          valor={resumo.pedidos.concluidos}
          cor="text-green-600"
        />
        <CartaoEstat
          titulo="Valor líquido"
          valor={formatKz(resumo.financeiro.total_liquido)}
          sub={`Comissões: ${formatKz(resumo.financeiro.total_comissoes)}`}
          cor="text-[#dc2626]"
        />
      </div>

      {/* Pedidos recentes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#111111]">Pedidos recentes</h2>
          <Link href="/dashboard/pedidos" className="text-sm text-[#dc2626] hover:underline">
            Ver todos
          </Link>
        </div>

        {resumo.pedidos_recentes.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">Ainda sem pedidos</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {resumo.pedidos_recentes.map(p => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.peca_titulo}</p>
                  <p className="text-xs text-gray-400">{p.comprador_nome}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {LABEL_STATUS[p.status] ?? p.status}
                  </span>
                  <span className="text-sm font-semibold text-[#111111]">{formatKz(p.preco_total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/pecas"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#dc2626] transition-colors"
        >
          <p className="text-2xl mb-2">🔧</p>
          <p className="font-semibold text-[#111111]">Gerir Peças</p>
          <p className="text-xs text-gray-400 mt-0.5">{resumo.pecas.total} peças no total</p>
        </Link>
        <Link
          href="/dashboard/pedidos"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#dc2626] transition-colors"
        >
          <p className="text-2xl mb-2">📦</p>
          <p className="font-semibold text-[#111111]">Gerir Pedidos</p>
          <p className="text-xs text-gray-400 mt-0.5">{resumo.pedidos.pendentes} pendentes</p>
        </Link>
      </div>
    </div>
  )
}
