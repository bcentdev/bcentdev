// Builds the animated SVGs the profile README shows. Run: node build.mjs
//
// GitHub renders README images through <img>, so the SVGs get no scripts and no
// external requests: fonts are embedded as data URIs and all motion is CSS.
// The fonts are the AniJams subsets (Zen Kaku Gothic New, DotGothic16; SIL OFL 1.1),
// so the profile and the game read as the same hand.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FONT_DIR = process.env.FONT_DIR ?? join(homedir(), "Projects/anijams/fonts");

const C = {
  night: "#14122b",
  panel: "#1e1b3e",
  edge: "#2e2a5c",
  wave: "#3b3672",
  neon: "#ff4d8f",
  cyan: "#53e8ff",
  cream: "#fff3df",
  dim: "#b9b2d0",
};

const FONTS = {
  zen400: ["Zen", 400, "zen-kaku-gothic-new-400-4.woff2"],
  zen500: ["Zen", 500, "zen-kaku-gothic-new-500-6.woff2"],
  zen700: ["Zen", 700, "zen-kaku-gothic-new-700-8.woff2"],
  dot: ["Dot", 400, "dotgothic16-400-2.woff2"],
  kana: ["Kana", 400, "dotgothic16-400-1.woff2"],
};

const fontFaces = (keys) =>
  keys
    .map((key) => {
      const [family, weight, file] = FONTS[key];
      const data = readFileSync(join(FONT_DIR, file)).toString("base64");
      return `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;
    })
    .join("");

// Every animated element's resting style is its final frame, so switching
// animations off for reduced motion leaves a finished, readable picture.
const BASE_CSS = `
.zen{font-family:Zen,system-ui,sans-serif}
.dot{font-family:Dot,ui-monospace,monospace}
.kana{font-family:Kana,sans-serif}
.box{transform-box:fill-box}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

const pct = (seconds, period) => `${((seconds / period) * 100).toFixed(2)}%`;

function svg({ w, h, title, desc, fonts, css, defs = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="title desc">
<title id="title">${title}</title>
<desc id="desc">${desc}</desc>
<style>${fontFaces(fonts)}${BASE_CSS}${css}</style>
<defs>
<clipPath id="frame"><rect width="${w}" height="${h}" rx="18"/></clipPath>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="2" width="4" height="2" fill="#000" fill-opacity=".12"/></pattern>
${defs}
</defs>
<g clip-path="url(#frame)">
<rect width="${w}" height="${h}" fill="${C.night}"/>
${body}
<rect width="${w}" height="${h}" fill="url(#scan)" pointer-events="none"/>
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="17.5" fill="none" stroke="${C.edge}"/>
</svg>
`;
}

function equalizer(x, baseline) {
  const bars = [0.55, 1, 0.7, 0.9, 0.45];
  return bars
    .map(
      (scale, i) =>
        `<rect class="box eq" x="${x + i * 6}" y="${baseline - 14}" width="3.5" height="14" rx="1" fill="${C.neon}" style="animation-duration:${0.7 + scale * 0.5}s;animation-delay:-${i * 0.23}s"/>`,
    )
    .join("");
}

function hero() {
  const w = 960;
  const h = 480;
  const kana = ["ビ", "セ", "ン", "テ", "・", "ト", "ー", "レ", "ス"];
  const kanaX = 872;
  const column = kana
    .map((ch, i) => {
      const y = 82 + i * 44;
      // Vertical Japanese turns the long-vowel bar upright.
      const turn = ch === "ー" ? ` transform="rotate(90 ${kanaX} ${y - 14})"` : "";
      return `<g class="k" style="animation-delay:${(0.45 + i * 0.07).toFixed(2)}s"><text class="kana" x="${kanaX}" y="${y}" text-anchor="middle" font-size="40" fill="${C.neon}" filter="url(#neon)"${turn}>${ch}</text></g>`;
    })
    .join("");

  const credits = [
    ["Direction", "Tech Lead at Holded"],
    ["Architecture", "The Holded frontend, in React and TypeScript"],
    ["Casting", "Hiring and growing the frontend team"],
    ["Original work", "AniJams, the daily anime music game"],
  ]
    .map(([role, name], i) => {
      const y = 352 + i * 32;
      return `<g class="credit" style="animation-delay:${(1.35 + i * 0.12).toFixed(2)}s">
<text class="dot" x="48" y="${y}" font-size="16" fill="${C.cyan}">${role}</text>
<text class="zen" x="200" y="${y}" font-size="19" font-weight="500" fill="${C.cream}">${name}</text>
</g>`;
    })
    .join("");

  const css = `
.sweep{opacity:0;animation:sweep .8s cubic-bezier(.6,0,.35,1) .05s backwards}
@keyframes sweep{from{opacity:1;transform:translateX(0)}to{opacity:1;transform:translateX(1500px)}}
.k{animation:drop .35s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes drop{from{opacity:0;transform:translateY(-22px)}}
.rise{animation:rise .7s cubic-bezier(.2,.8,.2,1) .3s backwards}
@keyframes rise{from{transform:translateY(124px)}}
.credit{animation:credit .5s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes credit{from{opacity:0;transform:translateX(-10px)}}
.airing{animation:fade .4s ease .2s backwards}
@keyframes fade{from{opacity:0}}
.eq{transform-origin:50% 100%;animation:eq ease-in-out infinite alternate}
@keyframes eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}`;

  const defs = `
<radialGradient id="glow" cx="${kanaX}" cy="230" r="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.neon}" stop-opacity=".2"/><stop offset="1" stop-color="${C.neon}" stop-opacity="0"/></radialGradient>
<radialGradient id="glow2" cx="120" cy="480" r="360" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".07"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
<linearGradient id="streak" x1="0" x2="1"><stop offset="0" stop-color="${C.neon}" stop-opacity="0"/><stop offset=".7" stop-color="${C.neon}" stop-opacity=".45"/><stop offset=".94" stop-color="${C.cream}" stop-opacity=".8"/><stop offset="1" stop-color="${C.cream}" stop-opacity="0"/></linearGradient>
<filter id="neon" x="-50%" y="-20%" width="200%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${C.neon}" flood-opacity=".75"/></filter>
<clipPath id="line1"><rect x="0" y="60" width="780" height="118"/></clipPath>
<clipPath id="line2"><rect x="0" y="152" width="780" height="118"/></clipPath>`;

  const body = `
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<rect width="${w}" height="${h}" fill="url(#glow2)"/>
<g transform="skewX(-24)"><rect class="sweep" x="-300" y="0" width="420" height="${h}" fill="url(#streak)"/></g>
<g class="airing">${equalizer(48, 58)}<text class="dot" x="86" y="58" font-size="16" fill="${C.dim}">Now airing: episode 7</text></g>
<g clip-path="url(#line1)"><text class="zen rise" x="42" y="160" font-size="100" font-weight="700" letter-spacing="-2" fill="${C.cream}">Vicente</text></g>
<g clip-path="url(#line2)"><text class="zen rise" x="42" y="252" font-size="100" font-weight="700" letter-spacing="-2" fill="${C.cream}" style="animation-delay:.42s">Torres</text></g>
<text class="zen credit" x="44" y="300" font-size="21" fill="${C.dim}" style="animation-delay:1.1s">From intern in Jerez to Tech Lead in Barcelona.</text>
${credits}
${column}`;

  return svg({
    w,
    h,
    title: "Vicente Torres, Tech Lead at Holded",
    desc: "From intern in Jerez to Tech Lead in Barcelona. Opening credits: direction, Tech Lead at Holded; architecture, the Holded frontend in React and TypeScript; casting, hiring and growing the frontend team; original work, AniJams.",
    fonts: ["zen400", "zen500", "zen700", "dot", "kana"],
    css,
    defs,
    body,
  });
}

function episodes() {
  const w = 960;
  const h = 470;
  const list = [
    ["2015", "Full Stack Developer", "Xerintel", 23],
    ["2017", "Software Engineer", "ALEA", 17],
    ["2018", "Full Stack Developer", "Boxmotions", 24],
    ["2020", "Full Stack Developer", "Master Camping", 14],
    ["2021", "Frontend Developer", "Holded", 35],
    ["2024", "Frontend Lead", "Holded", 24],
    ["2026", "Tech Lead", "Holded", 1],
  ];
  const top = 118;
  const step = 50;
  const barX = 700;
  const barW = 220;
  // Tenure in months, so every bar is drawn to the same scale.
  const longest = Math.max(...list.map((row) => row[3]));
  const runtime = (months) => {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return [years && `${years}y`, rest && `${rest}m`].filter(Boolean).join(" ");
  };

  const rows = list
    .map(([year, role, company, months], i) => {
      const y = top + i * step;
      const airing = i === list.length - 1;
      const fill = Math.max(months / longest, 0.04);
      const delay = (0.3 + i * 0.32).toFixed(2);
      const status = airing
        ? `<circle class="rec" cx="${barX - 88}" cy="${y - 5}" r="4.5" fill="${C.neon}"/><text class="dot" x="${barX - 76}" y="${y}" font-size="16" fill="${C.neon}">airing</text>`
        : `<text class="dot" x="${barX - 88}" y="${y}" font-size="16" fill="${C.dim}">${runtime(months)}</text>`;
      return `${airing ? `<rect x="24" y="${y - 32}" width="${w - 48}" height="${step - 4}" rx="10" fill="${C.neon}" fill-opacity=".07"/>` : ""}
<text class="dot" x="44" y="${y}" font-size="20" fill="${airing ? C.neon : C.dim}">${String(i + 1).padStart(2, "0")}</text>
<text class="dot" x="100" y="${y}" font-size="16" fill="${C.dim}">${year}</text>
<text class="zen" x="176" y="${y}" font-size="19" font-weight="500" fill="${C.cream}">${role}</text>
<text class="zen" x="430" y="${y}" font-size="17" fill="${C.dim}">${company}</text>
${status}
<rect x="${barX}" y="${y - 8}" width="${barW}" height="4" rx="2" fill="${C.edge}"/>
<rect class="box watch" x="${barX}" y="${y - 8}" width="${(barW * fill).toFixed(1)}" height="4" rx="2" fill="${airing ? C.neon : C.cream}" fill-opacity="${airing ? 1 : 0.55}" style="animation-delay:${delay}s"/>`;
    })
    .join("\n");

  // The rows at Holded are joined, so the promotions read as a ladder.
  const holded = list.flatMap((row, i) => (row[2] === "Holded" ? [top + i * step - 5] : []));
  const ladder = `<path d="M418 ${holded[0]}V${holded.at(-1)}" stroke="${C.edge}" stroke-width="2"/>${holded
    .map((cy, i) => `<circle cx="418" cy="${cy}" r="3.5" fill="${i === holded.length - 1 ? C.neon : C.edge}"/>`)
    .join("")}`;

  const css = `
.watch{transform-origin:0 50%;animation:watch .45s cubic-bezier(.4,0,.2,1) backwards}
@keyframes watch{from{transform:scaleX(0)}}
.rec{animation:blink 1.6s steps(2) infinite}
@keyframes blink{50%{opacity:.2}}`;

  const body = `
<text class="zen" x="44" y="62" font-size="24" font-weight="700" fill="${C.cream}">Episode guide</text>
<text class="dot" x="${w - 44}" y="62" font-size="16" fill="${C.dim}" text-anchor="end">2015 to now</text>
${ladder}
${rows}`;

  return svg({
    w,
    h,
    title: "Career, as an episode guide",
    desc: "2015 Full Stack Developer at Xerintel, starting as an intern. 2017 Software Engineer at ALEA. 2018 Full Stack Developer at Boxmotions. 2020 Full Stack Developer at Master Camping. 2021 Frontend Developer at Holded, promoted to Frontend Lead in 2024 and to Tech Lead in 2026.",
    fonts: ["zen400", "zen500", "zen700", "dot"],
    css,
    body,
  });
}

function aniJams() {
  const w = 960;
  const h = 300;
  const unlocks = [1, 2, 4, 7, 11, 16];
  const total = unlocks.at(-1);
  const x0 = 472;
  const span = 444;
  const bars = 64;
  const mid = 140;
  const tickY = 220;

  const heights = Array.from({ length: bars }, (_, i) => {
    const t = i / bars;
    const envelope = 0.6 + 0.4 * Math.min(1, t * 3);
    const texture = 0.4 + 0.6 * Math.abs(Math.sin(i * 1.71) * Math.cos(i * 0.43 + 1));
    return Math.max(4, 84 * envelope * texture);
  });
  const segmentOf = (i) => unlocks.findIndex((s) => ((i + 0.5) / bars) * total < s);
  const bar = (i, fill) => {
    const bh = heights[i];
    return `<rect x="${(x0 + i * (span / bars)).toFixed(1)}" y="${(mid - bh / 2).toFixed(1)}" width="4.5" height="${bh.toFixed(1)}" rx="1.5" fill="${fill}"/>`;
  };
  const tick = (k, fill) => {
    const x = x0 + (unlocks[k] / total) * span;
    const anchor = k === unlocks.length - 1 ? "end" : "middle";
    return `<text class="dot" x="${x.toFixed(1)}" y="${tickY}" font-size="13" fill="${fill}" text-anchor="${anchor}">${unlocks[k]}s</text>`;
  };

  // Each try unlocks more of the clip, 1s, 2s, 4s... The loop replays that
  // schedule; each segment gets its own keyframes so they all reset together.
  const period = 12;
  const start = (k) => 0.4 + k * 1.5;
  const off = 11;
  const keyframes = unlocks
    .map((_, k) => {
      const on = start(k);
      return `@keyframes s${k}{0%,${pct(on, period)}{opacity:0}${pct(on + 0.25, period)},${pct(off, period)}{opacity:1}${pct(off + 0.4, period)},100%{opacity:0}}`;
    })
    .join("");
  const segments = unlocks
    .map((_, k) => {
      const lit = heights
        .map((_, i) => i)
        .filter((i) => segmentOf(i) === k)
        .map((i) => bar(i, C.neon))
        .join("");
      return `<g class="seg" style="animation-name:s${k}${k === 0 ? ";opacity:1" : ""}">${lit}${tick(k, C.neon)}</g>`;
    })
    .join("");

  const stats = [
    ["1,527", "songs", 44],
    ["394", "anime", 172],
    ["0", "frameworks", 270],
  ]
    .map(
      ([value, label, x]) =>
        `<text class="zen" x="${x}" y="226" font-size="30" font-weight="700" fill="${C.cream}">${value}</text><text class="dot" x="${x}" y="252" font-size="16" fill="${C.dim}">${label}</text>`,
    )
    .join("");

  const css = `
.seg{opacity:0;animation:${period}s linear infinite}
${keyframes}`;

  const defs = `
<filter id="neon" x="-20%" y="-50%" width="140%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${C.neon}" flood-opacity=".8"/></filter>
<radialGradient id="glow" cx="${x0 + span / 2}" cy="${mid}" r="340" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.neon}" stop-opacity=".12"/><stop offset="1" stop-color="${C.neon}" stop-opacity="0"/></radialGradient>`;

  const body = `
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<text class="dot" x="44" y="88" font-size="48" fill="${C.cream}" filter="url(#neon)">AniJams</text>
<text class="zen" x="44" y="130" font-size="20" fill="${C.cream}">One second of an anime opening.</text>
<text class="zen" x="44" y="158" font-size="20" fill="${C.dim}">Name the show, or hear a little more.</text>
${stats}
${heights.map((_, i) => bar(i, C.wave)).join("")}
${unlocks.map((_, k) => tick(k, C.wave)).join("")}
${segments}
<text class="dot" x="916" y="262" font-size="16" fill="${C.neon}" text-anchor="end">Play today's song at anijams.com</text>`;

  return svg({
    w,
    h,
    title: "AniJams",
    desc: "AniJams, the daily anime music game: one second of an anime opening, name the show or hear a little more. 1,527 songs, 394 anime, zero frameworks. Play today's song at anijams.com.",
    fonts: ["zen400", "zen700", "dot"],
    css,
    defs,
    body,
  });
}

mkdirSync("assets", { recursive: true });
const out = { "op.svg": hero(), "episodes.svg": episodes(), "anijams.svg": aniJams() };
for (const [file, content] of Object.entries(out)) {
  writeFileSync(join("assets", file), content);
  console.log(`assets/${file}  ${(content.length / 1024).toFixed(1)} KB`);
}
