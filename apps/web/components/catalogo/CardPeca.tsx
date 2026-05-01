import Link from 'next/link'
import Image from 'next/image'

type Peca = {
  id: string
  titulo: string
  preco: number
  condicao: string
  foto_principal: string | null
  marca_veiculo: string | null
  modelo_veiculo: string | null
  categoria: string
  fornecedor_nome: string
  provincia: string
  avaliacao_media: number
}

const ETIQUETA_CONDICAO: Record<string, { texto: string; cor: string }> = {
  novo:       { texto: 'Novo',        cor: 'bg-green-100 text-green-700' },
  bom:        { texto: 'Bom estado',  cor: 'bg-blue-100 text-blue-700' },
  regular:    { texto: 'Regular',     cor: 'bg-yellow-100 text-yellow-700' },
  para_pecas: { texto: 'Para peças',  cor: 'bg-gray-100 text-gray-600' },
}

export function CardPeca({ peca }: { peca: Peca }) {
  const condicao = ETIQUETA_CONDICAO[peca.condicao] ?? ETIQUETA_CONDICAO.regular
  const preco = Number(peca.preco).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

  return (
    <Link href={`/pecas/${peca.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#dc2626]/30 transition-all">
        {/* Imagem */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {peca.foto_principal ? (
            <Image
              src={peca.foto_principal}
              alt={peca.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${condicao.cor}`}>
            {condicao.texto}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 mb-0.5">{peca.categoria}</p>
          <h3 className="text-sm font-semibold text-[#111111] line-clamp-2 leading-snug mb-2 group-hover:text-[#dc2626] transition-colors">
            {peca.titulo}
          </h3>
          {(peca.marca_veiculo || peca.modelo_veiculo) && (
            <p className="text-xs text-gray-400 mb-2">
              {[peca.marca_veiculo, peca.modelo_veiculo].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="text-base font-bold text-[#dc2626]">{preco}</p>
          <p className="text-xs text-gray-400 mt-1">{peca.provincia}</p>
        </div>
      </div>
    </Link>
  )
}
