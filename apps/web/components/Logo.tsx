type Tamanho = 'sm' | 'md' | 'lg'

const ESCALAS: Record<Tamanho, number> = { sm: 0.60, md: 0.82, lg: 1.10 }

// [cx, altura, largura] — skyline: centro mais alto, bordas mais baixas
const PILARES: [number, number, number][] = [
  [ 76,  22, 13],
  [ 94,  36, 15],
  [113,  54, 17],
  [133,  70, 19],
  [155,  85, 22],
  [177,  70, 19],
  [197,  54, 17],
  [216,  36, 15],
  [234,  22, 13],
]

function pontosPilar(cx: number, h: number, w: number): string {
  const baseY = 100
  const topoY = baseY - h
  const pontaH = 12      // altura da ponta triangular
  const mL = w / 2
  return [
    `${cx},${topoY}`,
    `${cx + mL},${topoY + pontaH}`,
    `${cx + mL},${baseY}`,
    `${cx - mL},${baseY}`,
    `${cx - mL},${topoY + pontaH}`,
  ].join(' ')
}

// Engrenagem: círculo externo com dentes, círculo interno com mira
function Engrenagem({ cx, cy }: { cx: number; cy: number }) {
  const rExt = 18, rInt = 10, rMira = 5
  const dentes = 10
  const pontos: string[] = []
  for (let i = 0; i < dentes * 2; i++) {
    const angulo = (i * Math.PI) / dentes
    const r = i % 2 === 0 ? rExt : rExt - 5
    pontos.push(`${cx + r * Math.cos(angulo)},${cy + r * Math.sin(angulo)}`)
  }
  return (
    <g opacity="0.80" stroke="#d97706" fill="none">
      <polygon points={pontos.join(' ')} fill="#dc2626" fillOpacity="0.15" stroke="#d97706" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={rInt}  strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={rMira} strokeWidth="1.2" />
      <line x1={cx} y1={cy - rExt - 2} x2={cx} y2={cy + rExt + 2} strokeWidth="0.8" />
      <line x1={cx - rExt - 2} y1={cy} x2={cx + rExt + 2} y2={cy} strokeWidth="0.8" />
    </g>
  )
}

export function Logo({ tamanho = 'md' }: { tamanho?: Tamanho }) {
  const escala  = ESCALAS[tamanho]
  const largura = Math.round(320 * escala)
  const alturaSVG = Math.round(164 * escala)

  return (
    <svg
      width={largura}
      height={alturaSVG}
      viewBox="0 0 320 164"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KambaFeira"
    >
      {/* ── Fundo vermelho ── */}
      <rect width="320" height="100" fill="#dc2626" />

      {/* Linhas diagonais douradas de fundo */}
      <line x1="50"  y1="100" x2="230" y2="5"  stroke="#f59e0b" strokeWidth="1.2" opacity="0.30" />
      <line x1="35"  y1="100" x2="215" y2="5"  stroke="#f59e0b" strokeWidth="1.2" opacity="0.18" />
      <line x1="180" y1="100" x2="310" y2="20" stroke="#f59e0b" strokeWidth="1.2" opacity="0.22" />
      <line x1="195" y1="100" x2="320" y2="28" stroke="#f59e0b" strokeWidth="1.2" opacity="0.14" />

      {/* Pilares / skyline */}
      {PILARES.map(([cx, h, w], i) => (
        <g key={i}>
          {/* Face principal do pilar */}
          <polygon points={pontosPilar(cx, h, w)} fill="#d97706" opacity="0.82" />
          {/* Sombra lateral direita para efeito 3D */}
          <polygon
            points={pontosPilar(cx + 3, h - 4, w)}
            fill="#92400e"
            opacity="0.35"
          />
        </g>
      ))}

      {/* Engrenagem / mira no lado esquerdo */}
      <Engrenagem cx={46} cy={54} />

      {/* Texto KAMBA */}
      <text
        x="175" y="80"
        textAnchor="middle"
        fill="white"
        fontFamily="'Arial Black', 'Impact', Arial, sans-serif"
        fontSize="50"
        fontWeight="900"
        letterSpacing="3"
      >
        KAMBA
      </text>

      {/* ── Separador dourado ── */}
      <rect y="100" width="320" height="4" fill="#f59e0b" />

      {/* ── Fundo preto ── */}
      <rect y="104" width="320" height="60" fill="#111111" />

      {/* Texto FEIRA */}
      <text
        x="160" y="138"
        textAnchor="middle"
        fill="#f59e0b"
        fontFamily="'Arial Black', 'Impact', Arial, sans-serif"
        fontSize="40"
        fontWeight="900"
        letterSpacing="12"
      >
        FEIRA
      </text>

      {/* Pontos vermelhos decorativos */}
      <circle cx="34"  cy="138" r="3.5" fill="#dc2626" />
      <circle cx="286" cy="138" r="3.5" fill="#dc2626" />

      {/* Tagline */}
      <text
        x="160" y="155"
        textAnchor="middle"
        fill="#9ca3af"
        fontFamily="Arial, sans-serif"
        fontSize="8.5"
        letterSpacing="2"
      >
        FEITO EM ANGOLA · PARA ANGOLA
      </text>
    </svg>
  )
}
