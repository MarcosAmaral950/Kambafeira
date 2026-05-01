'use client'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const ETIQUETA_PERFIL: Record<string, { texto: string; cor: string }> = {
  admin:      { texto: 'Admin',      cor: 'bg-purple-100 text-purple-700' },
  fornecedor: { texto: 'Fornecedor', cor: 'bg-blue-100 text-blue-700' },
  comprador:  { texto: 'Comprador',  cor: 'bg-green-100 text-green-700' },
}

export default function PaginaPerfil() {
  const router = useRouter()
  const { usuario, carregando, recarregar } = useAuth()

  // ── Dados pessoais ──────────────────────────────────────────────
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensagemPerfil, setMensagemPerfil] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // ── Alterar password ────────────────────────────────────────────
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNova, setPasswordNova] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [alterando, setAlterando] = useState(false)
  const [mensagemPassword, setMensagemPassword] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!carregando && !usuario) {
      router.push('/login')
    }
  }, [carregando, usuario, router])

  // Pré-preencher com dados actuais
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome ?? '')
      // O tipo Usuario no contexto não tem telefone, mas a API devolve-o
      // Fazemos cast para aceder ao campo se existir
      const u = usuario as { nome: string; telefone?: string }
      setTelefone(u.telefone ?? '')
    }
  }, [usuario])

  async function submeterPerfil(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setMensagemPerfil({ tipo: 'erro', texto: 'O nome não pode estar vazio' })
      return
    }
    setGuardando(true)
    setMensagemPerfil(null)
    try {
      await api.auth.actualizarPerfil({ nome: nome.trim(), telefone: telefone.trim() || undefined })
      await recarregar()
      setMensagemPerfil({ tipo: 'sucesso', texto: 'Dados actualizados com sucesso' })
    } catch (err) {
      setMensagemPerfil({
        tipo: 'erro',
        texto: err instanceof ErroAPI ? err.message : 'Erro ao guardar alterações',
      })
    } finally {
      setGuardando(false)
    }
  }

  async function submeterPassword(e: FormEvent) {
    e.preventDefault()
    setMensagemPassword(null)

    if (passwordNova.length < 8) {
      setMensagemPassword({ tipo: 'erro', texto: 'A nova password deve ter pelo menos 8 caracteres' })
      return
    }
    if (passwordNova !== passwordConfirmar) {
      setMensagemPassword({ tipo: 'erro', texto: 'As passwords não coincidem' })
      return
    }

    setAlterando(true)
    try {
      await api.auth.alterarPassword({ password_actual: passwordActual, password_nova: passwordNova })
      setMensagemPassword({ tipo: 'sucesso', texto: 'Password alterada com sucesso' })
      setPasswordActual('')
      setPasswordNova('')
      setPasswordConfirmar('')
    } catch (err) {
      setMensagemPassword({
        tipo: 'erro',
        texto: err instanceof ErroAPI ? err.message : 'Erro ao alterar password',
      })
    } finally {
      setAlterando(false)
    }
  }

  if (carregando || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  const badge = ETIQUETA_PERFIL[usuario.perfil] ?? ETIQUETA_PERFIL.comprador

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-[480px] mx-auto px-4 py-8 space-y-6">
        {/* Cabeçalho do perfil */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#dc2626] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111111]">{usuario.nome}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cor}`}>
                {badge.texto}
              </span>
              {usuario.perfil === 'comprador' && (
                <Link href="/pedidos" className="text-xs text-[#dc2626] hover:underline">
                  Ver os meus pedidos →
                </Link>
              )}
              {usuario.perfil === 'fornecedor' && (
                <Link href="/dashboard" className="text-xs text-[#dc2626] hover:underline">
                  Ver a minha loja →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Card — Dados pessoais */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-[#111111] mb-4">Dados pessoais</h2>
          <form onSubmit={submeterPerfil} className="space-y-4">
            {/* Email — só leitura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={usuario.email}
                readOnly
                disabled
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
              />
            </div>

            {/* Mensagem de feedback */}
            {mensagemPerfil && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                mensagemPerfil.tipo === 'sucesso'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {mensagemPerfil.texto}
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-[#dc2626] text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando ? 'A guardar…' : 'Guardar alterações'}
            </button>
          </form>
        </div>

        {/* Card — Alterar password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-[#111111] mb-4">Alterar password</h2>
          <form onSubmit={submeterPassword} className="space-y-4">
            {/* Password actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password actual <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="password"
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
              />
            </div>

            {/* Nova password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova password <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="password"
                value={passwordNova}
                onChange={e => setPasswordNova(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
              />
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
            </div>

            {/* Confirmar nova password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nova password <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="password"
                value={passwordConfirmar}
                onChange={e => setPasswordConfirmar(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                  passwordConfirmar && passwordNova !== passwordConfirmar
                    ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
                    : 'border-gray-200 focus:ring-[#dc2626] focus:border-[#dc2626]'
                }`}
              />
              {passwordConfirmar && passwordNova !== passwordConfirmar && (
                <p className="text-xs text-red-500 mt-1">As passwords não coincidem</p>
              )}
            </div>

            {/* Mensagem de feedback */}
            {mensagemPassword && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                mensagemPassword.tipo === 'sucesso'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {mensagemPassword.texto}
              </div>
            )}

            <button
              type="submit"
              disabled={alterando || (!!passwordConfirmar && passwordNova !== passwordConfirmar)}
              className="w-full bg-[#111111] text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {alterando ? 'A alterar…' : 'Alterar password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
