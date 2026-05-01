'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { CardPeca } from '@/components/catalogo/CardPeca'
import { api } from '@/lib/api'

const CATEGORIAS_FIXAS = [
  { slug: '', label: 'Todas' },
  { slug: 'motor-transmissao', label: 'Motor' },
  { slug: 'suspensao-direccao', label: 'Suspensão' },
  { slug: 'travagem', label: 'Travagem' },
  { slug: 'carrocaria-vidros', label: 'Carroçaria' },
  { slug: 'electricidade-electronica', label: 'Electricidade' },
  { slug: 'ar-condicionado', label: 'Ar Cond.' },
  { slug: 'escape-combustivel', label: 'Escape' },
  { slug: 'acessorios-interior', label: 'Acessórios' },
]

type Peca = {
  id: string; titulo: string; preco: number; condicao: string
  foto_principal: string | null; marca_veiculo: string | null
  modelo_veiculo: string | null; categoria: string
  fornecedor_nome: string; provincia: string; avaliacao_media: number
}

type Resultado = { pecas: Peca[]; total: number; paginas: number; pagina: number }

export default function PaginaInicio() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [categoriaAtiva, setCategoriaAtiva] = useState(searchParams.get('categoria') ?? '')

  const buscar = useCallback(async (params: Record<string, string>) => {
    setCarregando(true)
    try {
      const dados = await api.pecas.listar(params) as Resultado
      setResultado(dados)
    } catch {
      setResultado({ pecas: [], total: 0, paginas: 0, pagina: 1 })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (categoriaAtiva) params.categoria = categoriaAtiva
    const q = searchParams.get('q')
    if (q) params.q = q
    buscar(params)
  }, [categoriaAtiva, searchParams, buscar])

  function selecionarCategoria(slug: string) {
    setCategoriaAtiva(slug)
    const url = slug ? `/?categoria=${slug}` : '/'
    router.push(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Filtro de categorias */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIAS_FIXAS.map(cat => (
              <button
                key={cat.slug}
                onClick={() => selecionarCategoria(cat.slug)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoriaAtiva === cat.slug
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Cabeçalho de resultados */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {carregando ? 'A carregar…' : `${resultado?.total ?? 0} peças encontradas`}
          </p>
        </div>

        {/* Grid de peças */}
        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : resultado?.pecas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔧</p>
            <p className="text-gray-500 font-medium">Nenhuma peça encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Tenta outra categoria ou pesquisa</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {resultado?.pecas.map(peca => (
              <CardPeca key={peca.id} peca={peca} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
