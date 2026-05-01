'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

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
  usuario_id: string
  usuario_nome: string
  assunto: string
  descricao: string
  tipo: string
  prioridade: string
  status: string
  total_mensagens: number | string
  criado_em: string
  atualizado_em: string
  resolvido_em: string | null
  mensagens?: Mensagem[]
}

const FILTROS_STATUS = [
  { valor: '', label: 'Todos' },
  { valor: 'aberto', label: 'Aberto' },
  { valor: 'em_atendimento', label: 'Em atendimento' },
  { valor: 'aguarda_usuario', label: 'Aguarda utilizador' },
  { valor: 'resolvido', label: 'Resolvido' },
  { valor: 'fechado', label: 'Fechado' },
]

const FILTROS_PRIORIDADE = [
  { valor: '', label: 'Todas' },
  { valor: 'urgente', label: 'Urgente' },
  { valor: 'alta', label: 'Alta' },
  { valor: 'normal', label: 'Normal' },
  { valor: 'baixa', label: 'Baixa' },
]

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
    case 'fechado': return 'bg-gray-900 text-white'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const LABEL_STATUS: Record<string, string> = {
  aberto: 'Aberto', em_atendimento: 'Em atendimento', aguarda_usuario: 'Aguarda utilizador',
  resolvido: 'Resolvido', fechado: 'Fechado',
}
const LABEL_PRIORIDADE: Record<string, string> = {
  urgente: 'Urgente', alta: 'Alta', normal: 'Normal', baixa: 'Baixa',
}
const LABEL_TIPO: Record<string, string> = {
  geral: 'Geral', venda: 'Venda', entrega: 'Entrega', pagamento: 'Pagamento',
  fornecedor: 'Fornecedor', tecnico: 'Técnico', outro: 'Outro',
}

export default function PaginaAdminSAC() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [resposta, setResposta] = useState('')
  const [submetendoResposta, setSubmetendoResposta] = useState(false)
  const [submetendoStatus, setSubmetendoStatus] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const filtros: { status?: string; prioridade?: string } = {}
      if (filtroStatus) filtros.status = filtroStatus
      if (filtroPrioridade) filtros.prioridade = filtroPrioridade
      const dados = await api.sac.admin.listar(filtros) as Ticket[]
      setTickets(dados)
    } catch {
      // falha silenciosa
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [filtroStatus, filtroPrioridade]) // eslint-disable-line react-hooks/exhaustive-deps

  async function expandirTicket(id: string) {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    setCarregandoDetalhe(true)
    try {
      const detalhe = await api.sac.obterTicket(id) as Ticket
      setTickets(prev => prev.map(t => t.id === id ? { ...t, mensagens: detalhe.mensagens } : t))
    } catch {
      // falha silenciosa
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  async function responderTicket(ticketId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!resposta.trim()) return
    setSubmetendoResposta(true)
    try {
      await api.sac.responder(ticketId, { mensagem: resposta, fotos: [] })
      setResposta('')
      const detalhe = await api.sac.obterTicket(ticketId) as Ticket
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, mensagens: detalhe.mensagens, status: detalhe.status } : t))
    } catch {
      // erro tratado
    } finally {
      setSubmetendoResposta(false)
    }
  }

  async function atualizarTicket(ticketId: string, dados: { status?: string; prioridade?: string }) {
    setSubmetendoStatus(true)
    try {
      await api.sac.admin.atualizar(ticketId, dados)
      await carregar()
    } catch {
      // erro tratado
    } finally {
      setSubmetendoStatus(false)
    }
  }

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111111]">Suporte ao Cliente (SAC)</h1>
        <p className="text-sm text-gray-500 mt-1">Gerir tickets de suporte</p>
      </div>

      {/* Filtros status */}
      <div className="flex flex-wrap gap-2 mb-2">
        {FILTROS_STATUS.map(f => (
          <button key={f.valor} onClick={() => setFiltroStatus(f.valor)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtroStatus === f.valor ? 'bg-[#dc2626] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros prioridade */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTROS_PRIORIDADE.map(f => (
          <button key={f.valor} onClick={() => setFiltroPrioridade(f.valor)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtroPrioridade === f.valor ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum ticket encontrado</div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => expandirTicket(t.id)}>
                <div className="flex flex-wrap items-start gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${corPrioridade(t.prioridade)}`}>
                    {LABEL_PRIORIDADE[t.prioridade] ?? t.prioridade}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#111111] truncate">{t.assunto}</p>
                    <p className="text-xs text-gray-500">
                      {t.usuario_nome} · {LABEL_TIPO[t.tipo] ?? t.tipo} · {formatarData(t.criado_em)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {Number(t.total_mensagens) > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.total_mensagens} msgs</span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${corStatus(t.status)}`}>
                      {LABEL_STATUS[t.status] ?? t.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhe expandido */}
              {expandido === t.id && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {/* Acções rápidas */}
                  <div className="p-3 flex flex-wrap gap-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Estado:</span>
                      <select
                        value={t.status}
                        onChange={e => atualizarTicket(t.id, { status: e.target.value })}
                        disabled={submetendoStatus}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                      >
                        {FILTROS_STATUS.filter(s => s.valor).map(s => (
                          <option key={s.valor} value={s.valor}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Prioridade:</span>
                      <select
                        value={t.prioridade}
                        onChange={e => atualizarTicket(t.id, { prioridade: e.target.value })}
                        disabled={submetendoStatus}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
                      >
                        {FILTROS_PRIORIDADE.filter(s => s.valor).map(s => (
                          <option key={s.valor} value={s.valor}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {carregandoDetalhe ? (
                      <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>
                    ) : !t.mensagens ? null : t.mensagens.map(m => (
                      <div key={m.id} className={`flex gap-3 ${m.autor_perfil === 'admin' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${m.autor_perfil === 'admin' ? 'bg-[#111111]' : 'bg-[#dc2626]'}`}>
                          {m.autor_nome.charAt(0).toUpperCase()}
                        </div>
                        <div className={`max-w-xs sm:max-w-md rounded-xl px-3 py-2 ${m.autor_perfil === 'admin' ? 'bg-[#111111] text-white' : 'bg-white border border-gray-200'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${m.autor_perfil === 'admin' ? 'text-gray-300' : 'text-gray-700'}`}>{m.autor_nome}</span>
                            {m.autor_perfil === 'admin' && <span className="text-xs bg-[#dc2626] text-white px-1.5 rounded">Admin</span>}
                            <span className={`text-xs ${m.autor_perfil === 'admin' ? 'text-gray-400' : 'text-gray-400'}`}>{formatarData(m.criado_em)}</span>
                          </div>
                          <p className={`text-sm ${m.autor_perfil === 'admin' ? 'text-gray-100' : 'text-gray-700'}`}>{m.mensagem}</p>
                          {m.fotos.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {m.fotos.map((foto, idx) => (
                                <a key={idx} href={foto} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={foto} alt="Foto" className="w-16 h-16 object-cover rounded-lg" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulário resposta */}
                  {t.status !== 'fechado' && (
                    <form onSubmit={e => responderTicket(t.id, e)} className="p-3 border-t border-gray-200 flex gap-2">
                      <textarea
                        value={resposta}
                        onChange={e => setResposta(e.target.value)}
                        placeholder="Escrever resposta…"
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] resize-none"
                      />
                      <button type="submit" disabled={submetendoResposta || !resposta.trim()}
                        className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 self-end">
                        {submetendoResposta ? '…' : 'Responder'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
