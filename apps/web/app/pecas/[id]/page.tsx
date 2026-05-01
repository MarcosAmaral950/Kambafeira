'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { api, ErroAPI } from '@/lib/api'

type Peca = {
  id: string; titulo: string; descricao: string; preco: number
  condicao: string; fotos: string[]; foto_principal: string | null
  marca_veiculo: string | null; modelo_veiculo: string | null
  ano_veiculo_de: number | null; ano_veiculo_ate: number | null
  numero_parte: string | null; estoque: number; visualizacoes: number
  categoria: string; categoria_slug: string
  fornecedor_nome: string; provincia: string; municipio: string | null
  avaliacao_media: number; total_avaliacoes: number
  fornecedor_whatsapp: string | null
}

const ETIQUETA_CONDICAO: Record<string, { texto: string; cor: string }> = {
  novo:       { texto: 'Novo',        cor: 'bg-green-100 text-green-700' },
  bom:        { texto: 'Bom estado',  cor: 'bg-blue-100 text-blue-700' },
  regular:    { texto: 'Regular',     cor: 'bg-yellow-100 text-yellow-700' },
  para_pecas: { texto: 'Para peças',  cor: 'bg-gray-100 text-gray-600' },
}

export default function PaginaDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [peca, setPeca] = useState<Peca | null>(null)
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.pecas.obter(params.id)
      .then(dados => { setPeca(dados as Peca); setCarregando(false) })
      .catch(err => {
        if (err instanceof ErroAPI && err.status === 404) router.push('/')
        setCarregando(false)
      })
  }, [params.id, router])

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-4" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!peca) return null

  const fotos = peca.fotos.length > 0 ? peca.fotos : (peca.foto_principal ? [peca.foto_principal] : [])
  const condicao = ETIQUETA_CONDICAO[peca.condicao] ?? ETIQUETA_CONDICAO.regular
  const preco = Number(peca.preco).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

  const mensagemWhatsapp = encodeURIComponent(
    `Olá! Vi a peça "${peca.titulo}" no KambaFeira e tenho interesse. Ainda disponível?`
  )
  const linkWhatsapp = peca.fornecedor_whatsapp
    ? `https://wa.me/${peca.fornecedor_whatsapp.replace(/\D/g, '')}?text=${mensagemWhatsapp}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-[#dc2626]">Peças</Link>
          <span>/</span>
          <Link href={`/?categoria=${peca.categoria_slug}`} className="hover:text-[#dc2626]">{peca.categoria}</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[180px]">{peca.titulo}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galeria */}
          <div>
            <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-2">
              {fotos.length > 0 ? (
                <Image
                  src={fotos[fotoAtiva]}
                  alt={peca.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {fotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {fotos.map((foto, i) => (
                  <button
                    key={i}
                    onClick={() => setFotoAtiva(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === fotoAtiva ? 'border-[#dc2626]' : 'border-gray-200'
                    }`}
                  >
                    <Image src={foto} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">{peca.categoria}</p>
              <h1 className="text-xl font-bold text-[#111111] leading-tight mb-2">{peca.titulo}</h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${condicao.cor}`}>
                  {condicao.texto}
                </span>
                {peca.estoque > 1 && (
                  <span className="text-xs text-gray-400">{peca.estoque} em stock</span>
                )}
              </div>
            </div>

            <p className="text-3xl font-bold text-[#dc2626]">{preco}</p>

            {/* Compatibilidade */}
            {(peca.marca_veiculo || peca.numero_parte) && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">Compatibilidade</p>
                {peca.marca_veiculo && <p className="text-gray-600"><span className="text-gray-400">Marca:</span> {peca.marca_veiculo}</p>}
                {peca.modelo_veiculo && <p className="text-gray-600"><span className="text-gray-400">Modelo:</span> {peca.modelo_veiculo}</p>}
                {(peca.ano_veiculo_de || peca.ano_veiculo_ate) && (
                  <p className="text-gray-600">
                    <span className="text-gray-400">Anos:</span>{' '}
                    {[peca.ano_veiculo_de, peca.ano_veiculo_ate].filter(Boolean).join(' – ')}
                  </p>
                )}
                {peca.numero_parte && <p className="text-gray-600"><span className="text-gray-400">Nº peça:</span> {peca.numero_parte}</p>}
              </div>
            )}

            {/* Fornecedor */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Fornecedor</p>
              <p className="font-semibold text-[#111111]">{peca.fornecedor_nome}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {[peca.provincia, peca.municipio].filter(Boolean).join(', ')}
              </p>
              {peca.total_avaliacoes > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#f59e0b]">★</span>
                  <span className="text-sm font-medium">{Number(peca.avaliacao_media).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({peca.total_avaliacoes} avaliações)</span>
                </div>
              )}
            </div>

            {/* Botão WhatsApp */}
            {linkWhatsapp ? (
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-green-600 transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.113 1.527 5.842L0 24l6.302-1.516A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.376l-.36-.214-3.732.897.934-3.629-.235-.373A9.818 9.818 0 0112 2.182c5.427 0 9.818 4.391 9.818 9.818 0 5.428-4.391 9.818-9.818 9.818z"/>
                </svg>
                Contactar via WhatsApp
              </a>
            ) : (
              <button className="flex items-center justify-center gap-2 bg-[#111111] text-white font-semibold py-3.5 px-6 rounded-xl text-sm opacity-70 cursor-not-allowed">
                Contacto não disponível
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">{peca.visualizacoes} pessoas viram esta peça</p>
          </div>
        </div>

        {/* Descrição */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-[#111111] mb-3">Descrição</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{peca.descricao}</p>
        </div>
      </main>
    </div>
  )
}
