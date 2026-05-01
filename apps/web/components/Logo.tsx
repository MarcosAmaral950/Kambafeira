export function Logo({ tamanho = 'md' }: { tamanho?: 'sm' | 'md' | 'lg' }) {
  const texto = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[tamanho]

  const padding = {
    sm: 'px-4 py-1.5',
    md: 'px-6 py-2',
    lg: 'px-8 py-3',
  }[tamanho]

  return (
    <div className="inline-block">
      <div className={`bg-[#dc2626] ${padding}`}>
        <span className={`text-white font-bold ${texto} tracking-widest`}>KAMBA</span>
      </div>
      <div className="bg-[#f59e0b] h-0.5" />
      <div className={`bg-[#111111] ${padding}`}>
        <span className={`text-white font-bold ${texto} tracking-widest`}>FEIRA</span>
      </div>
    </div>
  )
}
