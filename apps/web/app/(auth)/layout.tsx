import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 pt-8 pb-5">
        <div className="max-w-md mx-auto px-4">
          <Link href="/">
            <Logo tamanho="sm" />
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        Feito em Angola · Para Angola
      </footer>
    </div>
  )
}
