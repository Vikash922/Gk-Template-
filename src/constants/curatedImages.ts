export interface CuratedAsset {
  id: string;
  name: string;
  keywords: string[];
  svgDataUri: string;
  category: 'animals' | 'science' | 'india' | 'lifestyle' | 'objects' | 'nature';
}

function createSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const CURATED_ASSETS: CuratedAsset[] = [
  {
    id: 'jeans',
    name: 'Blue Jeans',
    keywords: ['jeans', 'blue jeans', 'denim', 'clothing', 'pants', 'trousers'],
    category: 'objects',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
        <defs>
          <linearGradient id="jeanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="50%" stop-color="#1d4ed8" />
            <stop offset="100%" stop-color="#1e3a8a" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <!-- Belt waistband -->
          <path d="M 100 70 C 140 65, 260 65, 300 70 L 305 110 C 260 105, 140 105, 95 110 Z" fill="#1e40af" stroke="#93c5fd" stroke-width="3" stroke-dasharray="6,4"/>
          <!-- Belt loops & button -->
          <rect x="130" y="66" width="10" height="42" rx="3" fill="#1e3a8a"/>
          <rect x="260" y="66" width="10" height="42" rx="3" fill="#1e3a8a"/>
          <circle cx="200" cy="88" r="8" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
          <!-- Main pants body -->
          <path d="M 95 110 C 90 180, 80 320, 70 450 L 175 450 C 185 350, 192 230, 200 170 C 208 230, 215 350, 225 450 L 330 450 C 320 320, 310 180, 305 110 Z" fill="url(#jeanGrad)" stroke="#1e3a8a" stroke-width="4"/>
          <!-- Fly seam & pockets -->
          <path d="M 200 110 L 200 170" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5,3"/>
          <path d="M 105 130 C 130 135, 150 160, 145 190" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5,3"/>
          <path d="M 295 130 C 270 135, 250 160, 255 190" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5,3"/>
          <!-- Fold cuffs -->
          <path d="M 70 425 L 175 425 L 175 450 L 70 450 Z" fill="#3b82f6" opacity="0.6"/>
          <path d="M 225 425 L 330 425 L 330 450 L 225 450 Z" fill="#3b82f6" opacity="0.6"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'tiger',
    name: 'Bengal Tiger',
    keywords: ['tiger', 'bengal tiger', 'feline', 'animal', 'national animal', 'predator', 'wildlife'],
    category: 'animals',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
        <defs>
          <linearGradient id="tigerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="70%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
          <filter id="tgShadow">
            <feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#tgShadow)">
          <!-- Ears -->
          <circle cx="160" cy="110" r="45" fill="#ea580c" stroke="#000" stroke-width="6"/>
          <circle cx="160" cy="110" r="28" fill="#ffffff"/>
          <circle cx="340" cy="110" r="45" fill="#ea580c" stroke="#000" stroke-width="6"/>
          <circle cx="340" cy="110" r="28" fill="#ffffff"/>
          <!-- Head Base -->
          <ellipse cx="250" cy="230" rx="145" ry="135" fill="url(#tigerGrad)" stroke="#000" stroke-width="7"/>
          <!-- White Cheeks & Chin -->
          <path d="M 130 250 C 130 330, 200 355, 250 355 C 300 355, 370 330, 370 250 C 350 220, 310 240, 250 250 C 190 240, 150 220, 130 250 Z" fill="#ffffff"/>
          <!-- Stripes -->
          <path d="M 250 100 L 250 160 M 235 120 L 210 140 M 265 120 L 290 140" stroke="#000000" stroke-width="10" stroke-linecap="round"/>
          <path d="M 135 190 L 180 200 M 125 225 L 175 230" stroke="#000000" stroke-width="9" stroke-linecap="round"/>
          <path d="M 365 190 L 320 200 M 375 225 L 325 230" stroke="#000000" stroke-width="9" stroke-linecap="round"/>
          <!-- Eyes -->
          <ellipse cx="190" cy="205" rx="18" ry="14" fill="#fbbf24" stroke="#000" stroke-width="4"/>
          <ellipse cx="190" cy="205" rx="7" ry="13" fill="#000"/>
          <circle cx="187" cy="200" r="4" fill="#fff"/>
          <ellipse cx="310" cy="205" rx="18" ry="14" fill="#fbbf24" stroke="#000" stroke-width="4"/>
          <ellipse cx="310" cy="205" rx="7" ry="13" fill="#000"/>
          <circle cx="307" cy="200" r="4" fill="#fff"/>
          <!-- Nose & Whiskers Area -->
          <path d="M 230 260 L 270 260 L 250 285 Z" fill="#ec4899" stroke="#000" stroke-width="4"/>
          <path d="M 250 285 L 250 315 M 250 315 C 235 325, 215 320, 215 305 M 250 315 C 265 325, 285 320, 285 305" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <!-- Whiskers -->
          <line x1="170" y1="300" x2="90" y2="285" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <line x1="170" y1="315" x2="95" y2="320" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <line x1="330" y1="300" x2="410" y2="285" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <line x1="330" y1="315" x2="405" y2="320" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'skeleton',
    name: 'Human Skeleton / Bones',
    keywords: ['bone', 'bones', 'skeleton', 'anatomy', 'human body', 'ribcage', 'skull'],
    category: 'science',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 500" width="100%" height="100%">
        <defs>
          <filter id="boneShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity="0.2"/>
          </filter>
        </defs>
        <g filter="url(#boneShadow)">
          <!-- Skull -->
          <path d="M 180 80 C 180 40, 270 40, 270 80 C 270 115, 260 130, 250 145 L 200 145 C 190 130, 180 115, 180 80 Z" fill="#f8fafc" stroke="#334155" stroke-width="6"/>
          <!-- Eye Sockets & Nose -->
          <circle cx="205" cy="85" r="14" fill="#1e293b"/>
          <circle cx="245" cy="85" r="14" fill="#1e293b"/>
          <path d="M 225 105 L 220 120 L 230 120 Z" fill="#1e293b"/>
          <!-- Teeth -->
          <rect x="205" y="130" width="8" height="12" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
          <rect x="217" y="130" width="8" height="12" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
          <rect x="229" y="130" width="8" height="12" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
          <rect x="241" y="130" width="8" height="12" rx="2" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
          <!-- Spine & Ribcage -->
          <line x1="225" y1="150" x2="225" y2="350" stroke="#334155" stroke-width="12" stroke-linecap="round"/>
          <!-- Rib arches -->
          <path d="M 225 180 C 150 180, 140 220, 225 230 C 310 220, 300 180, 225 180 Z" fill="none" stroke="#64748b" stroke-width="8"/>
          <path d="M 225 215 C 140 215, 130 255, 225 265 C 320 255, 310 215, 225 215 Z" fill="none" stroke="#64748b" stroke-width="8"/>
          <path d="M 225 250 C 145 250, 135 290, 225 300 C 315 290, 305 250, 225 250 Z" fill="none" stroke="#64748b" stroke-width="8"/>
          <!-- Pelvis Bone -->
          <path d="M 160 340 C 170 310, 280 310, 290 340 C 270 390, 180 390, 160 340 Z" fill="#f1f5f9" stroke="#334155" stroke-width="6"/>
          <!-- Leg Bone hints -->
          <line x1="180" y1="375" x2="160" y2="470" stroke="#cbd5e1" stroke-width="14" stroke-linecap="round"/>
          <line x1="270" y1="375" x2="290" y2="470" stroke="#cbd5e1" stroke-width="14" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'water-drinking',
    name: 'Drinking Water & Kidney',
    keywords: ['water', 'drink', 'drinking', 'kidney', 'organ', 'health', 'hydration', 'liquid'],
    category: 'lifestyle',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 480" width="100%" height="100%">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <filter id="waterShadow">
            <feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#waterShadow)">
          <!-- Glass -->
          <path d="M 130 90 L 160 370 C 165 400, 285 400, 290 370 L 320 90 Z" fill="none" stroke="#0284c7" stroke-width="8"/>
          <!-- Water inside glass -->
          <path d="M 148 180 L 163 360 C 170 385, 280 385, 287 360 L 302 180 C 270 195, 180 165, 148 180 Z" fill="url(#waterGrad)" opacity="0.85"/>
          <!-- Fresh Splash Drops -->
          <circle cx="225" cy="110" r="18" fill="#38bdf8"/>
          <circle cx="270" cy="70" r="10" fill="#38bdf8"/>
          <circle cx="170" cy="80" r="12" fill="#38bdf8"/>
          <!-- Kidney silhouette badge beside -->
          <g transform="translate(250, 230) scale(0.65)">
            <path d="M 60 20 C 130 0, 160 80, 150 140 C 140 200, 70 200, 50 150 C 40 120, 60 90, 60 70 C 60 50, 40 30, 60 20 Z" fill="#dc2626" stroke="#991b1b" stroke-width="6"/>
          </g>
        </g>
      </svg>
    `),
  },
  {
    id: 'apple',
    name: 'Apple with Seeds',
    keywords: ['apple', 'fruit', 'seed', 'cyanide', 'nutrition', 'plant'],
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 450" width="100%" height="100%">
        <defs>
          <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
          <filter id="appShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#appShadow)">
          <!-- Stem & Leaf -->
          <path d="M 225 110 C 220 50, 250 30, 260 20" fill="none" stroke="#78350f" stroke-width="8" stroke-linecap="round"/>
          <path d="M 235 60 C 290 40, 310 90, 270 90 Z" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
          <!-- Half Apple Cutout showing seeds -->
          <path d="M 225 110 C 280 80, 360 120, 360 220 C 360 320, 280 380, 225 360 C 170 380, 90 320, 90 220 C 90 120, 170 80, 225 110 Z" fill="url(#appleGrad)" stroke="#7f1d1d" stroke-width="5"/>
          <!-- Inner Cream core -->
          <ellipse cx="225" cy="235" rx="80" ry="90" fill="#fef9c3" stroke="#fef08a" stroke-width="4"/>
          <!-- Dark Toxic Seeds -->
          <ellipse cx="210" cy="230" rx="9" ry="16" transform="rotate(-15 210 230)" fill="#451a03" stroke="#000" stroke-width="2"/>
          <ellipse cx="240" cy="230" rx="9" ry="16" transform="rotate(15 240 230)" fill="#451a03" stroke="#000" stroke-width="2"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'desert-camel',
    name: 'Desert Camel',
    keywords: ['camel', 'desert', 'dunes', 'sahara', 'wildlife', 'animal'],
    category: 'animals',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
        <defs>
          <linearGradient id="camelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <filter id="cmlShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#cmlShadow)">
          <!-- Sand dunes background -->
          <path d="M 50 380 C 180 340, 320 400, 450 360 L 450 420 L 50 420 Z" fill="#fde68a" opacity="0.6"/>
          <!-- Camel body with hump -->
          <path d="M 120 150 C 130 110, 160 100, 175 120 C 185 140, 185 190, 210 210 C 230 150, 290 140, 310 200 C 330 160, 380 170, 390 220 C 400 280, 370 330, 320 330 L 320 400 L 290 400 L 290 330 L 240 330 L 240 400 L 210 400 L 210 330 C 180 330, 160 280, 150 240 Z" fill="url(#camelGrad)" stroke="#78350f" stroke-width="5"/>
          <!-- Eye & Ears -->
          <circle cx="150" cy="125" r="5" fill="#000"/>
          <path d="M 160 105 L 165 115" stroke="#78350f" stroke-width="4"/>
          <!-- Sun in sky -->
          <circle cx="390" cy="80" r="35" fill="#fbbf24"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'solar-system',
    name: 'Solar System & Planets',
    keywords: ['planet', 'space', 'solar system', 'sun', 'venus', 'mars', 'earth', 'astronomy', 'orbit'],
    category: 'science',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="60%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </radialGradient>
          <filter id="spaceGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#f59e0b" flood-opacity="0.4"/>
          </filter>
        </defs>
        <g>
          <!-- Orbital rings -->
          <ellipse cx="250" cy="225" rx="190" ry="110" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="6,6" opacity="0.6"/>
          <ellipse cx="250" cy="225" rx="130" ry="75" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="6,6" opacity="0.6"/>
          <!-- Glowing Center Sun -->
          <circle cx="250" cy="225" r="55" fill="url(#sunGrad)" filter="url(#spaceGlow)"/>
          <!-- Planet Venus (golden yellow) -->
          <circle cx="130" cy="180" r="22" fill="#eab308" stroke="#ca8a04" stroke-width="3"/>
          <!-- Planet Earth (blue & green) -->
          <circle cx="390" cy="180" r="26" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <path d="M 380 170 Q 395 165 400 175 Q 390 195 380 170 Z" fill="#22c55e"/>
          <!-- Saturn with rings -->
          <ellipse cx="140" cy="300" rx="35" ry="10" transform="rotate(-20 140 300)" fill="none" stroke="#fbbf24" stroke-width="6"/>
          <circle cx="140" cy="300" r="20" fill="#d97706"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'lotus',
    name: 'Lotus Flower',
    keywords: ['lotus', 'flower', 'national flower', 'botany', 'nature', 'blossom'],
    category: 'nature',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
        <defs>
          <linearGradient id="lotusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e"/>
            <stop offset="60%" stop-color="#fb7185"/>
            <stop offset="100%" stop-color="#ffe4e6"/>
          </linearGradient>
          <filter id="lotusShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#lotusShadow)">
          <!-- Leaves below -->
          <ellipse cx="250" cy="380" rx="180" ry="40" fill="#15803d" opacity="0.8"/>
          <!-- Outer Petals -->
          <path d="M 250 360 C 130 330, 80 250, 140 180 C 180 260, 220 320, 250 360 Z" fill="url(#lotusGrad)" stroke="#e11d48" stroke-width="3"/>
          <path d="M 250 360 C 370 330, 420 250, 360 180 C 320 260, 280 320, 250 360 Z" fill="url(#lotusGrad)" stroke="#e11d48" stroke-width="3"/>
          <!-- Middle Petals -->
          <path d="M 250 350 C 170 310, 140 200, 190 120 C 220 210, 240 280, 250 350 Z" fill="url(#lotusGrad)" stroke="#e11d48" stroke-width="3"/>
          <path d="M 250 350 C 330 310, 360 200, 310 120 C 280 210, 260 280, 250 350 Z" fill="url(#lotusGrad)" stroke="#e11d48" stroke-width="3"/>
          <!-- Center Lotus Bud -->
          <path d="M 250 340 C 210 260, 220 150, 250 80 C 280 150, 290 260, 250 340 Z" fill="#fda4af" stroke="#be123c" stroke-width="4"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'isro-rocket',
    name: 'Space Rocket',
    keywords: ['rocket', 'isro', 'nasa', 'space', 'launch', 'shuttle', 'science', 'astronomy', 'spacecraft'],
    category: 'science',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 500" width="100%" height="100%">
        <defs>
          <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="40%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
          <filter id="rocketGlow">
            <feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#rocketGlow)">
          <!-- Exhaust Flames -->
          <path d="M 195 380 Q 225 480 255 380 Q 240 440 225 460 Q 210 440 195 380 Z" fill="url(#flameGrad)"/>
          <!-- Rocket Fins -->
          <path d="M 160 370 L 120 380 L 160 280 Z" fill="#ea580c"/>
          <path d="M 290 370 L 330 380 L 290 280 Z" fill="#ea580c"/>
          <!-- Main Rocket Body -->
          <path d="M 160 380 L 160 200 C 160 110, 225 50, 225 50 C 225 50, 290 110, 290 200 L 290 380 Z" fill="#ffffff" stroke="#1e293b" stroke-width="6"/>
          <!-- Indian Tricolor Stripes on rocket -->
          <rect x="163" y="190" width="124" height="15" fill="#f97316"/>
          <rect x="163" y="205" width="124" height="15" fill="#ffffff"/>
          <rect x="163" y="220" width="124" height="15" fill="#16a34a"/>
          <!-- Porthole Window -->
          <circle cx="225" cy="140" r="28" fill="#38bdf8" stroke="#0f172a" stroke-width="5"/>
          <circle cx="220" cy="135" r="8" fill="#ffffff"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'india-gate',
    name: 'India Gate / Monument',
    keywords: ['india', 'gate', 'delhi', 'monument', 'arch', 'history', 'landmark', 'heritage'],
    category: 'india',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 450" width="100%" height="100%">
        <defs>
          <linearGradient id="gateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fdba74"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
          <filter id="gateShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#gateShadow)">
          <!-- Base Steps -->
          <rect x="70" y="380" width="360" height="25" rx="4" fill="#78350f"/>
          <rect x="90" y="360" width="320" height="20" rx="4" fill="#9a3412"/>
          <!-- Main Pillars -->
          <rect x="120" y="140" width="90" height="220" fill="url(#gateGrad)" stroke="#7c2d12" stroke-width="4"/>
          <rect x="290" y="140" width="90" height="220" fill="url(#gateGrad)" stroke="#7c2d12" stroke-width="4"/>
          <!-- Central Arch -->
          <path d="M 210 360 L 210 240 C 210 190, 290 190, 290 240 L 290 360 Z" fill="#ffffff" stroke="#7c2d12" stroke-width="4"/>
          <!-- Top Beam / Pediment -->
          <rect x="100" y="90" width="300" height="50" rx="6" fill="url(#gateGrad)" stroke="#7c2d12" stroke-width="4"/>
          <rect x="140" y="60" width="220" height="30" rx="4" fill="#ea580c"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'modi',
    name: 'National Leader / Statesman',
    keywords: ['modi', 'leader', 'prime minister', 'president', 'statesman', 'politics', 'government'],
    category: 'india',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 480" width="100%" height="100%">
        <defs>
          <linearGradient id="flagTiranga" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#16a34a"/>
          </linearGradient>
          <filter id="pmShadow">
            <feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.2"/>
          </filter>
        </defs>
        <g filter="url(#pmShadow)">
          <!-- Tricolor Badge Background Circle -->
          <circle cx="225" cy="230" r="170" fill="url(#flagTiranga)" opacity="0.25"/>
          <circle cx="225" cy="230" r="170" fill="none" stroke="#f97316" stroke-width="4"/>
          <!-- Nehru Jacket / Kurta (Saffron / Orange) -->
          <path d="M 130 460 L 145 310 L 205 270 L 245 270 L 305 310 L 320 460 Z" fill="#ea580c" stroke="#c2410c" stroke-width="4"/>
          <rect x="215" y="270" width="20" height="190" fill="#c2410c"/>
          <circle cx="225" cy="310" r="5" fill="#fef08a"/>
          <circle cx="225" cy="350" r="5" fill="#fef08a"/>
          <circle cx="225" cy="390" r="5" fill="#fef08a"/>
          <!-- Kurta Collar (White) -->
          <path d="M 190 270 L 225 295 L 260 270 L 245 250 L 205 250 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <!-- Face & Head -->
          <ellipse cx="225" cy="195" rx="65" ry="75" fill="#fed7aa" stroke="#fba76a" stroke-width="3"/>
          <!-- White Beard & Mustache -->
          <path d="M 165 190 C 165 265, 285 265, 285 190 C 275 240, 175 240, 165 190 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
          <path d="M 195 210 Q 225 220 255 210 Q 225 230 195 210 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
          <!-- Spectacles (Frameless/Thin Black) -->
          <rect x="180" y="170" width="36" height="24" rx="6" fill="none" stroke="#1e293b" stroke-width="3"/>
          <rect x="234" y="170" width="36" height="24" rx="6" fill="none" stroke="#1e293b" stroke-width="3"/>
          <line x1="216" y1="182" x2="234" y2="182" stroke="#1e293b" stroke-width="3"/>
          <!-- White Hair -->
          <path d="M 160 180 C 160 120, 290 120, 290 180 C 280 140, 170 140, 160 180 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
          <!-- Smile -->
          <path d="M 215 225 Q 225 235 235 225" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
];

export function findCuratedAssetByQuery(query: string): CuratedAsset {
  if (!query) return CURATED_ASSETS[0];
  const q = query.toLowerCase();
  const match = CURATED_ASSETS.find((asset) =>
    asset.keywords.some((kw) => q.includes(kw.toLowerCase()))
  );
  return match || CURATED_ASSETS[0];
}
