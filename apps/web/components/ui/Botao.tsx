'use client'
import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'perigo'
  carregando?: boolean
  largura?: 'auto' | 'total'
}

export function Botao({
  variante = 'primario',
  carregando = false,
  largura = 'total',
  children,
  disabled,
  className = '',
  ...resto
}: Props) {
  const base = 'font-semibold py-3 px-6 rounded-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const estilos = {
    primario: 'bg-[#dc2626] text-white hover:bg-red-700 focus:ring-red-500',
    secundario: 'bg-[#111111] text-white hover:bg-gray-800 focus:ring-gray-500',
    perigo: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400',
  }[variante]

  const larguraEstilo = largura === 'total' ? 'w-full' : ''

  return (
    <button
      disabled={disabled || carregando}
      className={`${base} ${estilos} ${larguraEstilo} ${className}`}
      {...resto}
    >
      {carregando ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          A processar…
        </span>
      ) : children}
    </button>
  )
}
