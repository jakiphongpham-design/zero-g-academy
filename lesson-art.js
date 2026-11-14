/*
 * lesson-art.js — 30 inline SVG illustrations, one per lesson.
 * Loaded as a plain script; exposes window.ZGA_ART[lessonId] -> SVG markup.
 *
 * Every SVG shares one 240x160 canvas, a deep-space background, a glow filter and a
 * starfield. Gradient and filter ids use the placeholder "__ID__", which the page
 * replaces with a unique id for each rendered copy, so the same art can appear
 * many times on one page without id clashes.
 */
(() => {
  const STARS = `<g fill="#FFFFFF" opacity=".85"><circle cx="16" cy="20" r="1"/><circle cx="58" cy="132" r="1.2"/><circle cx="208" cy="26" r="1"/><circle cx="226" cy="120" r="1.4"/><circle cx="150" cy="14" r=".9"/><circle cx="92" cy="146" r="1"/><circle cx="182" cy="150" r=".8"/><circle cx="34" cy="78" r=".8"/></g>`;

  const DEFS = `<radialGradient id="__ID__-bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#17377A"/><stop offset="1" stop-color="#02040E"/></radialGradient><filter id="__ID__-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  /** Wrap a scene in the shared canvas. `defs` and `body` are SVG markup strings. */
  function art(label, defs, body) {
    return `<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><defs>${DEFS}${defs}</defs><rect width="240" height="160" fill="url(#__ID__-bg)"/>${STARS}${body}</svg>`;
  }

  const SUN_CORE = `<radialGradient id="__ID__-sun" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FFE38A"/><stop offset=".85" stop-color="#FF9A2E"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient>`;
  const EARTH = `<radialGradient id="__ID__-earth" cx="38%" cy="30%" r="72%"><stop offset="0" stop-color="#7FE3FF"/><stop offset=".5" stop-color="#1E6FD9"/><stop offset="1" stop-color="#0A2360"/></radialGradient>`;
  const MARS = `<radialGradient id="__ID__-mars" cx="35%" cy="30%" r="72%"><stop offset="0" stop-color="#FFB27A"/><stop offset=".55" stop-color="#C4502A"/><stop offset="1" stop-color="#5A1A0C"/></radialGradient>`;
  const METAL = `<linearGradient id="__ID__-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#8A97AD"/></linearGradient>`;
  const GOLD = `<linearGradient id="__ID__-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".5" stop-color="#E0A526"/><stop offset="1" stop-color="#8A5A12"/></linearGradient>`;
  const FLAME = `<linearGradient id="__ID__-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3A3"/><stop offset=".5" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FF3B3B" stop-opacity="0"/></linearGradient>`;

  const ART = {};

  // 1. Gravity & Fall: Earth, Mars and Moon dropping at different rates
  ART[1] = art("Earth, Mars and Moon with falling arrows of different length", `${EARTH}${MARS}
    <radialGradient id="__ID__-moon" cx="35%" cy="30%" r="72%"><stop offset="0" stop-color="#F4F6FA"/><stop offset=".6" stop-color="#9AA3B5"/><stop offset="1" stop-color="#3A4256"/></radialGradient>
    <linearGradient id="__ID__-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset="1" stop-color="#FF7A1A"/></linearGradient>`,
    `<circle cx="52" cy="58" r="24" fill="url(#__ID__-earth)" filter="url(#__ID__-glow)"/>
     <path d="M36 50 q8 -6 16 0 q-4 8 2 14 q-8 4 -12 -4 q-6 -2 -6 -10z" fill="#4CD08A" opacity=".85"/>
     <circle cx="120" cy="58" r="19" fill="url(#__ID__-mars)" filter="url(#__ID__-glow)"/>
     <ellipse cx="112" cy="54" rx="5" ry="2.5" fill="#7A2A14" opacity=".6"/>
     <circle cx="192" cy="58" r="13" fill="url(#__ID__-moon)"/>
     <circle cx="188" cy="55" r="2.5" fill="#6B7487"/><circle cx="196" cy="62" r="1.8" fill="#6B7487"/>
     <g stroke="url(#__ID__-fall)" stroke-width="3" stroke-linecap="round" fill="none"><path d="M52 92 V136"/><path d="M120 86 V112"/><path d="M192 76 V96"/></g>
     <g fill="#FF7A1A"><path d="M46 130 L52 140 L58 130z"/><path d="M114 106 L120 116 L126 106z"/><path d="M186 90 L192 100 L198 90z"/></g>
     <g font-family="Verdana, sans-serif" font-size="9" font-weight="700" fill="#EAF2FF" text-anchor="middle"><text x="52" y="152">9.8</text><text x="120" y="126">3.7</text><text x="192" y="110">1.6</text></g>`);

  // 2. Food in Space: a space meal pouch with floating food
  ART[2] = art("Space food pouch with floating food pieces", `<linearGradient id="__ID__-pouch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#C2410C"/></linearGradient>
    <linearGradient id="__ID__-cube" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>`,
    `<path d="M80 44 Q120 36 160 44 L166 120 Q120 128 74 120 Z" fill="url(#__ID__-pouch)" filter="url(#__ID__-glow)"/>
     <path d="M80 44 Q120 36 160 44" fill="none" stroke="#FFF3D6" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>
     <rect x="96" y="66" width="48" height="30" rx="6" fill="#FFF7E6" opacity=".92"/>
     <path d="M104 76 H132 M104 84 H126" stroke="#C2410C" stroke-width="3" stroke-linecap="round"/>
     <rect x="34" y="104" width="22" height="22" rx="4" fill="url(#__ID__-cube)" transform="rotate(-18 45 115)" filter="url(#__ID__-glow)"/>
     <circle cx="190" cy="50" r="10" fill="#E9B872" stroke="#FFF3D6" stroke-width="1.5"/><circle cx="186" cy="46" r="1.5" fill="#8A5A2B"/>
     <rect x="180" y="100" width="26" height="11" rx="5.5" fill="#7DD3FC" transform="rotate(20 193 105)"/>
     <path d="M26 56 q6 -6 12 0" fill="none" stroke="#7DD3FC" stroke-width="1.5" stroke-dasharray="2 3"/>`);

  // 3. Breathing Air: an oxygen tank with bubbles
  ART[3] = art("Oxygen tank with rising bubbles", `<linearGradient id="__ID__-tank" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7FE3FF"/><stop offset=".5" stop-color="#F4FBFF"/><stop offset="1" stop-color="#2C7DB8"/></linearGradient>`,
    `<rect x="98" y="34" width="44" height="98" rx="20" fill="url(#__ID__-tank)" filter="url(#__ID__-glow)"/>
     <rect x="110" y="22" width="20" height="14" rx="3" fill="#8A97AD"/>
     <rect x="104" y="12" width="32" height="8" rx="3" fill="#5C6880"/>
     <rect x="110" y="72" width="20" height="36" rx="4" fill="#34D399" opacity=".85"/>
     <text x="120" y="96" font-family="Verdana, sans-serif" font-size="11" font-weight="700" fill="#052E2B" text-anchor="middle">O2</text>
     <g fill="none" stroke="#7FE3FF" stroke-width="1.6"><circle cx="66" cy="112" r="9"/><circle cx="54" cy="78" r="6"/><circle cx="178" cy="66" r="8"/><circle cx="190" cy="110" r="5"/><circle cx="84" cy="54" r="4"/></g>`);

  // 4. Spacesuits & Equipment: astronaut helmet with a reflective gold visor
  ART[4] = art("Astronaut helmet with a reflective gold visor", `<radialGradient id="__ID__-helmet" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#C9D3E6"/><stop offset="1" stop-color="#5A6883"/></radialGradient>
    <linearGradient id="__ID__-visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A3"/><stop offset=".35" stop-color="#E08A2E"/><stop offset=".7" stop-color="#5B2A0D"/><stop offset="1" stop-color="#FFC45C"/></linearGradient>`,
    `<circle cx="120" cy="80" r="58" fill="none" stroke="#00E5FF" stroke-width="1" opacity=".35" filter="url(#__ID__-glow)"/>
     <circle cx="120" cy="80" r="50" fill="url(#__ID__-helmet)" filter="url(#__ID__-glow)"/>
     <path d="M82 84 Q82 52 120 52 Q158 52 158 84 Q158 108 120 110 Q82 108 82 84Z" fill="url(#__ID__-visor)"/>
     <path d="M92 70 Q104 58 126 60" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/>
     <rect x="96" y="126" width="48" height="12" rx="4" fill="#3B4660"/>
     <rect x="104" y="129" width="8" height="6" fill="#00E5FF"/><rect x="128" y="129" width="8" height="6" fill="#FF7A1A"/>`);

  // 5. Flight Training: a spinning centrifuge arm with a capsule
  ART[5] = art("Centrifuge arm spinning a training capsule", `<linearGradient id="__ID__-arm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00E5FF"/><stop offset="1" stop-color="#FF7A1A"/></linearGradient>`,
    `<circle cx="120" cy="82" r="56" fill="none" stroke="#00E5FF" stroke-width="1.5" stroke-dasharray="4 5" opacity=".6"/>
     <line x1="120" y1="82" x2="176" y2="62" stroke="url(#__ID__-arm)" stroke-width="5" stroke-linecap="round" filter="url(#__ID__-glow)"/>
     <line x1="120" y1="82" x2="64" y2="102" stroke="#5C6880" stroke-width="5" stroke-linecap="round"/>
     <rect x="164" y="50" width="24" height="18" rx="5" fill="#FF7A1A" filter="url(#__ID__-glow)"/>
     <rect x="52" y="94" width="24" height="18" rx="5" fill="#8A97AD"/>
     <circle cx="120" cy="82" r="10" fill="#0B1733" stroke="#00E5FF" stroke-width="2"/>
     <path d="M104 130 Q120 146 136 130" fill="none" stroke="#00E5FF" stroke-width="1.5" stroke-dasharray="2 4"/>`);

  // 6. Microgravity Exercise: a floating dumbbell with motion trails
  ART[6] = art("Floating dumbbell with motion trails", `<linearGradient id="__ID__-weight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB36B"/><stop offset="1" stop-color="#C2410C"/></linearGradient>`,
    `<g transform="rotate(-14 120 80)">
       <rect x="82" y="76" width="76" height="8" rx="4" fill="#B8C4D9"/>
       <rect x="66" y="62" width="22" height="36" rx="6" fill="url(#__ID__-weight)" filter="url(#__ID__-glow)"/>
       <rect x="152" y="62" width="22" height="36" rx="6" fill="url(#__ID__-weight)" filter="url(#__ID__-glow)"/>
     </g>
     <path d="M44 124 Q56 100 80 110" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/>
     <path d="M196 40 Q180 56 200 70" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/>
     <ellipse cx="120" cy="120" rx="90" ry="14" fill="none" stroke="#7FE3FF" stroke-opacity=".3"/>`);

  // 7. Zero-G Sleeping: a crescent moon above a floating sleeping bag
  ART[7] = art("Floating sleeping bag under a crescent moon", `<linearGradient id="__ID__-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#3B1D7A"/></linearGradient>`,
    `<path d="M48 40 A28 28 0 1 0 90 70 A22 22 0 1 1 48 40Z" fill="#FFE9A8" filter="url(#__ID__-glow)"/>
     <g transform="rotate(-8 132 114)">
       <rect x="70" y="96" width="122" height="36" rx="18" fill="url(#__ID__-bag)" filter="url(#__ID__-glow)"/>
       <path d="M90 114 H178" stroke="#C4B5FD" stroke-width="1.5" stroke-dasharray="3 3"/>
     </g>
     <text x="168" y="54" font-family="Verdana, sans-serif" font-size="16" font-weight="700" fill="#A78BFA">z</text>
     <text x="186" y="40" font-family="Verdana, sans-serif" font-size="12" font-weight="700" fill="#C4B5FD">z</text>`);

  // 8. Water Recycling: a droplet inside a cycle of arrows
  ART[8] = art("Water droplet in a recycling loop", `<linearGradient id="__ID__-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BF0FF"/><stop offset="1" stop-color="#0E7AC4"/></linearGradient>`,
    `<circle cx="120" cy="82" r="50" fill="none" stroke="#34D399" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>
     <path d="M120 52 C136 74 146 86 146 98 A26 26 0 0 1 94 98 C94 86 104 74 120 52Z" fill="url(#__ID__-water)" filter="url(#__ID__-glow)"/>
     <path d="M104 96 Q106 110 118 110" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>
     <path d="M170 82 l8 -6 l-2 12z" fill="#34D399"/>
     <path d="M70 82 l-8 6 l2 -12z" fill="#34D399"/>`);

  // 9. Radiation Basics: a glowing radiation trefoil with a shield ring
  ART[9] = art("Glowing radiation symbol inside a protective ring", `<radialGradient id="__ID__-rad" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#FFF3A3"/><stop offset=".6" stop-color="#FFC233"/><stop offset="1" stop-color="#FF7A1A"/></radialGradient>`,
    `<circle cx="120" cy="82" r="66" fill="none" stroke="#FF7A1A" stroke-width="1.5" stroke-dasharray="4 5" opacity=".7"/>
     <g fill="url(#__ID__-rad)" filter="url(#__ID__-glow)">
       <circle cx="120" cy="56" r="22"/><circle cx="142.5" cy="95" r="22"/><circle cx="97.5" cy="95" r="22"/>
     </g>
     <circle cx="120" cy="82" r="13" fill="#02040E"/>`);

  // 10. Heading to Mars: a rocket flying toward the red planet
  ART[10] = art("Rocket flying toward Mars", `${MARS}${FLAME}`,
    `<path d="M46 40 Q92 70 150 96" fill="none" stroke="#00E5FF" stroke-width="1.8" stroke-dasharray="3 5"/>
     <circle cx="184" cy="110" r="30" fill="url(#__ID__-mars)" filter="url(#__ID__-glow)"/>
     <g transform="translate(78 66) rotate(113)">
       <path d="M0 -26 Q12 -10 12 14 L12 20 L-12 20 L-12 14 Q-12 -10 0 -26Z" fill="#E6EEF8"/>
       <circle cx="0" cy="-2" r="5" fill="#00E5FF"/>
       <path d="M-12 8 L-22 20 L-12 20Z M12 8 L22 20 L12 20Z" fill="#FF6A13"/>
       <path d="M-6 20 Q0 40 6 20Z" fill="url(#__ID__-flame)"/>
     </g>`);

  // 11. Rocket Parts: a labelled rocket diagram
  ART[11] = art("Labelled rocket showing nose, window, fins and engine", `${METAL}`,
    `<g filter="url(#__ID__-glow)">
       <path d="M120 22 Q140 40 140 62 L100 62 Q100 40 120 22Z" fill="#FF5C7A"/>
       <rect x="100" y="62" width="40" height="58" rx="6" fill="url(#__ID__-metal)"/>
       <circle cx="120" cy="80" r="8" fill="#0B1733" stroke="#00E5FF" stroke-width="2"/>
       <path d="M100 88 L84 110 L100 110Z M140 88 L156 110 L140 110Z" fill="#FF7A1A"/>
       <path d="M106 120 L134 120 L128 134 L112 134Z" fill="#3B4660"/>
     </g>
     <g stroke="#00E5FF" stroke-width="1" fill="none"><path d="M140 50 L172 36"/><path d="M140 80 L166 80"/><path d="M118 130 L172 140"/></g>
     <g font-family="Verdana, sans-serif" font-size="9" font-weight="700" fill="#7FE3FF"><text x="176" y="34">NOSE</text><text x="170" y="76">WINDOW</text><text x="176" y="144">ENGINE</text></g>`);

  // 12. Rocket Launch: a rocket lifting off a pad with flame and smoke
  ART[12] = art("Rocket lifting off with flame and smoke", `${FLAME}`,
    `<path d="M120 14 Q136 34 136 66 L104 66 Q104 34 120 14Z" fill="#E6EEF8" filter="url(#__ID__-glow)"/>
     <rect x="104" y="66" width="32" height="44" rx="4" fill="#C9D3E6"/>
     <path d="M104 92 L90 110 L104 110Z M136 92 L150 110 L136 110Z" fill="#FF5C7A"/>
     <path d="M108 110 Q120 152 132 110Z" fill="url(#__ID__-flame)" filter="url(#__ID__-glow)"/>
     <g fill="#D6DEEA" opacity=".55"><ellipse cx="96" cy="140" rx="22" ry="8"/><ellipse cx="144" cy="140" rx="24" ry="9"/><ellipse cx="120" cy="146" rx="30" ry="7"/></g>
     <rect x="40" y="130" width="160" height="4" fill="#5C6880"/>`);

  // 13. Getting into Orbit: a satellite circling Earth
  ART[13] = art("Satellite on an orbit path around Earth", `${EARTH}`,
    `<circle cx="120" cy="172" r="84" fill="url(#__ID__-earth)" filter="url(#__ID__-glow)"/>
     <path d="M76 150 q12 -8 24 -2 q6 10 -4 18 q-14 2 -20 -16z" fill="#4CD08A" opacity=".8"/>
     <path d="M140 136 q14 -6 28 4 q-6 10 -18 8 q-12 -2 -10 -12z" fill="#4CD08A" opacity=".8"/>
     <ellipse cx="120" cy="112" rx="98" ry="26" fill="none" stroke="#FFB36B" stroke-width="1.5" stroke-dasharray="4 4"/>
     <rect x="202" y="96" width="8" height="8" fill="#E6EEF8"/>
     <rect x="194" y="98" width="7" height="4" fill="#00E5FF"/><rect x="211" y="98" width="7" height="4" fill="#00E5FF"/>`);

  // 14. Mars Rovers: six-wheeled rover on red dust (Simulation 2)
  ART[14] = art("Six-wheeled Mars rover on red dust", `${METAL}
    <linearGradient id="__ID__-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B2A14"/><stop offset="1" stop-color="#C4502A"/></linearGradient>
    <linearGradient id="__ID__-dust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0643A"/><stop offset="1" stop-color="#7A2A14"/></linearGradient>`,
    `<rect width="240" height="160" fill="url(#__ID__-sky)" opacity=".5"/>
     <circle cx="196" cy="34" r="10" fill="#FFD29A" opacity=".9" filter="url(#__ID__-glow)"/>
     <path d="M0 118 Q60 98 120 112 T240 108 V160 H0Z" fill="url(#__ID__-dust)"/>
     <circle cx="96" cy="104" r="10" fill="#1E222C"/><circle cx="124" cy="104" r="10" fill="#1E222C"/><circle cx="152" cy="104" r="10" fill="#1E222C"/>
     <rect x="82" y="84" width="76" height="20" rx="4" fill="url(#__ID__-metal)"/>
     <rect x="92" y="66" width="48" height="16" rx="2" fill="#1E3A8A" transform="rotate(-6 116 74)"/>
     <path d="M100 66 V82 M108 65 V81 M116 64 V80 M124 63 V79 M132 62 V78" stroke="#7FB8FF" stroke-width=".8" transform="rotate(-6 116 74)"/>
     <path d="M148 84 L152 56 L160 56" fill="none" stroke="#C9D3E6" stroke-width="3"/>
     <rect x="152" y="46" width="12" height="10" rx="2" fill="#00E5FF" filter="url(#__ID__-glow)"/>
     <circle cx="90" cy="114" r="10" fill="#2B2F3A"/><circle cx="120" cy="114" r="10" fill="#2B2F3A"/><circle cx="150" cy="114" r="10" fill="#2B2F3A"/>
     <circle cx="90" cy="114" r="3" fill="#FF7A1A"/><circle cx="120" cy="114" r="3" fill="#FF7A1A"/><circle cx="150" cy="114" r="3" fill="#FF7A1A"/>`);

  // 15. Deep Space Probes: a probe with a dish drifting outward
  ART[15] = art("Deep space probe with a dish antenna", `${METAL}`,
    `<path d="M10 120 Q60 96 100 84" fill="none" stroke="#00E5FF" stroke-width="1.5" stroke-dasharray="2 5" opacity=".7"/>
     <rect x="100" y="70" width="34" height="22" rx="4" fill="url(#__ID__-metal)" filter="url(#__ID__-glow)"/>
     <line x1="134" y1="81" x2="156" y2="81" stroke="#C9D3E6" stroke-width="2"/>
     <path d="M156 64 Q184 80 156 98Z" fill="#E6EEF8" stroke="#7FE3FF" stroke-width="1.5"/>
     <circle cx="106" cy="81" r="3" fill="#FF7A1A"/>
     <path d="M100 70 L84 56 M100 92 L84 106" stroke="#8A97AD" stroke-width="2"/>
     <rect x="72" y="50" width="12" height="8" fill="#1E6FD9"/><rect x="72" y="106" width="12" height="8" fill="#1E6FD9"/>`);

  // 16. Antennas & Waves: a dish sending radio waves
  ART[16] = art("Dish antenna sending radio waves", `<linearGradient id="__ID__-dish" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#7FB8FF"/></linearGradient>`,
    `<path d="M70 56 Q118 76 70 96 Z" fill="url(#__ID__-dish)" filter="url(#__ID__-glow)"/>
     <line x1="70" y1="76" x2="106" y2="76" stroke="#C9D3E6" stroke-width="2"/>
     <circle cx="108" cy="76" r="3" fill="#FF7A1A"/>
     <line x1="70" y1="96" x2="70" y2="132" stroke="#8A97AD" stroke-width="3"/>
     <line x1="56" y1="132" x2="84" y2="132" stroke="#8A97AD" stroke-width="3"/>
     <g fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round">
       <path d="M120 60 A18 18 0 0 1 120 92" opacity=".95"/>
       <path d="M134 50 A30 30 0 0 1 134 102" opacity=".6"/>
       <path d="M150 40 A44 44 0 0 1 150 112" opacity=".3"/>
     </g>`);

  // 17. Safe Landing: a lander under a parachute
  ART[17] = art("Lander under a parachute touching down", `<linearGradient id="__ID__-chute" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF7A1A"/><stop offset=".5" stop-color="#FFF3A3"/><stop offset="1" stop-color="#FF7A1A"/></linearGradient>${METAL}${FLAME}`,
    `<path d="M70 58 Q120 16 170 58 Q120 44 70 58Z" fill="url(#__ID__-chute)" filter="url(#__ID__-glow)"/>
     <path d="M70 58 L110 92 M170 58 L130 92 M120 30 L110 92 M120 30 L130 92" stroke="#FFD29A" stroke-width="1" opacity=".8"/>
     <path d="M106 92 L134 92 L130 106 L110 106Z" fill="url(#__ID__-metal)"/>
     <path d="M108 106 L98 124 M132 106 L142 124 M120 106 L120 122" stroke="#C9D3E6" stroke-width="2"/>
     <path d="M110 108 Q120 130 130 108Z" fill="url(#__ID__-flame)"/>
     <path d="M0 136 Q60 128 120 134 T240 130 V160 H0Z" fill="#5C6880"/>`);

  // 18. Space Batteries: solar wings feeding a battery with a bolt
  ART[18] = art("Solar wings charging a glowing battery", `<linearGradient id="__ID__-panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E6FD9"/><stop offset="1" stop-color="#0A2360"/></linearGradient>
    <linearGradient id="__ID__-batt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3A3"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>`,
    `<path d="M24 70 L92 56 L92 110 L24 102Z" fill="url(#__ID__-panel)" stroke="#7FE3FF" stroke-width="1"/>
     <path d="M148 56 L216 70 L216 102 L148 110Z" fill="url(#__ID__-panel)" stroke="#7FE3FF" stroke-width="1"/>
     <path d="M40 76 L86 68 M40 88 L86 80 M40 100 L86 92 M164 68 L210 76 M164 80 L210 88 M164 92 L210 100" stroke="#7FE3FF" stroke-width=".8" opacity=".7"/>
     <rect x="104" y="48" width="32" height="64" rx="5" fill="#2A3350" stroke="#C9D3E6" stroke-width="1.5"/>
     <rect x="116" y="42" width="8" height="6" rx="1" fill="#C9D3E6"/>
     <path d="M124 60 L110 86 L120 86 L114 104 L134 78 L124 78Z" fill="url(#__ID__-batt)" filter="url(#__ID__-glow)"/>`);

  // 19. Space Docking: two spacecraft closing on a glowing docking ring
  ART[19] = art("Two spacecraft meeting at a glowing docking ring", `${METAL}<linearGradient id="__ID__-blue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1E6FD9"/><stop offset="1" stop-color="#7FE3FF"/></linearGradient>`,
    `<rect x="30" y="66" width="80" height="28" rx="14" fill="url(#__ID__-metal)"/>
     <rect x="130" y="66" width="80" height="28" rx="14" fill="url(#__ID__-metal)"/>
     <rect x="48" y="110" width="50" height="6" fill="url(#__ID__-blue)"/>
     <rect x="142" y="44" width="50" height="6" fill="url(#__ID__-blue)"/>
     <circle cx="120" cy="80" r="18" fill="none" stroke="#00E5FF" stroke-width="3" stroke-dasharray="4 4" filter="url(#__ID__-glow)"/>
     <path d="M96 40 L110 52 M144 40 L130 52" stroke="#FFB36B" stroke-width="1.6" stroke-dasharray="3 3"/>`);

  // 20. Giant Robotic Arms: a jointed arm reaching for a satellite
  ART[20] = art("Jointed robotic arm reaching for a satellite", `${METAL}`,
    `<rect x="18" y="116" width="36" height="22" rx="4" fill="#3B4660"/>
     <path d="M36 116 L92 84 L134 52 L168 66" fill="none" stroke="url(#__ID__-metal)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#__ID__-glow)"/>
     <g fill="#FFB36B"><circle cx="92" cy="84" r="6"/><circle cx="134" cy="52" r="6"/><circle cx="168" cy="66" r="6"/></g>
     <path d="M160 66 L172 56 M160 66 L176 74" stroke="#FFB36B" stroke-width="3" stroke-linecap="round"/>
     <rect x="186" y="46" width="46" height="30" rx="4" fill="#2A3350" stroke="#C9D3E6"/>
     <rect x="186" y="26" width="46" height="10" fill="#1E6FD9"/><rect x="186" y="80" width="46" height="8" fill="#1E6FD9"/>`);

  // 21. Asteroid Hunting: a rocky asteroid inside a targeting reticle
  ART[21] = art("Asteroid inside a targeting reticle", `<radialGradient id="__ID__-rock" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#C9D3E6"/><stop offset=".6" stop-color="#7A8294"/><stop offset="1" stop-color="#2B3040"/></radialGradient>`,
    `<circle cx="120" cy="82" r="48" fill="none" stroke="#FF7A1A" stroke-width="1.5" stroke-dasharray="6 6"/>
     <path d="M120 26 V46 M120 118 V138 M64 82 H84 M156 82 H176" stroke="#FF7A1A" stroke-width="2"/>
     <path d="M92 66 L110 54 L132 60 L144 78 L138 98 L116 108 L96 100 L86 84Z" fill="url(#__ID__-rock)" filter="url(#__ID__-glow)"/>
     <circle cx="112" cy="82" r="6" fill="#4B5263" opacity=".8"/><circle cx="128" cy="92" r="4" fill="#4B5263" opacity=".8"/>
     <circle cx="200" cy="30" r="2" fill="#FFB36B"/><circle cx="190" cy="40" r="1.5" fill="#FFB36B"/>`);

  // 22. Earth's Shield: magnetic field lines deflecting solar particles
  ART[22] = art("Earth wrapped in magnetic field lines", `${EARTH}<radialGradient id="__ID__-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3A3"/><stop offset=".6" stop-color="#FFB13B"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient>`,
    `<circle cx="206" cy="30" r="22" fill="url(#__ID__-sun)" filter="url(#__ID__-glow)"/>
     <circle cx="120" cy="120" r="46" fill="url(#__ID__-earth)" filter="url(#__ID__-glow)"/>
     <path d="M30 120 C40 40 200 40 210 120" fill="none" stroke="#7FE3FF" stroke-width="1.6" opacity=".9"/>
     <path d="M46 120 C56 58 184 58 194 120" fill="none" stroke="#7FE3FF" stroke-width="1.2" opacity=".6"/>
     <path d="M28 124 C36 150 204 150 212 124" fill="none" stroke="#7FE3FF" stroke-width="1.6" opacity=".9"/>
     <path d="M170 46 l16 -10 M182 60 l20 -4 M30 40 l-14 -6" stroke="#FFB13B" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/>`);

  // 23. Wild Solar Weather: a flaring Sun with loops and particles
  ART[23] = art("Sun with flare loops and streaming particles", `${SUN_CORE}<linearGradient id="__ID__-loop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FFF3A3"/></linearGradient>`,
    `<circle cx="60" cy="90" r="50" fill="url(#__ID__-sun)" filter="url(#__ID__-glow)"/>
     <path d="M92 70 C120 20 170 26 166 58" fill="none" stroke="url(#__ID__-loop)" stroke-width="4" stroke-linecap="round" filter="url(#__ID__-glow)"/>
     <path d="M96 110 C124 146 176 140 172 112" fill="none" stroke="url(#__ID__-loop)" stroke-width="3" stroke-linecap="round"/>
     <g fill="#7FE3FF"><circle cx="150" cy="40" r="2"/><circle cx="184" cy="78" r="1.6"/><circle cx="200" cy="112" r="2"/><circle cx="168" cy="132" r="1.5"/><circle cx="214" cy="48" r="1.4"/></g>
     <path d="M120 90 H232" stroke="#7FE3FF" stroke-width="1" stroke-dasharray="2 6" opacity=".7"/>`);

  // 24. Lunar Bases: a glass dome base on the Moon with Earth overhead
  ART[24] = art("Glass dome base on the Moon with Earth in the sky", `<radialGradient id="__ID__-moon" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#F4F6FA"/><stop offset=".6" stop-color="#9AA3B5"/><stop offset="1" stop-color="#3A4256"/></radialGradient>
    <linearGradient id="__ID__-dome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FE3FF" stop-opacity=".9"/><stop offset="1" stop-color="#1E6FD9" stop-opacity=".6"/></linearGradient>`,
    `<circle cx="120" cy="230" r="120" fill="url(#__ID__-moon)"/>
     <circle cx="70" cy="136" r="8" fill="#6B7487" opacity=".6"/><circle cx="168" cy="144" r="12" fill="#6B7487" opacity=".5"/><circle cx="140" cy="128" r="4" fill="#6B7487" opacity=".5"/>
     <path d="M92 130 A28 28 0 0 1 148 130 Z" fill="url(#__ID__-dome)" filter="url(#__ID__-glow)"/>
     <rect x="84" y="128" width="72" height="8" rx="2" fill="#C9D3E6"/>
     <rect x="100" y="112" width="6" height="6" fill="#FFF3A3"/><rect x="128" y="112" width="6" height="6" fill="#FFF3A3"/>
     <circle cx="200" cy="34" r="12" fill="#1E6FD9"/><path d="M194 30 q6 -4 12 2 q-2 6 -8 6 q-6 -2 -4 -8z" fill="#4CD08A" opacity=".8"/>`);

  // 25. Exoplanet Search: a star dimming as a planet passes in front
  ART[25] = art("Star with a planet and a light curve dipping", `<radialGradient id="__ID__-star" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#FFE38A"/><stop offset="1" stop-color="#FF9A2E" stop-opacity="0"/></radialGradient>`,
    `<circle cx="84" cy="72" r="46" fill="url(#__ID__-star)"/>
     <circle cx="84" cy="72" r="22" fill="#FFE38A" filter="url(#__ID__-glow)"/>
     <ellipse cx="84" cy="72" rx="62" ry="16" fill="none" stroke="#7FE3FF" stroke-width="1" stroke-dasharray="3 4" opacity=".6" transform="rotate(-10 84 72)"/>
     <circle cx="140" cy="58" r="5" fill="#0B1733" stroke="#7FE3FF" stroke-width="1"/>
     <path d="M20 124 H110 Q122 146 134 124 H220" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linejoin="round" filter="url(#__ID__-glow)"/>`);

  // 26. Giant Space Telescopes: gold honeycomb mirror over a blue sunshield
  ART[26] = art("Gold honeycomb telescope mirror above a sunshield", `${GOLD}<linearGradient id="__ID__-shield" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#3B82F6"/></linearGradient>
    <path id="__ID__-hex" d="M0 -15 L12.99 -7.5 L12.99 7.5 L0 15 L-12.99 7.5 L-12.99 -7.5Z"/>`,
    `<circle cx="120" cy="70" r="46" fill="none" stroke="#FFE38A" stroke-opacity=".3" stroke-width="6" filter="url(#__ID__-glow)"/>
     <path d="M50 110 L190 110 L210 136 L30 136Z" fill="url(#__ID__-shield)" filter="url(#__ID__-glow)"/>
     <path d="M120 92 L120 110 M96 100 L110 110 M144 100 L130 110" stroke="#C9D3E6" stroke-width="2"/>
     <g fill="url(#__ID__-gold)" stroke="#5C3A08" stroke-width="1">
       <use href="#__ID__-hex" x="120" y="70"/>
       <use href="#__ID__-hex" x="120" y="47.5"/>
       <use href="#__ID__-hex" x="120" y="92.5"/>
       <use href="#__ID__-hex" x="145.98" y="81.25"/>
       <use href="#__ID__-hex" x="145.98" y="58.75"/>
       <use href="#__ID__-hex" x="94.02" y="81.25"/>
       <use href="#__ID__-hex" x="94.02" y="58.75"/>
     </g>`);

  // 27. Meet our Sun: a bright star with corona rays and a prominence
  ART[27] = art("Bright Sun with corona rays and a red prominence", `<radialGradient id="__ID__-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FFE38A"/><stop offset=".85" stop-color="#FF9A2E"/><stop offset="1" stop-color="#FF7A1A"/></radialGradient>`,
    `<g stroke="#FFD27A" stroke-width="1.6" stroke-linecap="round" opacity=".7" filter="url(#__ID__-glow)">
       <path d="M120 36 V18"/><path d="M120 124 V142"/><path d="M68 90 H50"/><path d="M172 90 H190"/>
       <path d="M86 56 L74 44"/><path d="M154 56 L166 44"/><path d="M86 124 L74 136"/><path d="M154 124 L166 136"/>
     </g>
     <circle cx="120" cy="80" r="46" fill="url(#__ID__-sun)" filter="url(#__ID__-glow)"/>
     <path d="M150 42 Q180 30 172 58" fill="none" stroke="#FF5C7A" stroke-width="4" stroke-linecap="round" opacity=".85"/>
     <circle cx="104" cy="70" r="5" fill="#FF7A1A" opacity=".25"/><circle cx="130" cy="98" r="7" fill="#FF7A1A" opacity=".2"/>`);

  // 28. Black Hole Gravity: a swirling accretion disk around a black hole (required)
  ART[28] = art("Black hole with a swirling glowing accretion disk", `<linearGradient id="__ID__-disk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B26BFF"/><stop offset=".5" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FFE38A"/></linearGradient>
    <radialGradient id="__ID__-halo" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#FFB13B" stop-opacity="0"/><stop offset=".78" stop-color="#FF7A1A" stop-opacity=".5"/><stop offset="1" stop-color="#B26BFF" stop-opacity="0"/></radialGradient>`,
    `<circle cx="120" cy="80" r="74" fill="url(#__ID__-halo)"/>
     <path d="M34 80 A86 24 0 0 1 206 80" fill="none" stroke="url(#__ID__-disk)" stroke-width="12" stroke-linecap="round" opacity=".85" filter="url(#__ID__-glow)"/>
     <circle cx="120" cy="80" r="26" fill="#000000"/>
     <circle cx="120" cy="80" r="29" fill="none" stroke="#FFE38A" stroke-width="2" opacity=".8" filter="url(#__ID__-glow)"/>
     <path d="M34 80 A86 24 0 0 0 206 80" fill="none" stroke="url(#__ID__-disk)" stroke-width="12" stroke-linecap="round" filter="url(#__ID__-glow)"/>
     <path d="M60 52 Q120 20 180 52" fill="none" stroke="#7FE3FF" stroke-width="1" stroke-dasharray="2 4" opacity=".6"/>`);

  // 29. Spiral Galaxies: two glowing arms wound around a bright core
  ART[29] = art("Spiral galaxy with glowing arms", `<radialGradient id="__ID__-core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#FFE38A"/><stop offset="1" stop-color="#FFE38A" stop-opacity="0"/></radialGradient>
    <linearGradient id="__ID__-arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset="1" stop-color="#B26BFF"/></linearGradient>`,
    `<g fill="none" stroke="url(#__ID__-arm)" stroke-width="5" stroke-linecap="round" opacity=".85" filter="url(#__ID__-glow)">
       <path d="M120 80 C150 50 200 52 206 82 C212 112 170 118 160 98"/>
       <path d="M120 80 C90 110 40 108 34 78 C28 48 70 42 80 62"/>
     </g>
     <circle cx="120" cy="80" r="34" fill="url(#__ID__-core)"/>
     <circle cx="120" cy="80" r="9" fill="#FFFFFF" filter="url(#__ID__-glow)"/>
     <g fill="#FFFFFF"><circle cx="176" cy="62" r="1.6"/><circle cx="196" cy="96" r="1.6"/><circle cx="150" cy="108" r="1.4"/><circle cx="60" cy="62" r="1.6"/><circle cx="44" cy="96" r="1.4"/><circle cx="92" cy="108" r="1.6"/></g>`);

  // 30. The Mystery of Dark Matter: an invisible halo around a bright galaxy
  ART[30] = art("Bright galaxy inside a faint invisible halo with a question mark", `<radialGradient id="__ID__-halo" cx="50%" cy="50%" r="50%"><stop offset=".5" stop-color="#B26BFF" stop-opacity="0"/><stop offset=".85" stop-color="#B26BFF" stop-opacity=".35"/><stop offset="1" stop-color="#B26BFF" stop-opacity="0"/></radialGradient>`,
    `<circle cx="120" cy="80" r="72" fill="url(#__ID__-halo)"/>
     <circle cx="120" cy="80" r="58" fill="none" stroke="#B26BFF" stroke-width="1.5" stroke-dasharray="3 6" opacity=".8"/>
     <circle cx="120" cy="80" r="14" fill="#FFE38A" filter="url(#__ID__-glow)"/>
     <ellipse cx="120" cy="80" rx="34" ry="12" fill="none" stroke="#7FE3FF" stroke-width="1.5" opacity=".7" transform="rotate(-20 120 80)"/>
     <text x="196" y="50" text-anchor="middle" font-family="Verdana, sans-serif" font-size="26" font-weight="700" fill="#E0C7FF" opacity=".7" filter="url(#__ID__-glow)">?</text>`);

  window.ZGA_ART = Object.freeze(ART);
})();
