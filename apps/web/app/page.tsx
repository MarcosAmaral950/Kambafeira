'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
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

const PROVINCIAS_ANGOLA = [
  'Luanda', 'Benguela', 'Huambo', 'Cabinda', 'Huíla', 'Malanje',
  'Namibe', 'Uíge', 'Bié', 'Moxico', 'Lunda Norte', 'Lunda Sul',
  'Kwanza Norte', 'Kwanza Sul', 'Cunene', 'Zaire', 'Bengo',
  'Cuando Cubango',
]

const CONDICOES = [
  { valor: 'novo',       texto: 'Novo' },
  { valor: 'bom',        texto: 'Bom estado' },
  { valor: 'regular',    texto: 'Regular' },
  { valor: 'para_pecas', texto: 'Para peças' },
]

type Peca = {
  id: string; titulo: string; preco: number; condicao: string
  foto_principal: string | null; marca_veiculo: string | null
  modelo_veiculo: string | null; categoria: string
  fornecedor_nome: string; provincia: string; avaliacao_media: number
}

type Resultado = { pecas: Peca[]; total: number; paginas: number; pagina: number }

type Filtros = {
  condicao: string
  preco_min: string
  preco_max: string
  marca: string
  provincia: string
}

const FILTROS_VAZIOS: Filtros = {
  condicao: '',
  preco_min: '',
  preco_max: '',
  marca: '',
  provincia: '',
}

function contarFiltrosActivos(filtros: Filtros): number {
  return Object.values(filtros).filter(v => v !== '').length
}

function Catalogo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [categoriaAtiva, setCategoriaAtiva] = useState(searchParams.get('categoria') ?? '')

  // Filtros avançados
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [filtrosPendentes, setFiltrosPendentes] = useState<Filtros>(FILTROS_VAZIOS)
  const [painelAberto, setPainelAberto] = useState(false)

  const numFiltrosActivos = contarFiltrosActivos(filtros)

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
    if (filtros.condicao) params.condicao = filtros.condicao
    if (filtros.preco_min) params.preco_min = filtros.preco_min
    if (filtros.preco_max) params.preco_max = filtros.preco_max
    if (filtros.marca) params.marca = filtros.marca
    if (filtros.provincia) params.provincia = filtros.provincia
    buscar(params)
  }, [categoriaAtiva, searchParams, buscar, filtros])

  function selecionarCategoria(slug: string) {
    setCategoriaAtiva(slug)
    router.push(slug ? `/?categoria=${slug}` : '/')
  }

  function aplicarFiltros() {
    setFiltros({ ...filtrosPendentes })
    setPainelAberto(false)
  }

  function limparFiltros() {
    setFiltrosPendentes(FILTROS_VAZIOS)
    setFiltros(FILTROS_VAZIOS)
    setPainelAberto(false)
  }

  function abrirPainel() {
    setFiltrosPendentes({ ...filtros })
    setPainelAberto(v => !v)
  }

  return (
    <>
      {/* Filtro de categorias */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
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
        {/* Barra de resultado + botão filtros */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-sm text-gray-500">
            {carregando ? 'A carregar…' : `${resultado?.total ?? 0} peças encontradas`}
          </p>
          <button
            onClick={abrirPainel}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              numFiltrosActivos > 0
                ? 'bg-[#dc2626] text-white border-[#dc2626] hover:bg-red-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#dc2626] hover:text-[#dc2626]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {numFiltrosActivos > 0 ? `Filtros (${numFiltrosActivos})` : 'Filtros'}
          </button>
        </div>

        {/* Painel de filtros avançados */}
        {painelAberto && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Condição */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Condição</p>
                <div className="flex flex-wrap gap-2">
                  {CONDICOES.map(c => (
                    <label key={c.valor} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="condicao"
                        value={c.valor}
                        checked={filtrosPendentes.condicao === c.valor}
                        onChange={e => setFiltrosPendentes(prev => ({ ...prev, condicao: e.target.value }))}
                        className="accent-[#dc2626]"
                      />
                      <span className="text-sm text-gray-700">{c.texto}</span>
                    </label>
                  ))}
                  {filtrosPendentes.condicao && (
                    <button
                      onClick={() => setFiltrosPendentes(prev => ({ ...prev, condicao: '' }))}
                      className="text-xs text-gray-400 hover:text-red-500 underline"
                    >
                      limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Marca do veículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca do veículo</label>
                <input
                  type="text"
                  value={filtrosPendentes.marca}
                  onChange={e => setFiltrosPendentes(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="ex: Toyota, BMW…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
                />
              </div>

              {/* Preço */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preço (Kz)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={filtrosPendentes.preco_min}
                    onChange={e => setFiltrosPendentes(prev => ({ ...prev, preco_min: e.target.value }))}
                    placeholder="De"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    min="0"
                    value={filtrosPendentes.preco_max}
                    onChange={e => setFiltrosPendentes(prev => ({ ...prev, preco_max: e.target.value }))}
                    placeholder="Até"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626]"
                  />
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Província</label>
                <select
                  value={filtrosPendentes.provincia}
                  onChange={e => setFiltrosPendentes(prev => ({ ...prev, provincia: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] bg-white"
                >
                  <option value="">Todas as províncias</option>
                  {PROVINCIAS_ANGOLA.map(p => (
                    <option key={p} value={p.toLowerCase()}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botões do painel */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={limparFiltros}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Limpar
              </button>
              <button
                onClick={aplicarFiltros}
                className="flex-1 bg-[#dc2626] text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

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
            {numFiltrosActivos > 0 && (
              <button
                onClick={limparFiltros}
                className="mt-4 text-sm text-[#dc2626] hover:underline"
              >
                Limpar filtros activos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {resultado?.pecas.map(peca => (
              <CardPeca key={peca.id} peca={peca} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default function PaginaInicio() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-gray-400">A carregar…</div>}>
        <Catalogo />
      </Suspense>
    </div>
  )
}
