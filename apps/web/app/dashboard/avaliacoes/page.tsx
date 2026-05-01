'use client'
import { useEffect, useState } from 'react'
import { api, ErroAPI } from '@/lib/api'

type Avaliacao = {
  id: string
  nota: number
  comentario?: string
  resposta?: string
  publicada?: boolean
  criada_em: string
  comprador_nome: string
}

type Stats = {
  media: number
  total: number
}

function Estrelas({ nota, tamanho = 'sm' }: { nota: number; tamanho?: 'sm' | 'lg' }) {
  const cls = tamanho === 'lg' ? 'text-2xl' : 'text-base'
  return (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= nota ? 'text-[#f59e0b]' : 'text-gray-300'}>★</span>
      ))}
    </span>
  )
}

export default function PaginaAvaliacoesFornecedor() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [stats, setStats] = useState<Stats>({ media: 0, total: 0 })
  const [carregando, setCarregando] = useState(true)
  const [respostando, setRespostando] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<string | null>(null)

  useEffect(() => {
    api.avaliacoes.minhas()
      .then((resultado: unknown) => {
        const r = resultado as { avaliacoes: Avaliacao[]; media: number; total: number }
        setAvaliacoes(r.avaliacoes)
        setStats({ media: r.media, total: r.total })
      })
      .finally(() => setCarregando(false))
  }, [])

  async function enviarResposta(id: string) {
    const resposta = textoResposta[id]?.trim()
    if (!resposta) return
    setEnviando(id)
    try {
      const atualizada = await api.avaliacoes.responder(id, resposta) as Avaliacao
      setAvaliacoes(prev => prev.map(a => a.id === id ? { ...a, resposta: atualizada.resposta } : a))
      setRespostando(null)
      setTextoResposta(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao enviar resposta')
    } finally {
      setEnviando(null)
    }
  }

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-bold text-[#111111]">Avaliações recebidas</h1>

      {/* Resumo */}
      {stats.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-[#111111]">{Number(stats.media).toFixed(1)}</p>
            <Estrelas nota={Math.round(stats.media)} tamanho="lg" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Baseado em <strong>{stats.total}</strong> avaliações</p>
          </div>
        </div>
      )}

      {avaliacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-gray-500 font-medium">Ainda não tens avaliações</p>
          <p className="text-sm text-gray-400 mt-1">As avaliações dos clientes aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map(av => (
            <div key={av.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-[#111111] text-sm">{av.comprador_nome}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(av.criada_em).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <Estrelas nota={av.nota} />
              </div>

              {av.comentario && (
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{av.comentario}</p>
              )}

              {/* Resposta já existente */}
              {av.resposta && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-2 border-[#dc2626]">
                  <p className="text-xs font-medium text-[#dc2626] mb-1">A tua resposta:</p>
                  <p className="text-sm text-gray-700">{av.resposta}</p>
                </div>
              )}

              {/* Botão para responder (se ainda não respondeu) */}
              {!av.resposta && (
                <div className="mt-3">
                  {respostando === av.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={textoResposta[av.id] ?? ''}
                        onChange={e => setTextoResposta(prev => ({ ...prev, [av.id]: e.target.value }))}
                        rows={3}
                        placeholder="Escreve a tua resposta ao cliente..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => enviarResposta(av.id)}
                          disabled={enviando === av.id || !textoResposta[av.id]?.trim()}
                          className="px-4 py-1.5 bg-[#dc2626] text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {enviando === av.id ? 'A enviar…' : 'Publicar resposta'}
                        </button>
                        <button
                          onClick={() => setRespostando(null)}
                          className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespostando(av.id)}
                      className="text-xs text-[#dc2626] hover:underline"
                    >
                      Responder a esta avaliação
                    </button>
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
