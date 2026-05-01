'use client'
import { useEffect, useState } from 'react'
import { api, ErroAPI } from '@/lib/api'

type Chave = {
  id: string; chave: string; ativa: boolean; expira_em: string
  criada_em: string; usada_em?: string
  criada_por_nome: string; usada_por_nome?: string
}

export default function PaginaChavesAdmin() {
  const [chaves, setChaves] = useState<Chave[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  useEffect(() => {
    api.admin.chaves()
      .then(d => setChaves(d as Chave[]))
      .finally(() => setCarregando(false))
  }, [])

  async function gerarChave() {
    setGerando(true)
    try {
      const nova = await api.admin.gerarChave() as Chave
      setChaves(prev => [nova, ...prev])
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao gerar chave')
    } finally {
      setGerando(false)
    }
  }

  function copiar(chave: string) {
    navigator.clipboard.writeText(chave)
    setCopiado(chave)
    setTimeout(() => setCopiado(null), 2000)
  }

  const disponiveis = chaves.filter(c => c.ativa && !c.usada_em && new Date(c.expira_em) > new Date())
  const usadas      = chaves.filter(c => c.usada_em)

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">Chaves de Convite</h1>
        <button
          onClick={gerarChave}
          disabled={gerando}
          className="bg-[#dc2626] text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {gerando ? 'A gerar…' : '+ Nova Chave'}
        </button>
      </div>

      {/* Chaves disponíveis */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Disponíveis ({disponiveis.length})
        </h2>

        {disponiveis.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma chave disponível — gera uma nova</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disponiveis.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <code className="flex-1 font-mono text-sm text-[#111111] bg-gray-50 px-3 py-1.5 rounded-lg break-all">
                  {c.chave}
                </code>
                <div className="shrink-0 text-right">
                  <button
                    onClick={() => copiar(c.chave)}
                    className="text-xs text-[#dc2626] hover:underline font-medium"
                  >
                    {copiado === c.chave ? '✓ Copiado' : 'Copiar'}
                  </button>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expira: {new Date(c.expira_em).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chaves usadas */}
      {usadas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Usadas ({usadas.length})
          </h2>
          <div className="space-y-2">
            {usadas.map(c => (
              <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <code className="flex-1 font-mono text-xs text-gray-400 truncate">{c.chave}</code>
                <div className="text-xs text-gray-400 shrink-0">
                  <span className="text-green-600 font-medium">✓ {c.usada_por_nome}</span>
                  <br />
                  {c.usada_em && new Date(c.usada_em).toLocaleDateString('pt-PT')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
