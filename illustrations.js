const colors = {
  moss: ['#e9eee2', '#d8e3d2', '#fcfdf9', '#416652', '#a7bca3'],
  clay: ['#f2eae2', '#e6d8ca', '#fffaf4', '#8c6451', '#c8a993'],
  slate: ['#e8edf0', '#d6e0e7', '#f9fcfd', '#516c7c', '#a1b8c6'],
  sand: ['#f2eee2', '#e6dfc9', '#fffdf5', '#817045', '#c4b485'],
  iris: ['#eeebf2', '#e1d9ea', '#fdfaff', '#6d5b82', '#b4a3c6'],
  mint: ['#e4eee8', '#d2e3db', '#f8fcfa', '#3f6c5b', '#91b6a6'],
};

const pictograms = {
  spark: '<path d="M0-25 7-7 25 0 7 7 0 25-7 7-25 0-7-7Z" fill="currentColor" stroke="none"/><path d="M23-24v12m-6-6h12M-23 16v11m-5.5-5.5h11" stroke-width="2"/>',
  orbit: '<ellipse rx="29" ry="12" transform="rotate(-33)"/><ellipse rx="29" ry="12" transform="rotate(33)"/><circle r="5" fill="currentColor" stroke="none"/><circle cx="23" cy="-16" r="4" fill="currentColor" stroke="none"/>',
  notebook: '<rect x="-18" y="-25" width="38" height="50" rx="4"/><path d="M-9-25v50M-22-14h8m-8 12h8m-8 12h8M-1-9h12m-12 8h12m-12 8h7"/>',
  gift: '<rect x="-23" y="-12" width="46" height="32" rx="5"/><rect x="-26" y="-17" width="52" height="10" rx="3" fill="var(--illustration-paper)"/><path d="M0-17v37M0-17h-10a6 6 0 1 1 5.2-9L0-17Zm0 0h10a6 6 0 1 0-5.2-9L0-17Z"/>',
  layers: '<path d="m0-22 26 14L0 6-26-8 0-22Z" fill="var(--illustration-paper)"/><path d="m-26 2 26 14L26 2M-26 12 0 26l26-14"/>',
  frame: '<rect x="-24" y="-20" width="48" height="40" rx="5"/><path d="m-23 15 15-16L4 10l7-8 13 12"/><circle cx="10" cy="-9" r="4"/>',
  code: '<path d="m-12-11-12 11 12 11m24-22L24 0 12 11M6-19-6 19"/>',
  play: '<rect x="-26" y="-18" width="52" height="36" rx="6"/><path d="m-5-9 14 9-14 9V-9Z" fill="currentColor" stroke="none"/>',
  cloud: '<path d="M-14 17h31a11 11 0 0 0 1.1-21.9 15.5 15.5 0 0 0-30.2-3.5A12.8 12.8 0 0 0-14 17Z"/><path d="M0 9V-4m-5 5 5-5 5 5"/>',
  type: '<path d="m-25 20 19-43L13 20M-17 4H5m10 1c6-6 13-2 13 4v11m0-9c-15-2-17 12-3 9l3-2"/>',
  wave: '<path d="M-26 0h5l5-13 6 26 6-33 7 41 6-27 6 12 4-6h7"/>',
};

export function productArt(product, view = 'cover', className = '') {
  const [background, contrast, paper, ink, accent] = colors[product.theme] || colors.moss;
  const symbol = pictograms[product.art] || pictograms.spark;
  const detail = view === 'detail';
  return `<svg class="product-illustration ${className}" viewBox="0 0 320 156" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="--illustration-paper:${paper}">
    <rect width="320" height="156" fill="${background}"/>
    <path d="M28 0v156M56 0v156M84 0v156M112 0v156M140 0v156M168 0v156M196 0v156M224 0v156M252 0v156M280 0v156M308 0v156M0 22h320M0 50h320M0 78h320M0 106h320M0 134h320" stroke="${contrast}" stroke-width="1" opacity=".69"/>
    <g transform="${detail ? 'translate(171 79) rotate(7)' : 'translate(173 77) rotate(10)'}">
      <rect x="-45" y="-48" width="90" height="96" rx="15" fill="${contrast}" stroke="${accent}"/>
      <path d="M17-33h14m-9 5h9m-14 63h14" stroke="${accent}" stroke-linecap="round" stroke-width="2"/>
    </g>
    <g transform="${detail ? 'translate(151 77) rotate(-4)' : 'translate(150 79) rotate(-9)'}">
      <rect x="-47" y="-47" width="96" height="97" rx="14" fill="${paper}" stroke="${accent}"/>
      <g transform="translate(0 -1) scale(.86)" fill="none" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round" color="${ink}">${symbol}</g>
      <path d="M-35 35h15m-15 5h9" stroke="${accent}" stroke-linecap="round" stroke-width="1.45"/>
    </g>
    <path d="M90 34v12m-6-6h12m127 68v12m-6-6h12" stroke="${accent}" stroke-linecap="round" stroke-width="1.4"/>
  </svg>`;
}

export function heroArt() {
  return `<svg class="hero-illustration" viewBox="0 0 572 298" fill="none" aria-hidden="true">
    <defs>
      <pattern id="hero-grid" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M26 0H0v26" fill="none" stroke="var(--hero-grid)"/>
      </pattern>
    </defs>
    <rect x="28" y="18" width="523" height="261" fill="url(#hero-grid)"/>
    <path d="M28 18h24m-24 0v24m523-24h-24m24 0v24M28 279h24m-24 0v-24m523 24h-24m24 0v-24" stroke="var(--hero-line)" stroke-width="1.3"/>
    <path d="M118 231h45v-43m302-133h-48v35M47 151h71m0 0v28m349 49v-43h43" stroke="var(--hero-line)" stroke-width="1.1" stroke-dasharray="4 6"/>
    <rect x="102" y="169" width="21" height="21" rx="5" fill="var(--hero-tile)" stroke="var(--hero-line)"/>
    <path d="M112.5 175v9m-4.5-4.5h9" stroke="var(--hero-mark)" stroke-linecap="round"/>
    <rect x="477" y="63" width="33" height="33" rx="8" fill="var(--hero-tile)" stroke="var(--hero-line)"/>
    <path d="M489 73h9m-9 5.5h9m-9 5.5h6" stroke="var(--hero-mark)" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="translate(302 143) rotate(10)">
      <rect x="-95" y="-78" width="215" height="163" rx="17" fill="var(--hero-card-back)" stroke="var(--hero-line)" stroke-width="1.3"/>
      <path d="M-78-52h181M-73-65h4m8 0h4m8 0h4" stroke="var(--hero-mark)" stroke-width="1.5" stroke-linecap="round" opacity=".65"/>
      <path d="M62-32h35m-27 12h27m-14 12h14" stroke="var(--hero-mark)" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
    </g>
    <g transform="translate(264 147) rotate(-8)">
      <rect x="-112" y="-73" width="221" height="164" rx="18" fill="var(--hero-card)" stroke="var(--hero-line)" stroke-width="1.35"/>
      <path d="M-112-42h221m-202-16h16m7 0h7" stroke="var(--hero-line)" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="-92" y="-23" width="89" height="93" rx="11" fill="var(--hero-tile)" stroke="var(--hero-line)"/>
      <path d="m-47.5-1 22 11v26l-22 11-22-11V10l22-11Z" stroke="var(--hero-ink)" stroke-width="2.25" stroke-linejoin="round"/>
      <path d="m-69.5 10 22 11 22-11m-22 11v26M-58.5 4.5l22 11" stroke="var(--hero-ink)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17-13h63M17 0h47m-47 11h57m-57 11h38" stroke="var(--hero-line)" stroke-width="3" stroke-linecap="round"/>
      <rect x="17" y="42" width="61" height="19" rx="5" fill="var(--hero-ink)"/>
      <path d="M33 51.5h20m-3-3 3 3-3 3" stroke="var(--hero-card)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(426 194) rotate(7)">
      <rect x="-40" y="-28" width="82" height="61" rx="12" fill="var(--hero-card)" stroke="var(--hero-line)" stroke-width="1.4"/>
      <rect x="-26" y="-12" width="28" height="28" rx="7" fill="var(--hero-tile)"/>
      <path d="m-20 1 6 6 10-11M12-3h15m-15 10h12" stroke="var(--hero-ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <path d="M149 61v20m-10-10h20m304 171v15m-7.5-7.5h15" stroke="var(--hero-mark)" stroke-width="1.45" stroke-linecap="round"/>
    <path d="m434 47 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="var(--hero-line)"/>
  </svg>`;
}
