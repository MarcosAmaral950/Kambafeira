import Image from 'next/image'

const DIMENSOES = {
  sm: { width: 112, height: 44  },
  md: { width: 220, height: 110 },
  lg: { width: 300, height: 150 },
}

export function Logo({ tamanho = 'md' }: { tamanho?: 'sm' | 'md' | 'lg' }) {
  const { width, height } = DIMENSOES[tamanho]
  return (
    <Image
      src="/logo.png"
      alt="KambaFeira"
      width={width}
      height={height}
      priority
      style={{ objectFit: 'contain' }}
    />
  )
}
