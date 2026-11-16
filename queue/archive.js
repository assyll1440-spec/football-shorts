// «Архив Тайн» — cinematic scene library (vertical). ANIM fn(u, d, t, s) -> SVG string.
function ship(x, y, s, t, o = {}) {
  const roll = Math.sin(t * 0.9) * 2.2 * (o.still ? 0 : 1), bob = Math.sin(t * 1.3) * 6 * (o.still ? 0 : 1);
  return `<g transform="translate(${x} ${y + bob}) rotate(${roll}) scale(${s})">
   <defs>${grad('hull', [[0, '#3b2a1e'], [1, '#120c08']])}${grad('sail', [[0, o.sailc || '#cfc6ad'], [1, '#6f6a5c']], false)}</defs>
   <path d="M-330 0 L330 0 Q 300 70 240 110 L-250 110 Q -310 70 -330 0 Z" fill="url(#hull)"/>
   <rect x="-160" y="-430" width="12" height="430" fill="#1d140e"/><rect x="90" y="-390" width="12" height="390" fill="#1d140e"/>
   <line x1="-330" y1="-10" x2="-154" y2="-430" stroke="#1d140e" stroke-width="3"/><line x1="330" y1="-10" x2="96" y2="-390" stroke="#1d140e" stroke-width="3"/>
   ${o.bare ? '' : `<path d="M-148 -410 Q -40 -330 -148 -250 Z" fill="url(#sail)" opacity=".9"/><path d="M-148 -230 Q -20 -150 -148 -60 Z" fill="url(#sail)" opacity=".8"/>
   <path d="M102 -370 Q 190 -300 102 -230 Z" fill="url(#sail)" opacity=".75"/><path d="M102 -210 Q 200 -140 102 -60 Z" fill="url(#sail)" opacity=".7"/>`}
   ${o.lamp ? `<circle cx="250" cy="-30" r="9" fill="#ffcf7a" filter="url(#glow)"/>` : ''}</g>`;
}
function mountains(y, col1, col2, seed, amp = 380, snow = true) {
  const r = rnd(seed); let pts = [[-100, y]], x = -100;
  while (x < 1180) { x += 120 + r() * 160; pts.push([x, y - amp * (.4 + r() * .6)]); x += 80 + r() * 120; pts.push([x, y - amp * r() * .35]); }
  let d = 'M' + pts.map(p => p.join(' ')).join(' L') + ` L1180 ${y} L1180 2100 L-100 2100 Z`;
  let g = `<defs>${grad('mt' + seed, [[0, col1], [1, col2]])}</defs><path d="${d}" fill="url(#mt${seed})"/>`;
  if (snow) pts.forEach((p, i) => { if (i % 2 === 1 && p[1] < y - amp * .5) g += `<path d="M${p[0] - 70} ${p[1] + 80} L${p[0]} ${p[1]} L${p[0] + 70} ${p[1] + 80} L${p[0] + 30} ${p[1] + 60} L${p[0]} ${p[1] + 90} L${p[0] - 30} ${p[1] + 62} Z" fill="#e8eef6" opacity=".85"/>`; });
  return g;
}
function pines(y, n, seed, col, h = 260, spread = 1180) {
  const r = rnd(seed); let g = '';
  for (let i = 0; i < n; i++) { const x = -60 + r() * spread, s = (.6 + r() * .6) * h; g += `<polygon points="${x - s * .22},${y} ${x},${y - s} ${x + s * .22},${y}" fill="${col}"/>`; }
  return g;
}
function tent(x, y, s, cut, t) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><defs>${grad('tnt', [[0, '#7b8c64'], [1, '#3c4a30']])}</defs>
   <ellipse cx="0" cy="8" rx="300" ry="34" fill="#000" opacity=".35"/>
   <polygon points="-260,0 0,-230 260,0" fill="url(#tnt)"/><polygon points="-40,0 0,-120 40,0" fill="#141a10"/>
   ${cut ? `<path d="M120 -150 L150 -90 L130 -40 L160 0" stroke="#0a0d08" stroke-width="16" fill="none"/><path d="M120 -150 L150 -90 L130 -40 L160 0" stroke="#e5484d" stroke-width="3" fill="none" opacity="${.5 + .5 * Math.sin(t * 4)}"/>` : ''}
   <path d="M-260 0 Q -100 -20 0 -6 Q 120 -24 260 0 L260 14 L-260 14 Z" fill="#e8eef6"/></g>`;
}
function person(x, y, s, col) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-118" r="24" fill="#d9b08c"/>
   <rect x="-28" y="-92" width="56" height="80" rx="18" fill="${col}"/><rect x="-24" y="-16" width="18" height="46" fill="#1d2430"/><rect x="6" y="-16" width="18" height="46" fill="#1d2430"/></g>`;
}
function endCard(u, t, title, sub) {
  let g = sky('ske', '#030305', '#0d0b0a', '#1a140e') + glowOrb(540, 900, 700, ACC, .18) + particles(70, 77, t, 'dust', '#f0c27a');
  const a = ease(u * 1.2);
  g += `<g opacity="${a}"><text x="540" y="880" text-anchor="middle" font-family="Disp" font-size="96" fill="#fff" filter="url(#glow)">${title}</text>
        <text x="540" y="980" text-anchor="middle" font-family="Disp" font-size="96" fill="${ACC}">${sub}</text></g>`;
  const p = .7 + .3 * Math.sin(t * 4);
  g += `<g opacity="${ease((u - .6) * 2)}" transform="translate(540 1180) scale(${p * .1 + .95})"><rect x="-260" y="-56" width="520" height="112" rx="56" fill="#c0392b"/>
        <text y="18" text-anchor="middle" font-family="Mont" font-weight="800" font-size="40" fill="#fff">ПОДПИСАТЬСЯ</text></g>`;
  return g + post(t, '#1a0e04', .1);
}

const ANIM = {
  // ---------- Перевал Дятлова ----------
  dy_night(u, d, t) {
    let g = sky('dy1', '#02040a', '#0d1a2c', '#2a3b52') + stars(160, 3, t, 1000) + glowOrb(780, 700, 300, '#bcd4ff', .3);
    g += mountains(1250, '#3a4a5e', '#141c26', 4, 520) + fog(1150, t, '#9fb0c2', .3, 10, 2);
    g += `<rect x="-100" y="1240" width="1280" height="800" fill="#d6dfea"/>` + pines(1300, 14, 5, '#0d1510', 200);
    g += tent(540, 1420, 1.0, false, t) + glowOrb(540, 1380, 220, '#ffc070', .35);
    g += particles(220, 6, t, 'snow', '#ffffff');
    return cam(g, u, d, 1.0, 1.1, 0, 40) + post(t, '#081428', .15);
  },
  dy_tent(u, d, t) {
    let g = sky('dy2', '#05070c', '#141c28', '#202a38') + fog(900, t, '#8a9ab0', .35, 15, 8, 300);
    g += `<rect x="-100" y="1250" width="1280" height="800" fill="#c9d3df"/>` + tent(540, 1330, 1.6, true, t);
    const sw = Math.sin(t * .9) * 14;
    g += `<g opacity=".55" filter="url(#blur8)"><polygon points="${120 + sw * 4},1700 ${720 + sw * 10},1050 ${900 + sw * 10},1180" fill="#fff6d8"/></g>`;
    g += particles(260, 9, t, 'snow', '#fff');
    return cam(g, u, d, 1.15, 1.0, 0, -30) + post(t, '#0a1424', .18);
  },
  dy_steps(u, d, t) {
    let g = sky('dy3', '#04060b', '#101a28', '#23324a') + stars(60, 13, t, 600);
    g += pines(1050, 40, 14, '#070b08', 380, 1180) + `<path d="M-100 1040 Q 540 980 1180 1060 V2100 H-100 Z" fill="#d0d9e4"/>`;
    const k = ease(u / d);
    for (let i = 0; i < 12; i++) { const yy = 1880 - i * 70, xx = 540 + Math.sin(i * .7) * 50 + (i % 2 ? 26 : -26), a = cl(k * 14 - i);
      g += `<ellipse cx="${xx}" cy="${yy}" rx="${22 - i}" ry="${36 - i * 1.6}" fill="#7f90a4" opacity="${a * .9}"/>`; }
    g += `<text x="880" y="760" text-anchor="middle" font-family="Disp" font-size="110" fill="#8fd3ff" opacity="${ease(u - .5)}" filter="url(#glow)">−30°</text>`;
    g += particles(200, 17, t, 'snow', '#fff') + fog(1100, t, '#b0c0d0', .3, 22, 3);
    return cam(g, u, d, 1.0, 1.12, 0, -60) + post(t, '#081428', .2);
  },
  dy_slab(u, d, t) {
    let g = sky('dy4', '#03050a', '#0f1a2a', '#26364c') + stars(80, 21, t, 700);
    g += `<defs>${grad('slope', [[0, '#e6edf5'], [1, '#9fb0c4']])}</defs><polygon points="-100,1650 1180,700 1180,2100 -100,2100" fill="url(#slope)"/>`;
    const k = ease((u - .4) / 1.6);
    g += `<path d="M180 ${1500} L${180 + 700 * k} ${1500 - 520 * k}" stroke="#2a3a4e" stroke-width="7" fill="none"/>`;
    g += `<g transform="translate(${-30 * k} ${40 * k})"><polygon points="200,1530 860,1040 900,1090 240,1580" fill="#f6f9fc" opacity=".95"/></g>`;
    g += tent(330, 1600, .5, false, t) + particles(120, 23, t, 'snow', '#fff');
    if (u > 1.4 && u < 1.6) g += `<rect width="1080" height="1920" fill="#fff" opacity=".25"/>`;
    return cam(g, u, d, 1.0, 1.08, 30, 0) + post(t, '#081428', .15);
  },
  dy_end(u, d, t) { return endCard(u, t, 'ПЕРЕВАЛ ДЯТЛОВА', 'ТАЙНА ЖИВА'); },

  // ---------- Роанок ----------
  ro_colony(u, d, t) {
    let g = sky('ro1', '#f6c48a', '#e8a46a', '#7a5a4a') + glowOrb(540, 1000, 500, '#ffe2a8', .7) + rays(540, 1000, t, '#fff0c8', .12, 9, 140);
    g += pines(1150, 30, 31, '#2a3a26', 420) + `<rect x="-100" y="1140" width="1280" height="900" fill="#3d5a2e"/>`;
    for (let i = 0; i < 6; i++) { const x = 140 + i * 160, y = 1230 + (i % 2) * 60;
      g += `<g transform="translate(${x} ${y})"><rect x="-60" y="-60" width="120" height="70" fill="#7a5238"/><polygon points="-75,-60 0,-120 75,-60" fill="#4a2f25"/><rect x="-14" y="-30" width="28" height="40" fill="#ffcf7a" opacity="${.6 + .4 * Math.sin(t * 3 + i)}"/>
            <path d="M30 -110 q 10 -40 -6 -80" stroke="#c8c0b8" stroke-width="10" fill="none" opacity=".35" filter="url(#blur8)"/></g>`; }
    for (let i = 0; i < 26; i++) g += `<rect x="${-80 + i * 46}" y="1330" width="34" height="140" rx="6" fill="#5a3b26"/>`;
    g += particles(50, 33, t, 'dust', '#fff2c0');
    return cam(g, u, d, 1.0, 1.1, 0, 20) + post(t, '#3a1a00', .08);
  },
  ro_sail(u, d, t) {
    let g = sky('ro2', '#1d2a3a', '#5a6e82', '#c9b08e') + glowOrb(800, 1050, 380, '#ffd9a0', .55);
    const k = ease(u / d);
    g += ship(lerp(420, 860, k), 1150, lerp(.75, .35, k), t) + sea(1170, t, '#3b5468', '#0c1620', '#e8d2b0', 12);
    g += fog(1150, t, '#d8c8b0', .25, 15, 4);
    return cam(g, u, d, 1.0, 1.06) + post(t, '#2a1a08', .1);
  },
  ro_empty(u, d, t) {
    let g = sky('ro3', '#b8c0c4', '#8a9498', '#4a5450') + pines(1100, 30, 35, '#2a3428', 380);
    g += `<rect x="-100" y="1100" width="1280" height="900" fill="#4a5a40"/>`;
    for (let i = 0; i < 6; i++) { const x = 140 + i * 160, y = 1230 + (i % 2) * 60;
      g += `<g transform="translate(${x} ${y})" opacity=".85"><rect x="-60" y="-60" width="120" height="70" fill="#5a4030"/><polygon points="-75,-60 0,-120 75,-60" fill="#3a2a20"/><rect x="-14" y="-30" width="28" height="40" fill="#0a0a0a"/></g>`; }
    g += fog(1200, t, '#dfe6e8', .55, 18, 36, 300) + fog(1450, t + 4, '#eef2f4', .4, 26, 37);
    return cam(g, u, d, 1.08, 1.0, 0, -10) + post(t, '#1a2020', .15);
  },
  ro_post(u, d, t) {
    let g = sky('ro4', '#0e1410', '#1e2a20', '#2a3626') + pines(1300, 24, 41, '#0b100c', 520);
    g += rays(700, -100, t, '#f8e6b0', .25, 6, 30) + `<rect x="-100" y="1400" width="1280" height="700" fill="#1c2618"/>`;
    g += `<defs>${grad('wood', [[0, '#7a5434'], [.5, '#a8784c'], [1, '#5a3a22']], false)}</defs><rect x="430" y="300" width="220" height="1400" fill="url(#wood)"/>`;
    for (let i = 0; i < 10; i++) g += `<line x1="${440 + i * 21}" y1="300" x2="${445 + i * 21}" y2="1700" stroke="#4a301c" stroke-width="2" opacity=".5"/>`;
    const k = cl((u - .3) / 1.8), word = 'CROATOAN';
    word.split('').forEach((c, i) => { if (k * 8 > i) g += `<text x="540" y="${520 + i * 120}" text-anchor="middle" font-family="Disp" font-size="110" fill="#2a1a0e">${c}</text>`; });
    g += particles(60, 43, t, 'dust', '#ffe8b0');
    return cam(g, u, d, 1.15, 1.0, 0, 0) + post(t, '#1a1004', .12);
  },
  ro_end(u, d, t) { return endCard(u, t, 'КОЛОНИЯ РОАНОК', 'КУДА ОНИ ДЕЛИСЬ?'); },

  // ---------- Рукопись Войнича ----------
  vo_book(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#0b0705"/>` + glowOrb(860, 820, 700, '#ffa04a', .45);
    g += `<defs>${grad('pg', [[0, '#e8d5aa'], [1, '#b89a68']])}</defs>`;
    g += `<g transform="translate(540 1150) rotate(-6)"><rect x="-430" y="-300" width="860" height="600" rx="10" fill="#3a2414"/>
          <rect x="-410" y="-285" width="400" height="570" fill="url(#pg)"/><rect x="10" y="-285" width="400" height="570" fill="url(#pg)"/>`;
    const r = rnd(51), G = 'ꝏꝑꝯ∂ꝙ9ꝗ8ꝋoɐ';
    for (let i = 0; i < 48; i++) { const x = -390 + (i % 6) * 62 + (i % 12 > 5 ? 410 : 0), y = -230 + Math.floor(i / 12) * 60;
      g += `<text x="${x}" y="${y}" font-family="Disp" font-size="42" fill="#4a2a14" opacity="${.5 + .5 * Math.sin(t * 2 + i)}">${G[Math.floor(r() * G.length)]}</text>`; }
    g += `<circle cx="-210" cy="170" r="70" fill="#5a8a4a" opacity=".7"/><circle cx="210" cy="160" r="60" fill="#3a7a8a" opacity=".6"/></g>`;
    const fl = (Math.sin(t * 9) + Math.sin(t * 13)) * .04;
    g += `<g transform="translate(900 1050)"><rect x="-26" y="0" width="52" height="160" fill="#efe2c8"/><path d="M0 -60 Q 22 -20 0 0 Q -22 -20 0 -60" fill="#ffcf7a" filter="url(#glow)" opacity="${.9 + fl}"/></g>`;
    g += particles(60, 53, t, 'dust', '#ffd8a0');
    return cam(g, u, d, 1.0, 1.12, -40, 0) + post(t, '#2a1404', .12);
  },
  vo_count(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#0b0705"/>` + glowOrb(540, 960, 600, '#ffa04a', .3);
    const n = Math.round(ease(u / 1.5) * 240);
    g += `<text x="540" y="1060" text-anchor="middle" font-family="Disp" font-size="360" fill="${ACC}" filter="url(#glow)">${n}</text>
          <text x="540" y="1160" text-anchor="middle" font-family="Disp" font-size="80" fill="#e8d5aa">СТРАНИЦ</text>`;
    const r = rnd(55), G = 'ꝏꝑꝯ∂ꝙ9ꝗ8ꝋ';
    for (let i = 0; i < 40; i++) { const x = r() * 1080, y = (r() * 1920 - t * 40 * (r() + .3) + 1920) % 1920; g += `<text x="${x}" y="${y}" font-family="Disp" font-size="${30 + r() * 40}" fill="#e8d5aa" opacity="${.1 + r() * .2}">${G[i % G.length]}</text>`; }
    return cam(g, u, d, 1.0, 1.06) + post(t, '#2a1404', .1);
  },
  vo_plant(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#1a1208"/><defs>${grad('pg2', [[0, '#eadbb4'], [1, '#c4a678']])}</defs><rect x="140" y="420" width="800" height="1120" fill="url(#pg2)"/>`;
    const k = ease(u / 1.8), sw = Math.sin(t) * 3;
    g += `<g transform="translate(540 1400) rotate(${sw})"><path d="M0 0 L0 ${-600 * k}" stroke="#4a6b3a" stroke-width="14"/>
          <ellipse cx="-110" cy="-250" rx="${130 * k}" ry="${44 * k}" fill="#6b8f4a" transform="rotate(-30 -110 -250)"/>
          <ellipse cx="110" cy="-360" rx="${130 * k}" ry="${44 * k}" fill="#6b8f4a" transform="rotate(30 110 -360)"/>
          <circle cx="0" cy="-640" r="${100 * k}" fill="#b5523a" opacity=".85"/><circle cx="0" cy="-640" r="${42 * k}" fill="${ACC}"/>
          <path d="M0 0 Q -80 90 -170 60 M0 0 Q 70 110 180 70 M0 0 Q 10 120 -30 170" stroke="#7a5238" stroke-width="10" fill="none"/></g>`;
    g += `<text x="540" y="560" text-anchor="middle" font-family="Disp" font-size="64" fill="#7a4a24" opacity="${ease(u - .8)}">?</text>`;
    return cam(g, u, d, 1.06, 1.0) + post(t, '#2a1404', .12);
  },
  vo_end(u, d, t) { return endCard(u, t, 'РУКОПИСЬ ВОЙНИЧА', 'НЕ ПРОЧИТАНА'); },

  // ---------- Маяк Фланнан ----------
  fl_light(u, d, t, s) {
    const on = !s.off;
    let g = sky('fl1', '#03060c', '#0e1a28', '#1c2c3c') + stars(100, 61, t, 900);
    if (on) { const a = t * 1.4; g += `<g opacity=".35" filter="url(#blur20)"><polygon points="540,620 ${540 + Math.cos(a) * 1600},${620 + Math.sin(a) * 300 - 160} ${540 + Math.cos(a) * 1600},${620 + Math.sin(a) * 300 + 160}" fill="#fff2c0"/></g>`; }
    g += `<path d="M-100 1500 L250 1120 Q 400 1000 540 1040 Q 720 1000 850 1140 L1180 1450 V2100 H-100 Z" fill="#141a18"/>`;
    g += `<defs>${grad('lh', [[0, '#e8e2d4'], [1, '#9a9488']], false)}</defs><polygon points="480,1060 500,700 580,700 600,1060" fill="url(#lh)"/>`;
    g += `<rect x="492" y="790" width="96" height="36" fill="#9a2a22"/><rect x="486" y="900" width="108" height="36" fill="#9a2a22"/>`;
    g += `<rect x="500" y="610" width="80" height="90" fill="${on ? '#ffe7a0' : '#1a1a1a'}" ${on ? 'filter="url(#glow)"' : ''}/><polygon points="490,610 540,560 590,610" fill="#222"/>`;
    if (on) g += glowOrb(540, 655, 180, '#ffe7a0', .6);
    g += sea(1350, t, '#16303e', '#03070a', '#9fc0d8', 22) + particles(s.off ? 200 : 60, 63, t, s.off ? 'rain' : 'dust', '#c8d6e6');
    return cam(g, u, d, 1.0, 1.08, 0, 20) + post(t, '#04101a', .2);
  },
  fl_room(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#14120f"/>` + rays(820, 300, t, '#cfd8e0', .18, 5, 20);
    g += `<rect x="700" y="300" width="240" height="400" fill="#3a4a58" opacity=".5"/><rect x="-100" y="1500" width="1280" height="600" fill="#0c0a08"/>`;
    g += `<rect x="200" y="1180" width="420" height="20" fill="#3a2a1c"/><rect x="220" y="1200" width="20" height="300" fill="#2a1d12"/><rect x="580" y="1200" width="20" height="300" fill="#2a1d12"/>`;
    g += `<rect x="290" y="1140" width="70" height="40" rx="6" fill="#d8d0c0"/><rect x="430" y="1130" width="40" height="50" fill="#6a5a4a"/>`;
    const sw = Math.sin(t * .8) * 3;
    g += `<g transform="rotate(${sw} 850 860)"><circle cx="850" cy="860" r="10" fill="#888"/><path d="M790 880 L910 880 L940 1200 L760 1200 Z" fill="#c9a22a"/><path d="M820 880 L850 1000 L880 880" fill="#a8861a"/></g>`;
    g += particles(80, 65, t, 'dust', '#e0e8f0');
    return cam(g, u, d, 1.12, 1.0, -20, 0) + post(t, '#0a1418', .15);
  },
  fl_wave(u, d, t) {
    let g = sky('fl3', '#05080c', '#141f2a', '#26333f') + particles(220, 67, t, 'rain', '#b8c8d8');
    g += `<path d="M-100 1700 L300 1260 L520 1240 L700 1500 L1180 1600 V2100 H-100 Z" fill="#101614"/>`;
    const k = (Math.sin(t * 1.2) + 1) / 2;
    g += `<path d="M-100 ${1500 - k * 300} Q 300 ${1100 - k * 400} 640 ${1300 - k * 200} Q 900 ${1450 - k * 100} 1180 ${1350 - k * 200} V2100 H-100 Z" fill="#1d3a4a" opacity=".9"/>`;
    g += `<g filter="url(#blur8)" opacity="${.5 + k * .4}"><path d="M200 ${1200 - k * 400} Q 400 ${1050 - k * 450} 640 ${1290 - k * 200}" stroke="#e8f2f8" stroke-width="40" fill="none"/></g>`;
    g += particles(80, 69, t, 'snow', '#e8f2f8');
    return cam(g, u, d, 1.0, 1.1, 0, 0) + post(t, '#04101a', .2);
  },
  fl_end(u, d, t) { return endCard(u, t, 'МАЯК ФЛАННАН', 'НИКТО НЕ ЗНАЕТ'); },

  // ---------- Тунгусский взрыв ----------
  tu_taiga(u, d, t, s) {
    let g = sky('tu1', '#9ab8d8', '#e8c89a', '#f0a868') + glowOrb(300, 1000, 350, '#fff2c8', .6);
    if (s.ball) { const k = ease(u / (d * .8)), x = lerp(1200, 400, k), y = lerp(150, 1000, k);
      g += `<line x1="${x + 500}" y1="${y - 600}" x2="${x}" y2="${y}" stroke="#fff4d0" stroke-width="40" opacity=".6" filter="url(#blur20)"/>` + glowOrb(x, y, 260, '#ffb04a', .9) + `<circle cx="${x}" cy="${y}" r="40" fill="#fff8e0"/>`; }
    g += mountains(1200, '#6a7a6a', '#3a4a3a', 71, 200, false) + pines(1350, 70, 72, '#1e3020', 300) + `<rect x="-100" y="1340" width="1280" height="700" fill="#1a2a1a"/>` + pines(1500, 40, 73, '#0e1a10', 360);
    return cam(g, u, d, 1.0, 1.08) + post(t, '#3a1a00', .06);
  },
  tu_flash(u, d, t) {
    const k = ease(u / 1.2), w = Math.min(1, u / .4);
    let g = sky('tu2', '#ffe8b0', '#ff9a4a', '#5a2a10') + glowOrb(540, 1100, 900 * k + 100, '#ffffff', 1);
    g += `<circle cx="540" cy="1100" r="${200 + k * 900}" fill="none" stroke="#fff" stroke-width="${30 * (1 - k)}" opacity="${1 - k}" filter="url(#blur8)"/>`;
    g += pines(1450, 60, 75, '#2a1608', 300) + `<rect x="-100" y="1440" width="1280" height="700" fill="#1a0e06"/>`;
    g += `<rect width="1080" height="1920" fill="#fff" opacity="${(1 - w) * .9}"/>`;
    return cam(g, u, d, 1.06, 1.0) + post(t, '#3a1000', .05);
  },
  tu_fallen(u, d, t) {
    let g = sky('tu3', '#7a8a96', '#a8a290', '#6a5a48') + fog(900, t, '#c8c0b0', .35, 10, 76);
    g += `<rect x="-100" y="900" width="1280" height="1200" fill="#3a3a2a"/>`;
    const r = rnd(77);
    for (let i = 0; i < 120; i++) { const a = r() * Math.PI * 2, rr = 120 + r() * 700, x = 540 + Math.cos(a) * rr, y = 1300 + Math.sin(a) * rr * .45, L = 50 + r() * 70;
      g += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * L}" y2="${y + Math.sin(a) * L * .45}" stroke="#2a1c10" stroke-width="${6 + r() * 6}" stroke-linecap="round"/>`; }
    g += `<circle cx="540" cy="1300" r="40" fill="#5a4a38" opacity=".6"/>` + particles(60, 78, t, 'dust', '#d0c8b8');
    return cam(g, u, d, 1.15, 1.0, 0, -40) + post(t, '#1a1004', .1);
  },
  tu_end(u, d, t) { return endCard(u, t, 'ТУНГУССКИЙ ВЗРЫВ', '1908'); },

  // ---------- Антикитерский механизм ----------
  an_sea(u, d, t) {
    let g = sky('an1', '#2a7a9a', '#0e3a52', '#031420') + rays(540, -200, t, '#bfefff', .3, 8, 60);
    for (let i = 0; i < 30; i++) { const r = rnd(80 + i), x = r() * 1080, y = (1900 - (t * 60 * (r() + .3) + r() * 1900) % 1900); g += `<circle cx="${x}" cy="${y}" r="${3 + r() * 6}" fill="none" stroke="#bfefff" stroke-width="2" opacity=".5"/>`; }
    g += `<path d="M-100 1600 Q 300 1500 540 1580 T 1180 1560 V2100 H-100 Z" fill="#0a2430"/>`;
    g += `<g transform="translate(540 1520) rotate(-8)"><rect x="-120" y="-70" width="240" height="140" rx="20" fill="#3f6a5a"/><circle cx="-30" cy="0" r="40" fill="none" stroke="#2a4a3e" stroke-width="10"/><circle cx="50" cy="10" r="26" fill="none" stroke="#2a4a3e" stroke-width="8"/></g>`;
    g += glowOrb(540, 1520, 220, '#bfefff', .25);
    return cam(g, u, d, 1.0, 1.1, 0, 40) + post(t, '#00202a', .15);
  },
  an_gears(u, d, t) {
    function gear(cx, cy, r, n, col, rot) { let s = `<g transform="rotate(${rot} ${cx} ${cy})">`;
      for (let i = 0; i < n; i++) s += `<rect x="${cx - 12}" y="${cy - r - 26}" width="24" height="34" rx="4" fill="${col}" transform="rotate(${i * 360 / n} ${cx} ${cy})"/>`;
      return s + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}"/><circle cx="${cx}" cy="${cy}" r="${r * .72}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="6"/>` +
        [0, 60, 120].map(a => `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a * Math.PI / 180) * r * .7}" y2="${cy + Math.sin(a * Math.PI / 180) * r * .7}" stroke="#000" stroke-opacity=".3" stroke-width="10"/>`).join('') +
        `<circle cx="${cx}" cy="${cy}" r="${r * .18}" fill="#1a1208"/></g>`; }
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#0e0b07"/>` + glowOrb(540, 960, 800, '#d8a050', .35);
    g += gear(420, 900, 230, 30, '#9a7a3a', t * 20) + gear(760, 1200, 140, 18, '#b8924a', -t * 33) + gear(740, 680, 110, 14, '#7a5e2a', -t * 42) + gear(380, 1330, 90, 12, '#a88a4a', t * 51);
    g += particles(60, 85, t, 'dust', '#ffd8a0');
    return cam(g, u, d, 1.1, 1.0) + post(t, '#2a1404', .1);
  },
  an_eclipse(u, d, t) {
    const k = ease(u / d);
    let g = sky('an3', '#000', '#05070c', '#0e1420') + stars(200, 87, t, 1900);
    g += glowOrb(540, 900, 420, '#ffd9a0', .8 - k * .3) + `<circle cx="540" cy="900" r="170" fill="#ffe8b8"/>`;
    g += `<circle cx="${lerp(900, 545, k)}" cy="${lerp(820, 898, k)}" r="172" fill="#05070c"/>`;
    if (k > .9) g += `<circle cx="540" cy="900" r="180" fill="none" stroke="#fff" stroke-width="6" filter="url(#glow)" opacity="${(k - .9) * 10}"/>`;
    return cam(g, u, d, 1.0, 1.08) + post(t, '#000', 0);
  },
  an_end(u, d, t) { return endCard(u, t, 'АНТИКИТЕРСКИЙ', 'МЕХАНИЗМ'); },

  // ---------- Наска ----------
  na_desert(u, d, t, s) {
    let g = `<defs>${grad('ds', [[0, '#d8b07a'], [1, '#a87a48']])}</defs><rect x="-100" y="-100" width="1280" height="2120" fill="url(#ds)"/>`;
    const r = rnd(91); for (let i = 0; i < 160; i++) g += `<circle cx="${r() * 1080}" cy="${r() * 1920}" r="${2 + r() * 5}" fill="#8a5a30" opacity=".25"/>`;
    const path = 'M260 1400 L420 1100 L380 820 L480 940 L540 700 L580 960 L760 880 L640 1090 L860 1300 M420 1100 Q 540 1180 640 1090';
    const k = s.draw ? ease(u / (d * .8)) : 1;
    g += `<path d="${path}" fill="none" stroke="#f6e6c4" stroke-width="16" stroke-linejoin="round" stroke-dasharray="4000" stroke-dashoffset="${4000 * (1 - k)}" filter="url(#glow)"/>`;
    if (s.plane) { const x = lerp(-200, 1300, u / d); g += `<g transform="translate(${x} 500) rotate(8)" opacity=".85"><path d="M-60 0 L60 0 M0 -40 L0 40 M40 -12 L40 12" stroke="#1a1a1a" stroke-width="12" stroke-linecap="round"/></g><ellipse cx="${x + 40}" cy="1560" rx="80" ry="22" fill="#000" opacity=".15"/>`; }
    return cam(g, u, d, s.draw ? 1.2 : 1.0, s.draw ? 1.0 : 1.1) + post(t, '#3a1a00', .06);
  },
  na_end(u, d, t) { return endCard(u, t, 'ЛИНИИ НАСКА', 'ЗАЧЕМ?'); },

  // ---------- Экспедиция Франклина ----------
  fr_ice(u, d, t) {
    let g = sky('fr1', '#020610', '#0a1a2a', '#1a2e3e') + stars(120, 101, t, 900);
    for (let i = 0; i < 3; i++) { let dd = `M-100 ${500 + i * 90}`; for (let x = -100; x <= 1180; x += 60) dd += ` L${x} ${500 + i * 90 + Math.sin(x / 140 + t * .8 + i) * 60}`;
      g += `<path d="${dd}" stroke="${['#5affb0', '#7ad8ff', '#b07aff'][i]}" stroke-width="${120 - i * 30}" fill="none" opacity=".18" filter="url(#blur50)"/>`; }
    g += `<path d="M-100 1300 L1180 1280 V2100 H-100 Z" fill="#cfe0ea"/>`;
    g += ship(330, 1290, .55, t, { bare: true, still: true }) + ship(780, 1300, .5, t, { bare: true, still: true, lamp: true });
    g += `<polygon points="-100,1420 200,1320 380,1420" fill="#eef6fa"/><polygon points="560,1430 760,1340 920,1440" fill="#eef6fa"/>` + particles(160, 103, t, 'snow', '#fff');
    return cam(g, u, d, 1.0, 1.1, 0, 30) + post(t, '#04142a', .15);
  },
  fr_wreck(u, d, t) {
    let g = sky('fr2', '#0a3a52', '#062636', '#010a10') + rays(400, -200, t, '#a8e8ff', .25, 7, 40);
    g += `<path d="M-100 1650 Q 540 1580 1180 1660 V2100 H-100 Z" fill="#06141c"/>`;
    g += `<g opacity=".8">` + ship(540, 1560, .75, t, { bare: true, still: true }) + `</g>`;
    g += glowOrb(lerp(200, 700, ease(u / d)), 1300, 260, '#e8f8ff', .35);
    for (let i = 0; i < 24; i++) { const r = rnd(110 + i), x = r() * 1080, y = (1900 - (t * 50 * (r() + .3) + r() * 1900) % 1900); g += `<circle cx="${x}" cy="${y}" r="${2 + r() * 5}" fill="none" stroke="#bfefff" stroke-width="2" opacity=".4"/>`; }
    return cam(g, u, d, 1.1, 1.0) + post(t, '#001018', .2);
  },
  fr_end(u, d, t) { return endCard(u, t, '129 МОРЯКОВ', 'НЕ ВЕРНУЛИСЬ'); },

  // ---------- Сигнал Wow! ----------
  wo_dish(u, d, t) {
    let g = sky('wo1', '#010208', '#070d1e', '#141c34') + stars(260, 121, t, 1500);
    for (let i = 0; i < 3; i++) g += `<path d="M-100 ${600 + i * 60} Q 540 ${450 + i * 40} 1180 ${620 + i * 50}" stroke="#a8b8ff" stroke-width="${80 - i * 20}" fill="none" opacity=".06" filter="url(#blur50)"/>`;
    g += `<path d="M-100 1500 L1180 1480 V2100 H-100 Z" fill="#0a0e14"/>`;
    g += `<g transform="translate(540 1460)"><rect x="-20" y="-200" width="40" height="200" fill="#3a4250"/><g transform="rotate(-20)"><path d="M-330 -330 Q 0 -60 330 -330" fill="#9aa4b4" stroke="#5a6474" stroke-width="10"/><line x1="0" y1="-210" x2="0" y2="-470" stroke="#5a6474" stroke-width="10"/></g></g>`;
    const k = (t * .6) % 1;
    g += `<circle cx="${380 - k * 600}" cy="${880 - k * 900}" r="${20 + k * 40}" fill="none" stroke="${ACC}" stroke-width="4" opacity="${1 - k}"/>`;
    return cam(g, u, d, 1.0, 1.1, 0, 40) + post(t, '#000814', .15);
  },
  wo_signal(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#03060c"/>`;
    for (let i = 0; i < 20; i++) g += `<line x1="0" y1="${400 + i * 60}" x2="1080" y2="${400 + i * 60}" stroke="#1a2a3a" stroke-width="2"/>`;
    let dd = 'M0 1000'; const k = cl(u / (d * .8));
    for (let x = 0; x <= 1080 * k; x += 6) { const r = Math.sin(x * 1.7) * 20 + Math.sin(x * .37) * 10, peak = Math.exp(-Math.pow((x - 540) / 90, 2)) * 520; dd += ` L${x} ${1000 + r - peak}`; }
    g += `<path d="${dd}" stroke="#5affb0" stroke-width="5" fill="none" filter="url(#glow)"/>`;
    g += `<text x="540" y="1320" text-anchor="middle" font-family="Disp" font-size="120" fill="#5affb0" opacity="${ease((u - 1) * 2)}">72 СЕК</text>`;
    return cam(g, u, d, 1.0, 1.06) + post(t, '#001408', .1);
  },
  wo_print(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#1a1612"/>` + glowOrb(540, 900, 700, '#fff0d0', .25);
    g += `<g transform="rotate(-4 540 960)"><rect x="240" y="300" width="600" height="1300" fill="#f4efe2"/>`;
    for (let i = 0; i < 26; i++) g += `<circle cx="270" cy="${330 + i * 48}" r="9" fill="#cfc6b0"/><circle cx="810" cy="${330 + i * 48}" r="9" fill="#cfc6b0"/>`;
    const rows = ['1  1   1', '  1    ', ' 6   1 ', '1E      ', ' Q  1  ', '1U      ', ' J   1 ', '15      ', '   1  1', ' 1     '];
    rows.forEach((rw, i) => g += `<text x="340" y="${520 + i * 80}" font-family="monospace" font-size="62" fill="#2a2a2a">${rw.replace(/ /g, ' ')}</text>`);
    const k = ease((u - .4) / 1.2);
    g += `<ellipse cx="410" cy="${780}" rx="80" ry="${260 * k}" fill="none" stroke="#c0392b" stroke-width="10"/>`;
    g += `<text x="560" y="640" font-family="Disp" font-size="130" fill="#c0392b" opacity="${ease((u - 1.2) * 2)}" transform="rotate(-10 560 640)">Wow!</text></g>`;
    return cam(g, u, d, 1.1, 1.0, 0, 0) + post(t, '#1a1004', .08);
  },
  wo_end(u, d, t) { return endCard(u, t, 'СИГНАЛ WOW!', 'БОЛЬШЕ НИ РАЗУ'); },
};
