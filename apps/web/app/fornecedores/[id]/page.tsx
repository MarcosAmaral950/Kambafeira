'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CardPeca } from '@/components/catalogo/CardPeca'
import { api, ErroAPI } from '@/lib/api'

type Fornecedor = {
  id: string
  nome_empresa: string | null
  tipo: string
  descricao: string | null
  provincia: string | null
  municipio: string | null
  bairro: string | null
  avaliacao_media: number | null
  total_avaliacoes: number
  total_vendas: number
  verificado: boolean
  responsavel_nome: string
}

type Peca = {
  id: string; titulo: string; preco: number; condicao: string
  foto_principal: string | null; marca_veiculo: string | null
  modelo_veiculo: string | null; categoria: string
  fornecedor_nome: string; provincia: string; avaliacao_media: number
}

type Avaliacao = {
  id: string
  nota: number
  comentario?: string
  resposta?: string
  criada_em: string
  comprador_nome: string
}

const ETIQUETA_TIPO: Record<string, string> = {
  desmanche:    'Desmanche',
  stand:        'Stand',
  particular:   'Particular',
  independente: 'Independente',
  empresa:      'Empresa',
}

export default function PaginaFornecedor({ params }: { params: { id: string } }) {
  const router = useRouter()

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [pecas, setPecas] = useState<Peca[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Carregar perfil do fornecedor
    api.fornecedores.obter(params.id)
      .then(dados => {
        setFornecedor(dados as Fornecedor)
        setCarregando(false)

        // Carregar peças e avaliações em paralelo (sem bloquear)
        api.pecas.doFornecedor(params.id)
          .then((r: unknown) => {
            const res = r as { pecas: Peca[] }
            setPecas(res.pecas ?? [])
          })
          .catch(() => {})

        api.avaliacoes.doFornecedor(params.id)
          .then((r: unknown) => {
            const res = r as { avaliacoes: Avaliacao[] }
            setAvaliacoes(res.avaliacoes ?? [])
          })
          .catch(() => {})
      })
      .catch(err => {
        if (err instanceof ErroAPI && err.status === 404) router.push('/')
        setCarregando(false)
      })
  }, [params.id, router])

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!fornecedor) return null

  const nomeExibido = fornecedor.nome_empresa || fornecedor.responsavel_nome
  const localizacao = [fornecedor.provincia, fornecedor.municipio].filter(Boolean).join(', ')
  const tipo = ETIQUETA_TIPO[fornecedor.tipo] ?? fornecedor.tipo

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-[#dc2626]">Peças</Link>
          <span>/</span>
          <span className="text-gray-600">{nomeExibido}</span>
        </nav>

        {/* Card de perfil do fornecedor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#dc2626] flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {nomeExibido.charAt(0).toUpperCase()}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#111111]">{nomeExibido}</h1>
                {fornecedor.verificado && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Verificado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-gray-500">{tipo}</span>
                {localizacao && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-500">{localizacao}</span>
                  </>
                )}
              </div>

              {/* Estatísticas */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {(fornecedor.avaliacao_media && fornecedor.total_avaliacoes > 0) ? (
                  <a href="#avaliacoes" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <span className="text-[#f59e0b] text-lg">★</span>
                    <span className="font-semibold text-sm">{Number(fornecedor.avaliacao_media).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({fornecedor.total_avaliacoes} avaliações)</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Sem avaliações ainda</span>
                )}
                {fornecedor.total_vendas > 0 && (
                  <span className="text-xs text-gray-400">{fornecedor.total_vendas} vendas</span>
                )}
              </div>
            </div>
          </div>

          {/* Descrição */}
          {fornecedor.descricao && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {fornecedor.descricao}
            </p>
          )}
        </div>

        {/* Secção de peças */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#111111]">
              Peças disponíveis
              {pecas.length > 0 && (
                <span className="ml-2 text-sm text-gray-400 font-normal">({pecas.length})</span>
              )}
            </h2>
          </div>

          {pecas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Este fornecedor não tem peças disponíveis de momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {pecas.map(peca => (
                <CardPeca key={peca.id} peca={peca} />
              ))}
            </div>
          )}
        </div>

        {/* Secção de avaliações */}
        {avaliacoes.length > 0 && (
          <div id="avaliacoes" className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-bold text-[#111111]">Avaliações</h2>
              {fornecedor.avaliacao_media && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#f59e0b] text-lg">★</span>
                  <span className="font-semibold">{Number(fornecedor.avaliacao_media).toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({fornecedor.total_avaliacoes})</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {avaliacoes.map(av => (
                <div key={av.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{av.comprador_nome}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(av.criada_em).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className="text-sm shrink-0">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={i <= av.nota ? 'text-[#f59e0b]' : 'text-gray-300'}>★</span>
                      ))}
                    </span>
                  </div>
                  {av.comentario && (
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{av.comentario}</p>
                  )}
                  {av.resposta && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border-l-2 border-[#dc2626]">
                      <p className="text-xs font-medium text-[#dc2626] mb-0.5">Resposta do fornecedor:</p>
                      <p className="text-xs text-gray-600">{av.resposta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
