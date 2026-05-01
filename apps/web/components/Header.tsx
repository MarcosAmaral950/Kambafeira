'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Logo } from './Logo'

export function Header() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Logo tamanho="sm" />
        </Link>

        {/* Pesquisa rápida — desktop */}
        <form action="/" className="hidden sm:flex flex-1 max-w-md">
          <input
            name="q"
            type="search"
            placeholder="Pesquisar peças, marcas…"
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          />
          <button
            type="submit"
            className="bg-[#dc2626] text-white px-4 py-2 rounded-r-lg text-sm hover:bg-red-700 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Nav — desktop */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-[#dc2626] transition-colors">Peças</Link>
          <Link href="/login" className="text-gray-600 hover:text-[#dc2626] transition-colors">Entrar</Link>
          <Link
            href="/registo/comprador"
            className="bg-[#dc2626] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Registar
          </Link>
        </nav>

        {/* Botão menu — mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="sm:hidden p-2 text-gray-600"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuAberto
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <form action="/" className="flex">
            <input
              name="q"
              type="search"
              placeholder="Pesquisar peças…"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none"
            />
            <button type="submit" className="bg-[#dc2626] text-white px-3 py-2 rounded-r-lg text-sm">
              Buscar
            </button>
          </form>
          <Link href="/login" className="text-sm text-gray-700 py-1">Entrar</Link>
          <Link href="/registo/comprador" className="text-sm text-[#dc2626] font-medium py-1">Registar</Link>
          <Link href="/registo/fornecedor" className="text-sm text-gray-500 py-1">Sou fornecedor</Link>
        </div>
      )}
    </header>
  )
}
