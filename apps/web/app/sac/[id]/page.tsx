'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface Mensagem {
  id: string
  usuario_id: string
  autor_nome: string
  autor_perfil: string
  mensagem: string
  fotos: string[]
  criado_em: string
}

interface Ticket {
  id: string
  assunto: string
  tipo: string
  prioridade: string
  status: string
  criado_em: string
  resolvido_em: string | null
  mensagens: Mensagem[]
}

const LABEL_STATUS: Record<string, string> = {
  aberto: 'Aberto', em_atendimento: 'Em atendimento', aguarda_usuario: 'Aguarda utilizador',
  resolvido: 'Resolvido', fechado: 'Fechado',
}
const LABEL_TIPO: Record<string, string> = {
  geral: 'Geral', venda: 'Venda', entrega: 'Entrega', pagamento: 'Pagamento',
  fornecedor: 'Fornecedor', tecnico: 'Técnico', outro: 'Outro',
}

function corPrioridade(p: string) {
  switch (p) {
    case 'urgente': return 'bg-red-100 text-red-700'
    case 'alta': return 'bg-orange-100 text-orange-700'
    case 'normal': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function corStatus(s: string) {
  switch (s) {
    case 'aberto': return 'bg-green-100 text-green-700'
    case 'em_atendimento': return 'bg-blue-100 text-blue-700'
    case 'aguarda_usuario': return 'bg-yellow-100 text-yellow-700'
    case 'resolvido': return 'bg-gray-100 text-gray-600'
    case 'fechado': return 'bg-gray-800 text-white'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function PaginaTicketDetalhe() {
  const { usuario, carregando: carregandoAuth } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [submetendo, setSubmetendo] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!carregandoAuth && !usuario) router.replace('/login')
  }, [usuario, carregandoAuth, router])

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await api.sac.obterTicket(id) as Ticket
      setTicket(dados)
    } catch {
      router.replace('/sac')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (usuario && id) carregar()
  }, [usuario, id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault()
    if (!mensagem.trim()) return
    setErro('')
    setSubmetendo(true)
    try {
      await api.sac.responder(id, { mensagem, fotos })
      setMensagem('')
      setFotos([])
      await carregar()
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao enviar mensagem')
    } finally {
      setSubmetendo(false)
    }
  }

  async function adicionarFoto(ficheiro: File) {
    setSubindoFoto(true)
    try {
      const { url } = await api.upload.imagem(ficheiro)
      setFotos(f => [...f, url])
    } catch {
      setErro('Erro ao fazer upload da foto')
    } finally {
      setSubindoFoto(false)
    }
  }

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (carregandoAuth || !usuario) return null

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) return null

  const fechado = ticket.status === 'fechado'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3 mb-6">
          <Link href="/sac" className="mt-1 text-gray-500 hover:text-[#dc2626] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#111111] truncate">{ticket.assunto}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{LABEL_TIPO[ticket.tipo] ?? ticket.tipo}</span>
              <span className="text-gray-300">·</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${corPrioridade(ticket.prioridade)}`}>
                {ticket.prioridade.charAt(0).toUpperCase() + ticket.prioridade.slice(1)}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${corStatus(ticket.status)}`}>
                {LABEL_STATUS[ticket.status] ?? ticket.status}
              </span>
            </div>
            {ticket.resolvido_em && (
              <p className="text-xs text-gray-400 mt-1">Resolvido em {formatarData(ticket.resolvido_em)}</p>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="space-y-4 mb-6">
          {ticket.mensagens.map(m => {
            const eAdmin = m.autor_perfil === 'admin'
            return (
              <div key={m.id} className={`flex gap-3 ${eAdmin ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${eAdmin ? 'bg-[#111111]' : 'bg-[#dc2626]'}`}>
                  {m.autor_nome.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-xs sm:max-w-md rounded-2xl px-4 py-3 ${eAdmin ? 'bg-[#111111] text-white rounded-tr-sm' : 'bg-white border border-gray-200 rounded-tl-sm'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${eAdmin ? 'text-gray-300' : 'text-gray-700'}`}>{m.autor_nome}</span>
                    {eAdmin && <span className="text-xs bg-[#dc2626] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">Admin</span>}
                    <span className={`text-xs ${eAdmin ? 'text-gray-500' : 'text-gray-400'}`}>{formatarData(m.criado_em)}</span>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap ${eAdmin ? 'text-gray-100' : 'text-gray-700'}`}>{m.mensagem}</p>
                  {m.fotos.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {m.fotos.map((foto, idx) => (
                        <a key={idx} href={foto} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto} alt="Foto" className="w-20 h-20 object-cover rounded-lg" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Formulário resposta */}
        {fechado ? (
          <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-500">
            Este ticket está fechado. <Link href="/sac" className="text-[#dc2626] hover:underline">Abrir novo ticket</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}
            <form onSubmit={enviarResposta} className="space-y-3">
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Escrever mensagem…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] resize-none"
              />

              {/* Upload fotos */}
              {fotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {fotos.map((foto, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto} alt="Foto" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => setFotos(f => f.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                {fotos.length < 3 && (
                  <label className={`text-sm text-gray-500 cursor-pointer hover:text-[#dc2626] transition-colors flex items-center gap-1 ${subindoFoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {subindoFoto ? 'A enviar…' : 'Foto'}
                    <input type="file" accept="image/*" className="hidden" disabled={subindoFoto}
                      onChange={e => e.target.files?.[0] && adicionarFoto(e.target.files[0])} />
                  </label>
                )}
                <button type="submit" disabled={submetendo || !mensagem.trim()}
                  className="ml-auto bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {submetendo ? 'A enviar…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
