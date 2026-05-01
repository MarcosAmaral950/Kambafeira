'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type Resumo = {
  usuarios:   { compradores: string; fornecedores: string; total: string }
  pecas:      { activas: string; total: string }
  vendas:     { total: string; pendentes: string; concluidas: string; volume_total: string }
  financeiro: { total_comissoes: string }
}

function CartaoAdmin({ titulo, valor, sub, cor }: { titulo: string; valor: string; sub?: string; cor: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function PaginaAdmin() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.admin.resumo()
      .then(d => setResumo(d as Resumo))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (!resumo) return <div className="p-6 text-red-600">Erro ao carregar dados</div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-bold text-[#111111]">Painel Administrativo</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CartaoAdmin titulo="Utilizadores" valor={resumo.usuarios.total}
          sub={`${resumo.usuarios.compradores} compradores · ${resumo.usuarios.fornecedores} fornecedores`}
          cor="text-[#111111]" />
        <CartaoAdmin titulo="Peças activas" valor={resumo.pecas.activas}
          sub={`${resumo.pecas.total} no total`} cor="text-[#111111]" />
        <CartaoAdmin titulo="Vendas concluídas" valor={resumo.vendas.concluidas}
          sub={`${resumo.vendas.pendentes} pendentes`} cor="text-green-600" />
        <CartaoAdmin titulo="Volume de vendas"
          valor={Number(resumo.vendas.volume_total).toLocaleString('pt-AO') + ' Kz'}
          cor="text-[#dc2626]" />
        <CartaoAdmin titulo="Comissões cobradas"
          valor={Number(resumo.financeiro.total_comissoes).toLocaleString('pt-AO') + ' Kz'}
          cor="text-[#dc2626]" />
        <CartaoAdmin titulo="Total pedidos" valor={resumo.vendas.total} cor="text-[#111111]" />
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/fornecedores',  icone: '🏪', label: 'Fornecedores' },
          { href: '/admin/utilizadores',  icone: '👥', label: 'Utilizadores' },
          { href: '/admin/pedidos',       icone: '🛒', label: 'Pedidos' },
          { href: '/admin/chaves',        icone: '🔑', label: 'Chaves-convite' },
        ].map(({ href, icone, label }) => (
          <Link key={href} href={href}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#dc2626] transition-colors text-center">
            <p className="text-2xl mb-1">{icone}</p>
            <p className="text-sm font-medium text-[#111111]">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
