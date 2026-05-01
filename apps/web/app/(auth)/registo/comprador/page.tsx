'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Campo } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { api, ErroAPI } from '@/lib/api'

export default function PaginaRegistoComprador() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', password: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function atualizar(campo: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [campo]: e.target.value }))
  }

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (form.password !== form.confirmar) {
      setErro('As passwords não coincidem')
      return
    }
    if (form.password.length < 8) {
      setErro('A password deve ter pelo menos 8 caracteres')
      return
    }

    setCarregando(true)
    try {
      await api.auth.registoComprador({
        nome: form.nome,
        email: form.email,
        password: form.password,
        telefone: form.telefone || undefined,
      })
      router.push('/')
      router.refresh()
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao criar conta')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h1 className="text-xl font-bold text-[#111111] mb-1">Criar conta de comprador</h1>
      <p className="text-sm text-gray-500 mb-6">
        Já tens conta?{' '}
        <Link href="/login" className="text-[#dc2626] font-medium hover:underline">
          Entrar
        </Link>
      </p>

      <form onSubmit={submeter} className="flex flex-col gap-4">
        <Campo
          label="Nome completo"
          type="text"
          value={form.nome}
          onChange={atualizar('nome')}
          placeholder="João Silva"
          required
          autoComplete="name"
        />
        <Campo
          label="Email"
          type="email"
          value={form.email}
          onChange={atualizar('email')}
          placeholder="joao@email.com"
          required
          autoComplete="email"
        />
        <Campo
          label="Telefone (opcional)"
          type="tel"
          value={form.telefone}
          onChange={atualizar('telefone')}
          placeholder="+244 9XX XXX XXX"
          autoComplete="tel"
        />
        <Campo
          label="Password"
          type="password"
          value={form.password}
          onChange={atualizar('password')}
          placeholder="Mínimo 8 caracteres"
          required
          autoComplete="new-password"
        />
        <Campo
          label="Confirmar password"
          type="password"
          value={form.confirmar}
          onChange={atualizar('confirmar')}
          placeholder="Repetir password"
          required
          autoComplete="new-password"
        />

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <Botao type="submit" carregando={carregando}>
          Criar conta
        </Botao>
      </form>
    </div>
  )
}
