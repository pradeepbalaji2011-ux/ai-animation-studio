import { useId } from 'react'
import type { Scene, StylePreset } from '@/types/studio'

export function StyleArt({ preset, className = '' }: { preset: StylePreset; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const [dark, light, accent, support, warm] = preset.palette
  const isType = preset.id === 'kinetic-typography'
  const isPixel = preset.id === 'pixel-art'
  const isWhiteboard = preset.id === 'whiteboard-animation'
  const is3d = ['3d-animation', 'cel-shaded-animation', 'claymation'].includes(preset.id)

  return (
    <svg viewBox="0 0 320 190" className={className} role="img" aria-label={`${preset.name} visual preview`}>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={dark} />
          <stop offset="1" stopColor={support || accent} stopOpacity=".82" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor={warm || light} stopOpacity=".95" />
          <stop offset="1" stopColor={warm || light} stopOpacity="0" />
        </radialGradient>
        <pattern id={`grain-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r=".7" fill={light} opacity=".14" />
          <circle cx="9" cy="8" r=".5" fill={light} opacity=".1" />
        </pattern>
      </defs>
      <rect width="320" height="190" fill={isWhiteboard ? light : `url(#sky-${uid})`} />
      <circle cx="250" cy="46" r="66" fill={`url(#glow-${uid})`} opacity=".65" />
      {!isWhiteboard && <path d="M0 130L72 76l48 36 58-60 74 66 68-37v109H0Z" fill={dark} opacity=".56" />}
      {!isWhiteboard && <path d="M0 151l74-44 53 38 71-48 64 42 58-22v73H0Z" fill={accent} opacity=".25" />}
      <rect width="320" height="190" fill={`url(#grain-${uid})`} />

      {isType ? (
        <g fontFamily="Inter, sans-serif" fontWeight="800" letterSpacing="-3">
          <text x="24" y="69" fontSize="53" fill={light}>MAKE</text>
          <text x="24" y="119" fontSize="53" fill={accent}>IT MOVE.</text>
          <rect x="26" y="137" width="135" height="5" fill={support} />
        </g>
      ) : isPixel ? (
        <g shapeRendering="crispEdges">
          <rect x="126" y="47" width="64" height="18" fill={warm} />
          <rect x="114" y="65" width="88" height="44" fill={warm} />
          <rect x="126" y="75" width="12" height="12" fill={dark} />
          <rect x="178" y="75" width="12" height="12" fill={dark} />
          <rect x="138" y="109" width="42" height="50" fill={accent} />
          <rect x="108" y="115" width="24" height="14" fill={light} />
          <rect x="186" y="115" width="24" height="14" fill={light} />
          <rect x="138" y="159" width="14" height="18" fill={dark} />
          <rect x="168" y="159" width="14" height="18" fill={dark} />
        </g>
      ) : isWhiteboard ? (
        <g fill="none" stroke={dark} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="160" cy="68" r="28" />
          <path d="M138 129c8-28 37-34 51-7M144 66c9 8 22 8 32 0M149 55h3m17 0h3" />
          <path d="M55 148h64m-54-18 16-16 17 12 20-28" stroke={accent} />
          <path d="M220 54h54m-54 20h40m-40 20h48" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <ellipse cx="162" cy="171" rx="71" ry="10" fill={dark} opacity=".38" />
          {is3d && <ellipse cx="154" cy="82" rx="47" ry="48" fill={dark} opacity=".24" transform="translate(10 7)" />}
          <path d="M128 157c4-44 13-64 35-64s35 22 39 64Z" fill={accent} />
          <circle cx="163" cy="70" r="36" fill={warm || light} />
          <path d="M128 70c1-38 59-49 73-12-20-11-47-9-73 12Z" fill={dark} />
          <path d="M139 67c7-5 15-5 22 0m10 0c7-5 14-5 20 0" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <circle cx="151" cy="72" r="3" fill={dark} /><circle cx="179" cy="72" r="3" fill={dark} />
          <path d="M154 86c7 5 14 5 20-1" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <path d="M129 125 98 149m100-26 27 23" stroke={warm || light} strokeWidth="13" strokeLinecap="round" />
          <circle cx="231" cy="52" r="13" fill={warm || light} opacity=".85" />
          <path d="m231 27 0-9m0 77v-9m25-34h9m-77 0h9" stroke={warm || light} strokeWidth="3" />
        </g>
      )}
      <path d="M16 174h52" stroke={light} opacity=".5" />
      <text x="16" y="166" fill={light} fontSize="9" fontFamily="Fira Code, monospace" letterSpacing="1.5">{preset.route.toUpperCase()}</text>
    </svg>
  )
}

export function CharacterPortrait({ expression = 'neutral', className = '' }: { expression?: string; className?: string }) {
  const mouth = expression === 'surprised' ? 'M46 65q4 8 8 0' : expression === 'happy' ? 'M43 63q7 8 14 0' : 'M44 65q6 3 12 0'
  return (
    <svg viewBox="0 0 100 112" className={className} role="img" aria-label={`Mira character sheet, ${expression} expression`}>
      <rect width="100" height="112" fill="#24262b" />
      <path d="M0 91 100 54v58H0Z" fill="#31404b" />
      <path d="M24 112c1-31 10-44 27-44 18 0 28 15 29 44Z" fill="#d6a83e" />
      <path d="m39 76 11 14 12-14" fill="#ede2cd" />
      <ellipse cx="50" cy="45" rx="25" ry="28" fill="#c98568" />
      <path d="M25 47C20 11 75 3 79 39 63 25 41 25 25 47Z" fill="#25252b" />
      <path d="M26 43c-4 19 1 30 9 34-13-2-19-17-9-34Zm49-5c8 15 4 30-3 37 13-5 16-24 3-37Z" fill="#25252b" />
      <path d={expression === 'surprised' ? 'M34 40q7-7 14 0m6 0q7-7 13 0' : 'M34 42q7-4 14 0m6 0q7-4 13 0'} fill="none" stroke="#362c2a" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="42" cy="48" rx="2.4" ry={expression === 'surprised' ? 4 : 2.8} fill="#26272b" />
      <ellipse cx="60" cy="48" rx="2.4" ry={expression === 'surprised' ? 4 : 2.8} fill="#26272b" />
      <path d={mouth} fill="none" stroke="#733f3a" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 109h64" stroke="#f2c14e" strokeWidth="2" opacity=".6" />
    </svg>
  )
}

export function VideoFrame({ preset, scene, safeZones = false, playing = false, compact = false }: {
  preset: StylePreset
  scene: Scene
  safeZones?: boolean
  playing?: boolean
  compact?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const accent = preset.palette[2] || '#d40027'
  const support = preset.palette[3] || '#38536a'
  return (
    <div className={`video-frame ${playing ? 'is-playing' : ''} ${compact ? 'is-compact' : ''}`}>
      <svg viewBox="0 0 360 640" className="h-full w-full" role="img" aria-label={`Vertical preview: ${scene.action}`}>
        <defs>
          <linearGradient id={`night-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#182a3c" />
            <stop offset=".6" stopColor={support} />
            <stop offset="1" stopColor="#13191e" />
          </linearGradient>
          <radialGradient id={`lantern-${uid}`}>
            <stop offset="0" stopColor="#ffd885" stopOpacity=".95" />
            <stop offset=".3" stopColor="#ee9b47" stopOpacity=".5" />
            <stop offset="1" stopColor="#ee9b47" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`wet-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#26323c" />
            <stop offset="1" stopColor="#10161c" />
          </linearGradient>
        </defs>
        <rect width="360" height="640" fill={`url(#night-${uid})`} />
        <circle cx="282" cy="106" r="48" fill="#e9dfc6" opacity=".72" />
        <circle cx="266" cy="91" r="48" fill="#203448" />
        <g fill="#b9cfda" opacity=".3">
          {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={(i * 73) % 360} y={(i * 97) % 420} width="1.2" height="19" transform={`rotate(14 ${(i * 73) % 360} ${(i * 97) % 420})`} />)}
        </g>
        <path d="M0 276 55 232l54 22 66-61 70 55 47-29 68 39v116H0Z" fill="#17232d" opacity=".78" />
        <g fill="#1a242d">
          <rect x="0" y="280" width="64" height="130" /><rect x="72" y="299" width="82" height="111" />
          <rect x="238" y="272" width="122" height="138" />
        </g>
        <g fill="#d6a65c" opacity=".65">
          <rect x="17" y="303" width="13" height="21" /><rect x="90" y="320" width="16" height="20" />
          <rect x="271" y="295" width="15" height="24" /><rect x="309" y="331" width="17" height="22" />
        </g>
        <path d="M0 402h360v238H0Z" fill={`url(#wet-${uid})`} />
        <path d="m0 497 360-43M0 576l360-48M48 640l90-221m154 221-62-230" stroke="#63727b" strokeWidth="2" opacity=".4" />
        <path d="M206 436h102l58 64H171Z" fill="#1d242a" />
        <path d="M219 446h69l29 31H196Z" fill="#d9b465" opacity=".45" />
        <ellipse cx="168" cy="579" rx="62" ry="14" fill="#0b1116" opacity=".6" />
        <path d="M127 550c4-81 12-125 44-125s43 49 46 125l-28 5-4-69-3 69h-29l-5-69-1 68Z" fill="#d6a83e" />
        <path d="m145 431 25 32 25-32 11 33-36 30-35-30Z" fill="#e5bc50" />
        <ellipse cx="170" cy="392" rx="33" ry="38" fill="#c98568" />
        <path d="M136 395c-7-54 67-64 72-16-24-19-48-17-72 16Z" fill="#22252a" />
        <path d="M138 383c-8 31-1 49 8 57-20-6-24-37-8-57Zm66-10c12 27 5 49-4 59 20-9 22-39 4-59Z" fill="#22252a" />
        <path d="M151 391q7-4 13 0m12 0q7-4 13 0" fill="none" stroke="#3d3030" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="159" cy="397" r="2.4" fill="#27282b" /><circle cx="183" cy="397" r="2.4" fill="#27282b" />
        <path d="M161 414q9 5 17-1" fill="none" stroke="#77473f" strokeWidth="2.4" strokeLinecap="round" />
        <path d="m139 456-43 57m106-58 32 42" stroke="#d6a83e" strokeWidth="19" strokeLinecap="round" />
        <circle className="lantern-glow" cx="238" cy="506" r="78" fill={`url(#lantern-${uid})`} />
        <path d="M226 478q12-20 24 0" fill="none" stroke="#322a26" strokeWidth="4" />
        <rect x="224" y="478" width="29" height="42" rx="4" fill={accent} />
        <rect x="229" y="484" width="19" height="28" rx="2" fill="#ffd483" />
        <path d="M224 489h29m-29 21h29" stroke="#392c27" strokeWidth="3" />
        <path d="m221 531-22 81m51-82 30 80" stroke={accent} strokeWidth="3" opacity=".2" />
        <g className="caption-block">
          <rect x="40" y="530" width="280" height="54" rx="2" fill="#11161b" opacity=".76" />
          <text x="180" y="564" textAnchor="middle" fill="#f4f0e8" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="19" letterSpacing="1.3">{scene.onScreenText}</text>
        </g>
        {safeZones && (
          <g fill="none" strokeWidth="1.5" strokeDasharray="6 5">
            <rect x="22" y="76" width="316" height="474" stroke="#70e1b1" opacity=".85" />
            <rect x="12" y="36" width="336" height="570" stroke="#f2c14e" opacity=".65" />
            <text x="28" y="94" fill="#70e1b1" fontSize="9" fontFamily="Fira Code, monospace" stroke="none">CAPTION SAFE</text>
            <text x="18" y="55" fill="#f2c14e" fontSize="9" fontFamily="Fira Code, monospace" stroke="none">UI SAFE</text>
          </g>
        )}
      </svg>
    </div>
  )
}
