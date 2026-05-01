'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Campo } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { api, ErroAPI } from '@/lib/api'

export default function PaginaLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await api.auth.login(email, password)
      router.push('/')
      router.refresh()
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao fazer login')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h1 className="text-xl font-bold text-[#111111] mb-1">Entrar na conta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Não tens conta?{' '}
        <Link href="/registo/comprador" className="text-[#dc2626] font-medium hover:underline">
          Registar como comprador
        </Link>
      </p>

      <form onSubmit={submeter} className="flex flex-col gap-4">
        <Campo
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="o.teu@email.com"
          required
          autoComplete="email"
        />
        <Campo
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <Botao type="submit" carregando={carregando}>
          Entrar
        </Botao>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          És fornecedor?{' '}
          <Link href="/registo/fornecedor" className="text-[#111111] font-medium hover:underline">
            Registo com chave de convite
          </Link>
        </p>
      </div>
    </div>
  )
}
