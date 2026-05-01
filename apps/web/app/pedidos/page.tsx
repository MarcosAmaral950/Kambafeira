'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

type Pedido = {
  id: string
  status: string
  quantidade: number
  preco_total: string
  criada_em: string
  atualizada_em: string
  peca_titulo: string
  peca_foto?: string
  fornecedor_nome: string
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
  pendente:      'Pendente',
  confirmado:    'Confirmado',
  pago:          'Pago',
  em_preparacao: 'Em preparação',
  enviado:       'Enviado',
  entregue:      'Entregue',
  cancelado:     'Cancelado',
}

export default function PaginaMeusPedidos() {
  const { usuario, carregando: authCarregando } = useAuth()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (authCarregando) return
    if (!usuario) { router.replace('/login'); return }
    if (usuario.perfil !== 'comprador') { router.replace('/dashboard'); return }

    api.pedidos.meus()
      .then(d => setPedidos(d as Pedido[]))
      .catch(err => { if (err instanceof ErroAPI && err.status === 401) router.replace('/login') })
      .finally(() => setCarregando(false))
  }, [usuario, authCarregando, router])

  if (authCarregando || carregando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#111111]">Os meus pedidos</h1>
          <Link href="/pedidos/avaliar" className="text-sm text-[#dc2626] hover:underline font-medium">
            Avaliar compras ⭐
          </Link>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500 font-medium">Ainda não fizeste nenhum pedido</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#dc2626] hover:underline">
              Ver peças disponíveis →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#111111] truncate">{pedido.peca_titulo}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{pedido.fornecedor_nome}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(pedido.criada_em).toLocaleDateString('pt-PT')}
                      {' · '}Qtd: {pedido.quantidade}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#dc2626] text-sm">
                      {Number(pedido.preco_total).toLocaleString('pt-AO')} Kz
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                      COR_STATUS[pedido.status] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {LABEL_STATUS[pedido.status] ?? pedido.status}
                    </span>
                  </div>
                </div>

                {pedido.status === 'entregue' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link
                      href={`/pedidos/avaliar?pedido=${pedido.id}`}
                      className="text-xs text-[#f59e0b] font-medium hover:underline"
                    >
                      ⭐ Avaliar esta compra
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
