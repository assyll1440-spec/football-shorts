// «Мэри Селест» — cinematic scenes. Each ANIM fn(u, d, t, s) returns SVG for local time u of a scene lasting d.
function ship(x, y, s, t, opts = {}) {
  const roll = Math.sin(t * 0.9) * 2.2, bob = Math.sin(t * 1.3) * 6;
  const sail = opts.torn ? '#8f8a7c' : '#cfc6ad';
  return `<g transform="translate(${x} ${y + bob}) rotate(${roll}) scale(${s})">
   <defs>${grad('hull', [[0, '#3b2a1e'], [1, '#120c08']])}${grad('sail', [[0, sail], [1, '#6f6a5c']], false)}</defs>
   <path d="M-330 0 L330 0 Q 300 70 240 110 L-250 110 Q -310 70 -330 0 Z" fill="url(#hull)"/>
   <path d="M-330 0 L330 0" stroke="#5a4330" stroke-width="6"/>
   <rect x="-160" y="-430" width="12" height="430" fill="#1d140e"/><rect x="90" y="-390" width="12" height="390" fill="#1d140e"/>
   <line x1="-330" y1="-10" x2="-154" y2="-430" stroke="#1d140e" stroke-width="3"/><line x1="330" y1="-10" x2="96" y2="-390" stroke="#1d140e" stroke-width="3"/>
   <path d="M-148 -410 Q -40 -330 -148 -250 Z" fill="url(#sail)" opacity=".9"/>
   <path d="M-148 -230 Q -20 -150 -148 -60 Z" fill="url(#sail)" opacity=".8"/>
   <path d="M102 -370 Q 190 -300 102 -230 Z" fill="url(#sail)" opacity=".75"/>
   <path d="M102 -210 Q 200 -140 ${opts.torn ? 150 : 102} -60 L102 -60 Z" fill="url(#sail)" opacity=".7"/>
   ${opts.lamp ? `<circle cx="250" cy="-30" r="9" fill="#ffcf7a" filter="url(#glow)"/>` : ''}
  </g>`;
}
function barrel(x, y, s, lit) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><defs>${grad('brl', [[0, '#5a3a22'], [.5, '#9a6a3e'], [1, '#3a2414']], false)}</defs>
   <rect x="-60" y="-80" width="120" height="160" rx="40" fill="url(#brl)"/>
   <rect x="-63" y="-52" width="126" height="10" fill="#2a1a10"/><rect x="-63" y="42" width="126" height="10" fill="#2a1a10"/>
   <rect x="-60" y="-80" width="120" height="160" rx="40" fill="#ffb05a" opacity="${lit}"/></g>`;
}
const ANIM = {
  // 1. Moonlit ocean, ghost ship emerging from fog
  ocean(u, d, t) {
    let g = sky('sk1', '#05070d', '#132235', '#2d3f52') + stars(120, 7, t, 900) + glowOrb(800, 640, 360, '#cfe0ff', .55) + `<circle cx="800" cy="640" r="70" fill="#eef3ff"/>`;
    g += rays(800, 640, t, '#cfe0ff', .12, 7, 50);
    g += fog(1050, t, '#8aa0b8', .35, 15, 2);
    const k = ease(u / d);
    g += ship(lerp(380, 520, k), 1120, lerp(.8, .95, k), t, { torn: true });
    g += sea(1180, t, '#1a2c3d', '#05080d', '#9fb8d6', 14);
    g += `<path d="M640 1190 L920 1190" stroke="#dfe9ff" stroke-width="40" opacity=".18" filter="url(#blur20)"/>`;
    g += fog(1240, t + 3, '#b8c8d8', .3, 25, 5);
    return cam(g, u, d, 1.0, 1.1, 0, 30) + post(t, '#0a1a3a', .15);
  },
  // 2. Empty deck, swinging lantern
  deck(u, d, t) {
    let g = sky('sk2', '#0a0d14', '#1a2432', '#26313f') + fog(700, t, '#7d8da0', .35, 18, 9, 400);
    g += `<defs>${grad('dk', [[0, '#4a3624'], [1, '#1a110a']])}</defs><polygon points="-100,1300 1180,1300 1180,1920 -100,1920" fill="url(#dk)"/>`;
    for (let i = 0; i < 14; i++) g += `<line x1="${-100 + i * 100}" y1="1300" x2="${-600 + i * 190}" y2="1920" stroke="#140c06" stroke-width="4" opacity=".7"/>`;
    g += `<rect x="-100" y="1240" width="1280" height="60" fill="#2a1d12"/><rect x="-100" y="1180" width="1280" height="16" fill="#3a2a1a"/>`;
    for (let i = 0; i < 9; i++) g += `<rect x="${i * 140}" y="1180" width="14" height="70" fill="#2a1d12"/>`;
    g += `<rect x="760" y="300" width="22" height="1000" fill="#1d140e"/><path d="M771 330 L300 1180" stroke="#1d140e" stroke-width="5"/>`;
    const sw = Math.sin(t * 1.6) * 16;
    g += `<g transform="rotate(${sw} 771 520)"><line x1="771" y1="520" x2="771" y2="700" stroke="#111" stroke-width="5"/>
          ${glowOrb(771, 740, 260, '#ffb35a', .55)}<rect x="741" y="700" width="60" height="80" rx="10" fill="#2a1d12"/>
          <rect x="751" y="712" width="40" height="56" rx="6" fill="#ffd28a" opacity="${.8 + .2 * Math.sin(t * 9)}"/></g>`;
    g += `<g transform="translate(330 1290)"><ellipse cx="0" cy="0" rx="120" ry="26" fill="#000" opacity=".4"/><path d="M-90 -6 Q 0 -60 90 -6" stroke="#6b5640" stroke-width="16" fill="none"/></g>`;
    g += particles(40, 3, t, 'dust', '#ffd9a0') + fog(1350, t, '#a0b0c0', .25, 30, 4);
    return cam(g, u, d, 1.05, 1.15, -30, 0) + post(t, '#1a1208', .12);
  },
  // 3. Cargo hold, barrels in lantern light, floating dust
  hold(u, d, t) {
    let g = `<rect x="-100" y="-100" width="1280" height="2120" fill="#0c0806"/>` + glowOrb(540, 820, 900, '#ff9d42', .35);
    for (let i = 0; i < 8; i++) g += `<path d="M-100 ${200 + i * 70} Q 540 ${120 + i * 70} 1180 ${200 + i * 70}" stroke="#2a1a10" stroke-width="18" fill="none" opacity=".8"/>`;
    g += rays(540, 120, t, '#ffcf8a', .16, 5, 30);
    const pos = [[220, 1300, 1.3], [470, 1330, 1.35], [720, 1300, 1.3], [940, 1340, 1.25], [340, 1110, 1.15], [600, 1110, 1.15], [850, 1120, 1.1], [470, 930, 1.0], [720, 940, 1.0]];
    pos.forEach((p, i) => { g += barrel(p[0], p[1], p[2], .08 + .06 * Math.sin(t * 2 + i)); });
    g += particles(90, 11, t, 'dust', '#ffd9a0');
    g += `<rect x="-100" y="1500" width="1280" height="520" fill="#050302" opacity=".75"/>`;
    return cam(g, u, d, 1.12, 1.0, 0, -20) + post(t, '#2a1404', .1);
  },
  // 4. Empty lifeboat davits, rope trailing into the sea
  davits(u, d, t) {
    let g = sky('sk4', '#0b1018', '#1c2a38', '#33465a') + fog(900, t, '#9fb0c2', .3, 12, 6, 300);
    g += sea(1250, t, '#1d3346', '#060a10', '#a8c0da', 18);
    g += `<rect x="-100" y="1080" width="1280" height="70" fill="#2e2015"/><rect x="-100" y="1040" width="1280" height="20" fill="#3d2b1c"/>`;
    const sw = Math.sin(t * 1.4) * 6;
    [300, 760].forEach((x, i) => {
      g += `<path d="M${x} 1060 L${x} 640 Q ${x} 560 ${x + 90} 560" stroke="#1a120c" stroke-width="22" fill="none" stroke-linecap="round"/>`;
      g += `<g transform="rotate(${sw * (i ? -1 : 1)} ${x + 90} 560)"><line x1="${x + 90}" y1="560" x2="${x + 90}" y2="${880 + i * 40}" stroke="#a08a66" stroke-width="5"/>
            <path d="M${x + 76} ${880 + i * 40} q 14 24 28 0" stroke="#a08a66" stroke-width="6" fill="none"/></g>`;
    });
    const k = ease((u - .3) / 1.2);
    g += `<g opacity="${k}"><path d="M330 700 L800 700 L750 860 L380 860 Z" fill="none" stroke="${ACC}" stroke-width="6" stroke-dasharray="22 14"/>
          <text x="565" y="810" text-anchor="middle" font-family="Disp" font-size="110" fill="${ACC}" filter="url(#glow)">?</text></g>`;
    g += `<path d="M300 1080 C 340 1180, 260 1240, 330 1320" stroke="#a08a66" stroke-width="5" fill="none"/>`;
    g += particles(160, 21, t, 'rain', '#c8d6e6');
    return cam(g, u, d, 1.0, 1.08, 20, 0) + post(t, '#0a1a2a', .15);
  },
  // 5. Ship drifts away into the fog; question
  away(u, d, t) {
    let g = sky('sk5', '#040508', '#0f1824', '#1f2c3a') + stars(80, 9, t, 700) + glowOrb(260, 640, 300, '#cfe0ff', .35) + `<circle cx="260" cy="640" r="55" fill="#e6eeff" opacity=".9"/>`;
    const k = ease(u / d);
    g += `<g opacity="${1 - k * .65}">` + ship(lerp(560, 760, k), 1100, lerp(.7, .45, k), t, { torn: true, lamp: true }) + `</g>`;
    g += fog(1040, t, '#9fb0c2', .45 + k * .3, 20, 8, 260);
    g += sea(1150, t, '#142231', '#040609', '#9fb8d6', 12);
    g += fog(1250, t + 2, '#b9c7d6', .35, 30, 12);
    return cam(g, u, d, 1.0, 1.06, 0, 20) + post(t, '#081426', .2);
  },
};
