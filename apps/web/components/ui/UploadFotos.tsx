'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { api, ErroAPI } from '@/lib/api'

// Número máximo de fotos permitidas
const MAX_FOTOS = 5

type Props = {
  fotos: string[]
  onChange: (fotos: string[]) => void
}

type EstadoUpload = {
  // índice -1 = botão de adicionar, >= 0 = posição no array de fotos
  posicao: number
  erro: string | null
}

export function UploadFotos({ fotos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [aFazerUpload, setAFazerUpload] = useState(false)
  const [erroUpload, setErroUpload] = useState<string | null>(null)

  function abrirSeletor() {
    setErroUpload(null)
    inputRef.current?.click()
  }

  async function aoSelecionarFicheiro(e: React.ChangeEvent<HTMLInputElement>) {
    const ficheiro = e.target.files?.[0]
    if (!ficheiro) return

    // Limpar o input para permitir selecionar o mesmo ficheiro novamente
    e.target.value = ''

    if (fotos.length >= MAX_FOTOS) {
      setErroUpload(`Máximo de ${MAX_FOTOS} fotos atingido`)
      return
    }

    setAFazerUpload(true)
    setErroUpload(null)

    try {
      const resultado = await api.upload.imagem(ficheiro)
      onChange([...fotos, resultado.url])
    } catch (err) {
      const mensagem = err instanceof ErroAPI ? err.message : 'Erro ao fazer upload da foto'
      setErroUpload(mensagem)
    } finally {
      setAFazerUpload(false)
    }
  }

  function removerFoto(indice: number) {
    const novasfotos = fotos.filter((_, i) => i !== indice)
    onChange(novasfotos)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fotos da peça
        <span className="text-gray-400 font-normal ml-1">({fotos.length}/{MAX_FOTOS})</span>
      </label>

      <div className="flex flex-wrap gap-3">
        {/* Thumbnails das fotos existentes */}
        {fotos.map((url, indice) => (
          <div
            key={url}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group"
          >
            <Image
              src={url}
              alt={`Foto ${indice + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
            {/* Badge da foto principal */}
            {indice === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                Principal
              </span>
            )}
            {/* Botão de remover */}
            <button
              type="button"
              onClick={() => removerFoto(indice)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Remover foto"
            >
              ×
            </button>
          </div>
        ))}

        {/* Botão de adicionar foto */}
        {fotos.length < MAX_FOTOS && (
          <button
            type="button"
            onClick={abrirSeletor}
            disabled={aFazerUpload}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Adicionar foto"
          >
            {aFazerUpload ? (
              // Spinner de carregamento
              <svg
                className="w-6 h-6 animate-spin text-[#dc2626]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] leading-tight text-center">Adicionar foto</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Input de ficheiro oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={aoSelecionarFicheiro}
      />

      {/* Mensagem de erro inline */}
      {erroUpload && (
        <p className="mt-2 text-sm text-red-600">{erroUpload}</p>
      )}

      {/* Nota informativa */}
      {fotos.length === 0 && !erroUpload && (
        <p className="mt-2 text-xs text-gray-400">
          A primeira foto será a foto principal. Máximo {MAX_FOTOS} fotos.
        </p>
      )}
    </div>
  )
}
