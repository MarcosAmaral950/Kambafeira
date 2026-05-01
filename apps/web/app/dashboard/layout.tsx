'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Logo } from '@/components/Logo'

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!carregando && (!usuario || usuario.perfil === 'comprador')) {
      router.replace('/login')
    }
  }, [usuario, carregando, router])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!usuario || usuario.perfil === 'comprador') return null

  const navLinks = [
    { href: '/dashboard',              label: 'Resumo',     icone: '📊' },
    { href: '/dashboard/pecas',        label: 'Peças',      icone: '🔧' },
    { href: '/dashboard/pedidos',      label: 'Pedidos',    icone: '📦' },
    { href: '/dashboard/avaliacoes',   label: 'Avaliações', icone: '⭐' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden sm:flex fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 flex-col z-40">
        <div className="p-4 border-b border-gray-100">
          <Link href="/">
            <Logo tamanho="sm" />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ href, label, icone }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-[#dc2626] transition-colors"
            >
              <span>{icone}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#dc2626] flex items-center justify-center text-white text-xs font-bold">
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{usuario.nome.split(' ')[0]}</p>
              <p className="text-xs text-gray-400">Fornecedor</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-[#dc2626]">← Voltar ao site</Link>
        </div>
      </aside>

      {/* Barra mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex">
        {navLinks.map(({ href, label, icone }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 text-gray-600 hover:text-[#dc2626]">
            <span className="text-lg">{icone}</span>
            <span className="text-xs mt-0.5">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Conteúdo principal */}
      <main className="sm:ml-56 min-h-screen pb-20 sm:pb-0">
        {children}
      </main>
    </div>
  )
}
