'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Campo } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { api, ErroAPI } from '@/lib/api'

const TIPOS = [
  { valor: 'independente', label: 'Independente' },
  { valor: 'desmanche', label: 'Desmanche' },
  { valor: 'stand', label: 'Stand' },
  { valor: 'empresa', label: 'Empresa' },
]

export default function PaginaRegistoFornecedor() {
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', password: '', confirmar: '',
    chave_convite: '', nome_empresa: '', tipo: 'independente',
    provincia: 'Luanda', municipio: '', bairro: '', whatsapp: '',
  })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function atualizar(campo: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
      await api.auth.registoFornecedor({
        nome: form.nome,
        email: form.email,
        password: form.password,
        telefone: form.telefone || undefined,
        chave_convite: form.chave_convite,
        nome_empresa: form.nome_empresa || undefined,
        tipo: form.tipo,
        provincia: form.provincia,
        municipio: form.municipio || undefined,
        bairro: form.bairro || undefined,
        whatsapp: form.whatsapp || undefined,
      })
      router.push('/dashboard/fornecedor')
      router.refresh()
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao criar conta de fornecedor')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h1 className="text-xl font-bold text-[#111111] mb-1">Registo de fornecedor</h1>
      <p className="text-sm text-gray-500 mb-6">
        Precisas de uma chave de convite para registar como fornecedor.{' '}
        <Link href="/login" className="text-[#dc2626] font-medium hover:underline">
          Já tens conta? Entrar
        </Link>
      </p>

      <form onSubmit={submeter} className="flex flex-col gap-4">
        {/* Chave de convite em destaque */}
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/40 rounded-lg p-4">
          <Campo
            label="Chave de convite"
            type="text"
            value={form.chave_convite}
            onChange={atualizar('chave_convite')}
            placeholder="Cole aqui a chave recebida do administrador"
            required
          />
        </div>

        <hr className="border-gray-100" />

        {/* Dados pessoais */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados pessoais</p>
        <Campo label="Nome completo" type="text" value={form.nome} onChange={atualizar('nome')} placeholder="Nome do responsável" required autoComplete="name" />
        <Campo label="Email" type="email" value={form.email} onChange={atualizar('email')} placeholder="email@empresa.ao" required autoComplete="email" />
        <Campo label="Telefone" type="tel" value={form.telefone} onChange={atualizar('telefone')} placeholder="+244 9XX XXX XXX" autoComplete="tel" />
        <Campo label="WhatsApp" type="tel" value={form.whatsapp} onChange={atualizar('whatsapp')} placeholder="+244 9XX XXX XXX (para contacto de clientes)" />
        <Campo label="Password" type="password" value={form.password} onChange={atualizar('password')} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
        <Campo label="Confirmar password" type="password" value={form.confirmar} onChange={atualizar('confirmar')} placeholder="Repetir password" required autoComplete="new-password" />

        <hr className="border-gray-100" />

        {/* Dados do negócio */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados do negócio</p>
        <Campo label="Nome da empresa (opcional)" type="text" value={form.nome_empresa} onChange={atualizar('nome_empresa')} placeholder="Ex: Peças Luanda Lda." />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipo de fornecedor</label>
          <select
            value={form.tipo}
            onChange={atualizar('tipo')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          >
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>

        <Campo label="Província" type="text" value={form.provincia} onChange={atualizar('provincia')} placeholder="Luanda" />
        <Campo label="Município" type="text" value={form.municipio} onChange={atualizar('municipio')} placeholder="Talatona" />
        <Campo label="Bairro" type="text" value={form.bairro} onChange={atualizar('bairro')} placeholder="Ex: Benfica" />

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <Botao type="submit" variante="secundario" carregando={carregando}>
          Criar conta de fornecedor
        </Botao>
      </form>
    </div>
  )
}
