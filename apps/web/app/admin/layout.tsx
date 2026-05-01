'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Logo } from '@/components/Logo'

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!carregando && (!usuario || usuario.perfil !== 'admin')) {
      router.replace('/')
    }
  }, [usuario, carregando, router])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!usuario || usuario.perfil !== 'admin') return null

  const navLinks = [
    { href: '/admin',              label: 'Resumo',       icone: '📊' },
    { href: '/admin/fornecedores', label: 'Fornecedores', icone: '🏪' },
    { href: '/admin/pedidos',      label: 'Pedidos',      icone: '📦' },
    { href: '/admin/chaves',       label: 'Chaves',       icone: '🔑' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden sm:flex fixed top-0 left-0 h-full w-56 bg-[#111111] flex-col z-40">
        <div className="p-4 border-b border-gray-800">
          <Link href="/">
            <Logo tamanho="sm" />
          </Link>
          <span className="mt-2 inline-block text-xs bg-[#dc2626] text-white px-2 py-0.5 rounded font-medium">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ href, label, icone }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span>{icone}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300">← Voltar ao site</Link>
        </div>
      </aside>

      {/* Barra mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-gray-800 z-40 flex">
        {navLinks.map(({ href, label, icone }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 text-gray-400 hover:text-white">
            <span className="text-lg">{icone}</span>
            <span className="text-xs mt-0.5">{label}</span>
          </Link>
        ))}
      </nav>

      <main className="sm:ml-56 min-h-screen pb-20 sm:pb-0">
        {children}
      </main>
    </div>
  )
}
