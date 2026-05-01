'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ErroAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface Ticket {
  id: string
  assunto: string
  tipo: string
  prioridade: string
  status: string
  total_mensagens: number | string
  criado_em: string
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

const FORM_VAZIO = { assunto: '', descricao: '', tipo: 'geral', prioridade: 'normal', fotos: [] as string[] }

export default function PaginaSAC() {
  const { usuario, carregando: carregandoAuth } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [submetendo, setSubmetendo] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [subindoFoto, setSubindoFoto] = useState(false)

  useEffect(() => {
    if (!carregandoAuth && !usuario) router.replace('/login')
  }, [usuario, carregandoAuth, router])

  async function carregar() {
    try {
      const dados = await api.sac.meusTickets() as Ticket[]
      setTickets(dados)
    } catch {
      // falha silenciosa
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (usuario) carregar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submeterTicket(e: React.FormEvent) {
    e.preventDefault()
    setErroForm('')
    setSubmetendo(true)
    try {
      await api.sac.abrirTicket(form)
      setForm(FORM_VAZIO)
      setMostrarForm(false)
      await carregar()
    } catch (err) {
      setErroForm(err instanceof ErroAPI ? err.message : 'Erro ao abrir ticket')
    } finally {
      setSubmetendo(false)
    }
  }

  async function adicionarFoto(ficheiro: File) {
    setSubindoFoto(true)
    try {
      const { url } = await api.upload.imagem(ficheiro)
      setForm(f => ({ ...f, fotos: [...f.fotos, url] }))
    } catch {
      setErroForm('Erro ao fazer upload da foto')
    } finally {
      setSubindoFoto(false)
    }
  }

  function removerFoto(idx: number) {
    setForm(f => ({ ...f, fotos: f.fotos.filter((_, i) => i !== idx) }))
  }

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (carregandoAuth || !usuario) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111111]">Suporte ao Cliente</h1>
            <p className="text-sm text-gray-500 mt-1">Os teus pedidos de apoio</p>
          </div>
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Abrir Ticket
          </button>
        </div>

        {/* Formulário novo ticket */}
        {mostrarForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h2 className="font-semibold text-[#111111] mb-4">Novo Pedido de Suporte</h2>
            {erroForm && <p className="text-sm text-red-600 mb-3">{erroForm}</p>}
            <form onSubmit={submeterTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assunto *</label>
                <input required minLength={5} maxLength={255}
                  value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))}
                  placeholder="Descreve brevemente o problema…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
                    {Object.entries(LABEL_TIPO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
                  <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
                <textarea required minLength={10}
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={4} placeholder="Descreve o problema em detalhe…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] resize-none" />
              </div>

              {/* Upload fotos */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fotos (máx. 5)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.fotos.map((foto, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto} alt="Foto" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => removerFoto(idx)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                  {form.fotos.length < 5 && (
                    <label className={`w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#dc2626] transition-colors ${subindoFoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span className="text-gray-400 text-2xl">{subindoFoto ? '…' : '+'}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={subindoFoto}
                        onChange={e => e.target.files?.[0] && adicionarFoto(e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={submetendo}
                  className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {submetendo ? 'A enviar…' : 'Enviar Pedido'}
                </button>
                <button type="button" onClick={() => { setMostrarForm(false); setForm(FORM_VAZIO); setErroForm('') }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista tickets */}
        {carregando ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🎧</p>
            <p className="font-medium">Nenhum ticket aberto</p>
            <p className="text-sm mt-1">Clica em &quot;Abrir Ticket&quot; se precisares de ajuda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <Link key={t.id} href={`/sac/${t.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-[#dc2626] transition-colors">
                <div className="flex flex-wrap items-start gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${corPrioridade(t.prioridade)}`}>
                    {t.prioridade.charAt(0).toUpperCase() + t.prioridade.slice(1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#111111] truncate">{t.assunto}</p>
                    <p className="text-xs text-gray-500">{LABEL_TIPO[t.tipo] ?? t.tipo} · {formatarData(t.criado_em)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {Number(t.total_mensagens) > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.total_mensagens} msgs</span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${corStatus(t.status)}`}>
                      {LABEL_STATUS[t.status] ?? t.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
