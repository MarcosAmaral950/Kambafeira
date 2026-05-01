'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { api, ErroAPI } from '@/lib/api'

type Peca = {
  id: string; titulo: string; preco: string; status: string
  estoque: number; condicao: string; foto_principal?: string
  marca_veiculo?: string; modelo_veiculo?: string; criada_em: string
}

const COR_STATUS: Record<string, string> = {
  activo:   'bg-green-100 text-green-800',
  rascunho: 'bg-gray-100 text-gray-600',
  suspenso: 'bg-yellow-100 text-yellow-800',
  vendido:  'bg-blue-100 text-blue-800',
  removido: 'bg-red-100 text-red-800',
}

export default function PaginaPecasFornecedor() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [removendo, setRemovendo] = useState<string | null>(null)

  async function carregar() {
    try {
      const dados = await api.pecas.minhas() as Peca[]
      setPecas(dados)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function remover(id: string, titulo: string) {
    if (!confirm(`Remover "${titulo}"? Esta acção não pode ser desfeita.`)) return
    setRemovendo(id)
    try {
      await api.pecas.remover(id)
      setPecas(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao remover peça')
    } finally {
      setRemovendo(null)
    }
  }

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">As minhas peças</h1>
        <Link
          href="/dashboard/pecas/nova"
          className="bg-[#dc2626] text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          + Nova Peça
        </Link>
      </div>

      {pecas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-500 mb-4">Ainda não publicaste nenhuma peça</p>
          <Link href="/dashboard/pecas/nova" className="text-[#dc2626] font-medium hover:underline">
            Publicar a primeira peça →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {pecas.map(peca => (
            <div key={peca.id} className="flex items-center gap-4 p-4">
              {/* Foto */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {peca.foto_principal ? (
                  <Image
                    src={peca.foto_principal}
                    alt={peca.titulo}
                    width={64} height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🔧</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#111111] truncate">{peca.titulo}</p>
                <p className="text-sm text-gray-500">
                  {peca.marca_veiculo && `${peca.marca_veiculo} · `}
                  Estoque: {peca.estoque}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[peca.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {peca.status.charAt(0).toUpperCase() + peca.status.slice(1)}
                  </span>
                  <span className="text-sm font-semibold text-[#dc2626]">
                    {Number(peca.preco).toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>

              {/* Acções */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/pecas/${peca.id}/editar`}
                  className="text-sm text-gray-600 hover:text-[#dc2626] px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#dc2626] transition-colors"
                >
                  Editar
                </Link>
                <button
                  onClick={() => remover(peca.id, peca.titulo)}
                  disabled={removendo === peca.id}
                  className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  {removendo === peca.id ? '…' : 'Remover'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
