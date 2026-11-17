import { cn } from '@/lib/cn';

/**
 * Bandeja del pañol vista desde arriba: multímetro, placa de desarrollo,
 * cable enrollado, resistencias y dos destornilladores cruzando la bandeja.
 * Ilustración decorativa (SVG propio, sin imágenes externas).
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 560"
      className={cn('h-auto w-full select-none', className)}
      role="img"
      aria-label="Bandeja del pañol con multímetro, placa electrónica y herramientas"
    >
      <defs>
        <radialGradient id="ini-wood-rim" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#dca46b" />
          <stop offset="70%" stopColor="#b8773b" />
          <stop offset="100%" stopColor="#8a5424" />
        </radialGradient>
        <radialGradient id="ini-wood-in" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#d59a5d" />
          <stop offset="100%" stopColor="#a96a31" />
        </radialGradient>
        <linearGradient id="ini-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="50%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>
        <linearGradient id="ini-pcb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14857a" />
          <stop offset="100%" stopColor="#0b5e56" />
        </linearGradient>
        <filter id="ini-shadow-lg" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#000" floodOpacity="0.38" />
        </filter>
        <filter id="ini-shadow-sm" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Bandeja */}
      <g filter="url(#ini-shadow-lg)">
        <circle cx="300" cy="290" r="215" fill="url(#ini-wood-rim)" />
      </g>
      <circle cx="300" cy="290" r="186" fill="url(#ini-wood-in)" />
      <g fill="none" stroke="#7a4a1e" strokeOpacity="0.14" strokeWidth="2">
        <ellipse cx="300" cy="290" rx="160" ry="150" />
        <ellipse cx="292" cy="300" rx="120" ry="104" />
        <ellipse cx="310" cy="280" rx="74" ry="62" />
        <path d="M120 250 C 200 230, 260 260, 330 240 S 450 230, 480 260" />
        <path d="M130 340 C 210 360, 300 320, 380 350 S 460 360, 476 330" />
      </g>

      {/* Cable USB enrollado */}
      <g filter="url(#ini-shadow-sm)" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round">
        <ellipse cx="392" cy="196" rx="52" ry="40" />
        <ellipse cx="392" cy="196" rx="38" ry="28" stroke="#1d4ed8" />
        <path d="M440 210 C 470 240, 470 280, 448 300" />
      </g>
      <rect x="436" y="296" width="22" height="30" rx="4" fill="url(#ini-steel)" transform="rotate(20 447 311)" />

      {/* Placa de desarrollo */}
      <g filter="url(#ini-shadow-sm)" transform="rotate(14 380 360)">
        <rect x="300" y="305" width="170" height="112" rx="9" fill="url(#ini-pcb)" />
        <rect x="292" y="330" width="24" height="30" rx="3" fill="url(#ini-steel)" />
        <rect x="292" y="372" width="20" height="24" rx="3" fill="#27272a" />
        <rect x="370" y="345" width="56" height="40" rx="3" fill="#18181b" />
        <g fill="#d4a017">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={`t${i}`} x={326 + i * 11} y="313" width="6" height="8" rx="1" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={`b${i}`} x={340 + i * 11} y="401" width="6" height="8" rx="1" />
          ))}
        </g>
        <circle cx="312" cy="314" r="4" fill="#0a4740" />
        <circle cx="458" cy="406" r="4" fill="#0a4740" />
        <circle cx="342" cy="372" r="7" fill="#e5e7eb" />
        <circle cx="440" cy="362" r="3" fill="#fbbf24" />
      </g>

      {/* Multímetro */}
      <g filter="url(#ini-shadow-sm)" transform="rotate(-16 220 300)">
        <rect x="160" y="195" width="122" height="205" rx="22" fill="#f5b82e" />
        <rect x="172" y="207" width="98" height="181" rx="12" fill="#27272a" />
        <rect x="182" y="218" width="78" height="38" rx="5" fill="#b7d3b9" />
        <text
          x="221"
          y="246"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="22"
          fontWeight="700"
          fill="#1f2937"
        >
          12.6
        </text>
        <circle cx="221" cy="300" r="30" fill="#3f3f46" stroke="#52525b" strokeWidth="3" />
        <rect x="218" y="272" width="6" height="22" rx="2" fill="#e4e4e7" />
        <g fill="#a1a1aa">
          <circle cx="190" cy="282" r="2" />
          <circle cx="252" cy="282" r="2" />
          <circle cx="186" cy="310" r="2" />
          <circle cx="256" cy="310" r="2" />
        </g>
        <circle cx="194" cy="360" r="8" fill="#18181b" stroke="#52525b" strokeWidth="2" />
        <circle cx="221" cy="360" r="8" fill="#18181b" stroke="#52525b" strokeWidth="2" />
        <circle cx="248" cy="360" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
      </g>

      {/* Resistencias */}
      {[
        { x: 236, y: 432, r: -24 },
        { x: 268, y: 448, r: 8 },
        { x: 182, y: 170, r: 40 },
      ].map((res, i) => (
        <g key={i} transform={`rotate(${res.r} ${res.x} ${res.y})`} filter="url(#ini-shadow-sm)">
          <line x1={res.x - 30} y1={res.y} x2={res.x + 30} y2={res.y} stroke="#a1a1aa" strokeWidth="2" />
          <rect x={res.x - 14} y={res.y - 6} width="28" height="12" rx="6" fill="#e8d3b0" />
          <rect x={res.x - 8} y={res.y - 6} width="3" height="12" fill="#7c2d12" />
          <rect x={res.x - 2} y={res.y - 6} width="3" height="12" fill="#18181b" />
          <rect x={res.x + 4} y={res.y - 6} width="3" height="12" fill="#ca8a04" />
        </g>
      ))}

      {/* Destornilladores cruzando la bandeja */}
      {[
        { y: 0, handle: '#18181b', grip: '#fbbf24' },
        { y: 30, handle: '#27272a', grip: '#e4e4e7' },
      ].map((sd, i) => (
        <g key={i} filter="url(#ini-shadow-sm)" transform={`rotate(22 300 110) translate(10 ${50 + sd.y})`}>
          <rect x="150" y="96" width="300" height="9" rx="3" fill="url(#ini-steel)" />
          <path d="M450 96 L 470 99 L 470 102 L 450 105 Z" fill="#a1a1aa" />
          <rect x="40" y="86" width="118" height="29" rx="13" fill={sd.handle} />
          <rect x="62" y="86" width="9" height="29" fill={sd.grip} />
          <rect x="82" y="86" width="9" height="29" fill={sd.grip} />
          <rect x="102" y="86" width="9" height="29" fill={sd.grip} />
        </g>
      ))}
    </svg>
  );
}
