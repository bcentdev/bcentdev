// Builds the animated SVGs the profile README shows. Run: node build.mjs
//
// GitHub renders README images through <img>, so the SVGs get no scripts and no
// external requests: fonts are embedded as data URIs and all motion is CSS.
//
// Two visual systems live here on purpose:
// - The profile (hero.svg, career.svg) is the personal brand: Chrome DevTools
//   vernacular, Mona Sans and Mona Sans Mono (fonts/, SIL OFL 1.1), and the four
//   box-model colors. The career chart gives those colors a meaning, from the
//   inside out: content is writing code, padding is leading the team around it,
//   border is owning the architecture, margin is the company.
// - The AniJams card (anijams.svg) keeps the game's own look and fonts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const pct = (seconds, period) => `${((seconds / period) * 100).toFixed(2)}%`;
const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------------------------------------------------------------------------
// Personal brand
// ---------------------------------------------------------------------------

const B = {
  paper: "#F4F5F7",
  ink: "#16191F",
  inkSoft: "#596070",
  graphite: "#1D2027",
  raised: "#262A33",
  rule: "#343946",
  fog: "#9AA1B0",
  snow: "#E8EAEF",
  content: "#7FB2EA",
  padding: "#9CD08F",
  border: "#F2D16B",
  margin: "#F2A66A",
  rec: "#FF5A5F",
};

const brandFonts = (mono) => {
  const face = (family, file, range) =>
    `@font-face{font-family:${family};src:url(data:font/woff2;base64,${readFileSync(join("fonts", file)).toString("base64")}) format("woff2");${range}}`;
  return (
    face("Mona", "mona-sans.woff2", "font-weight:400 800;font-stretch:87.5% 125%") +
    (mono ? face("MonaMono", "mona-sans-mono.woff2", "font-weight:400 600") : "")
  );
};

// Every animated element's resting style is its final frame, so switching
// animations off for reduced motion leaves a finished, readable picture.
const BRAND_CSS = `
.m{font-family:Mona,system-ui,sans-serif}
.mono{font-family:MonaMono,ui-monospace,monospace;font-variant-ligatures:none;font-feature-settings:"calt" 0,"liga" 0}
.wide{font-stretch:125%}
.narrow{font-stretch:87.5%}
.box{transform-box:fill-box}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

function card({ w, h, title, desc, css, defs = "", body, mono = true }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="title desc">
<title id="title">${title}</title>
<desc id="desc">${desc}</desc>
<style>${brandFonts(mono)}${BRAND_CSS}${css}</style>
<defs>
<clipPath id="card"><rect width="${w}" height="${h}" rx="16"/></clipPath>
${defs}
</defs>
<g clip-path="url(#card)">
${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="15.5" fill="none" stroke="#000" stroke-opacity=".14"/>
</svg>
`;
}

// A rectangle with a hole: one ring of the box-model overlay.
const ring = (x, y, w, h, t) =>
  `M${x} ${y}h${w}v${h}h${-w}Z M${x + t} ${y + t}v${h - 2 * t}h${w - 2 * t}v${-(h - 2 * t)}Z`;

// WCAG contrast ratio, so the inspector tooltip reports the real number.
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi + 0.05) / (lo + 0.05)).toFixed(1);
}

function hero() {
  const w = 960;
  const page = 448;
  const h = 652;

  // The name is the inspected <h1>. Its content box is measured from the font
  // (Mona Sans at 125% width, weight 760, 116px, line-height 1).
  const size = 116;
  const lead = 116;
  const contentW = 480;
  const contentH = lead * 2;
  const M = 28;
  const Bd = 3;
  const P = 22;
  const mx = 56;
  const my = 36;
  const box = {
    margin: [mx, my, contentW + 2 * (M + Bd + P), contentH + 2 * (M + Bd + P)],
    border: [mx + M, my + M, contentW + 2 * (Bd + P), contentH + 2 * (Bd + P)],
    padding: [mx + M + Bd, my + M + Bd, contentW + 2 * P, contentH + 2 * P],
    content: [mx + M + Bd + P, my + M + Bd + P, contentW, contentH],
  };
  const [cx, cy] = box.content;
  const baseline = (i) => cy + i * lead + 102.6;
  const [mX, mY, mW, mH] = box.margin;

  const rings = [
    ["content", `M${cx} ${cy}h${contentW}v${contentH}h${-contentW}Z`, B.content, 0.45],
    ["padding", ring(...box.padding, P), B.padding, 0.5],
    ["border", ring(...box.border, Bd), B.border, 0.85],
    ["margin", ring(...box.margin, M), B.margin, 0.42],
  ]
    .map(
      ([layer, d, fill, opacity], i) =>
        `<path class="box grow" d="${d}" fill="${fill}" fill-opacity="${opacity}" fill-rule="evenodd" style="animation-delay:${(1.3 + i * 0.09).toFixed(2)}s"><title>${layer}</title></path>`,
    )
    .join("");

  // Extension lines, as DevTools draws them from the margin box to the edges.
  const guide = `stroke="${B.margin}" stroke-opacity=".7" stroke-dasharray="4 4"`;
  const guides = `<g class="fade" style="animation-delay:1.6s">
<path d="M0 ${mY}H${w}M0 ${mY + mH}H${w}" ${guide}/>
<path d="M${mX} 0V${page}M${mX + mW} 0V${page}" ${guide}/>
</g>`;

  // Rulers along the top and left edges, shown while inspecting.
  const ticks = (length, horizontal) =>
    Array.from({ length: Math.floor(length / 10) + 1 }, (_, i) => {
      const at = i * 10;
      const long = at % 100 === 0;
      const size = long ? 12 : at % 50 === 0 ? 7 : 4;
      const line = horizontal ? `M${at} 0v${size}` : `M0 ${at}h${size}`;
      const label =
        long && at > 0
          ? horizontal
            ? `<text class="m" x="${at + 3}" y="10" font-size="8.5" fill="${B.inkSoft}">${at}</text>`
            : `<text class="m" x="3" y="${at - 3}" font-size="8.5" fill="${B.inkSoft}">${at}</text>`
          : "";
      return `<path d="${line}" stroke="${B.inkSoft}" stroke-opacity=".55"/>${label}`;
    }).join("");
  const rulers = `<g class="fade" style="animation-delay:1.25s">
<rect width="${w}" height="14" fill="${B.paper}" fill-opacity=".85"/><rect width="14" height="${page}" fill="${B.paper}" fill-opacity=".85"/>
${ticks(w, true)}${ticks(page, false)}
</g>`;

  // Before paint the text is only layout: grey bars where the lines will go.
  const skeleton = [
    [cx, baseline(0) - 84, 350],
    [cx, baseline(1) - 84, 280],
  ]
    .map(([x, y, bw]) => `<rect x="${x}" y="${y}" width="${bw}" height="84" rx="10" fill="${B.ink}" fill-opacity=".07"/>`)
    .join("");

  // Paint lands condensed, then layout settles the name at its full 125% width.
  const nameLines = ["Vicente", "Torres"]
    .map(
      (line, i) =>
        `<g class="paint" style="animation-delay:${(0.35 + i * 0.14).toFixed(2)}s"><text class="m wide stretch" x="${cx - 4}" y="${baseline(i)}" font-size="${size}" font-weight="760" letter-spacing="-1.5" fill="${B.ink}" style="animation-delay:${(0.55 + i * 0.08).toFixed(2)}s">${line}</text></g>`,
    )
    .join("");
  const flash = `<rect class="flash" x="${cx}" y="${cy}" width="${contentW}" height="${contentH}" fill="${B.padding}"/>`;

  const subtitle = `<text class="m paint" x="${cx}" y="${mY + mH + 44}" font-size="21" fill="${B.inkSoft}" style="animation-delay:.7s">Eleven years building for the web. The last five at Holded.</text>`;

  // The DevTools element tooltip, with the real contrast ratio of the name.
  const tx = mX + mW + 22;
  const ty = my + 54;
  const tw = w - tx - 32;
  const ratio = contrast(B.ink, B.paper);
  const row = (y, label, value) =>
    `<text class="m" x="${tx + 14}" y="${y}" font-size="12.5" fill="${B.inkSoft}">${label}</text><text class="m" x="${tx + tw - 14}" y="${y}" font-size="12.5" fill="${B.ink}" text-anchor="end">${value}</text>`;
  const tooltip = `<g class="pop" style="animation-delay:1.55s">
<path d="M${tx} ${ty + 22}l-7 6 7 6Z" fill="#fff"/>
<rect x="${tx}" y="${ty}" width="${tw}" height="126" rx="8" fill="#fff" filter="url(#lift)"/>
<text class="m" x="${tx + 14}" y="${ty + 26}" font-size="13" font-weight="600"><tspan fill="#9B3FA8">h1</tspan><tspan fill="#2F5DB8">.vicente-torres</tspan></text>
<text class="m" x="${tx + tw - 14}" y="${ty + 26}" font-size="12.5" fill="${B.inkSoft}" text-anchor="end">${contentW + 2 * (P + Bd)} × ${contentH + 2 * (P + Bd)}</text>
<path d="M${tx + 14} ${ty + 40}H${tx + tw - 14}" stroke="${B.ink}" stroke-opacity=".1"/>
${row(ty + 62, "Contrast", `Aa ${ratio}`)}
<circle cx="${tx + tw - 14 - 62}" cy="${ty + 58}" r="6" fill="#2E9E5B"/><path d="M${tx + tw - 79} ${ty + 58}l2 2 3.5-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${row(ty + 86, "Name", "Vicente Torres")}
${row(ty + 110, "Role", "heading")}
</g>`;

  const cursor = `<g class="cursor"><path d="M0 0v18l4.6-4.2 3.1 6.6 2.7-1.2-3-6.5h6.3Z" fill="#fff" stroke="${B.ink}" stroke-width="1.2" stroke-linejoin="round"/></g>`;

  // DevTools, docked below the page.
  const dy = page;
  const tabs = ["Elements", "Console", "Sources", "Performance"];
  let tabX = 24;
  const tabRow = tabs
    .map((tab, i) => {
      const x = tabX;
      tabX += tab.length * 7.2 + 30;
      const active = i === 0;
      return `<text class="m" x="${x}" y="${dy + 23}" font-size="12.5" fill="${active ? B.snow : B.fog}">${tab}</text>${
        active ? `<rect x="${x}" y="${dy + 33}" width="${tab.length * 7.2}" height="2" fill="${B.content}"/>` : ""
      }`;
    })
    .join("");
  const split = 492;
  const paneTabs = ["Styles", "Computed", "Layout"]
    .map((tab, i) => {
      const x = split + 20 + i * 76;
      return `<text class="m" x="${x}" y="${dy + 23}" font-size="12.5" fill="${i === 0 ? B.snow : B.fog}">${tab}</text>${
        i === 0 ? `<rect x="${x}" y="${dy + 33}" width="40" height="2" fill="${B.content}"/>` : ""
      }`;
    })
    .join("");

  const code = (x, y, parts) =>
    `<text class="mono" x="${x}" y="${y}" font-size="13" xml:space="preserve">${parts
      .map(([text, fill, extra = ""]) => `<tspan fill="${fill}"${extra}>${esc(text)}</tspan>`)
      .join("")}</text>`;
  const tag = B.content;
  const attr = B.border;
  const val = B.margin;
  const txt = B.snow;
  const dim = B.fog;
  const line = 23;
  const top = dy + 64;
  const dom = [
    [["<", dim], ["main", tag], [" class", attr], ['="', dim], ["profile", val], ['">', dim]],
    [["  <", dim], ["h1", tag], [" class", attr], ['="', dim], ["vicente-torres", val], ['">', dim], ["Vicente Torres", txt], ["</", dim], ["h1", tag], [">", dim]],
    [["  <", dim], ["p", tag], [">", dim], ["Eleven years building…", txt], ["</", dim], ["p", tag], [">", dim]],
    [["  <", dim], ["section", tag], [" id", attr], ['="', dim], ["career", val], ['">', dim], ["…", txt], ["</", dim], ["section", tag], [">", dim]],
    [["  <", dim], ["section", tag], [" id", attr], ['="', dim], ["weekends", val], ['">', dim], ["…", txt], ["</", dim], ["section", tag], [">", dim]],
    [["</", dim], ["main", tag], [">", dim]],
  ]
    .map((parts, i) => code(24, top + i * line, parts))
    .join("");
  const selected = `<g class="fade" style="animation-delay:1.3s"><rect x="0" y="${top + line - 16}" width="${split}" height="${line}" fill="${B.content}" fill-opacity=".16"/><text class="mono" x="${24 + 50 * 8.03}" y="${top + line}" font-size="13" fill="${B.fog}">== $0</text></g>`;

  const decl = (name, value, url = false) => [
    ["  ", txt],
    [name, B.content],
    [": ", dim],
    url ? ["url(", txt] : [value, txt],
    ...(url ? [[value, B.border, ' text-decoration="underline"'], [")", txt]] : []),
    [";", dim],
  ];
  const rules = [
    [[".vicente-torres", B.margin], [" {", dim]],
    decl("--role", "Tech Lead at Holded"),
    decl("--owns", "frontend architecture"),
    decl("--stack", "React, TypeScript"),
    decl("--team", "hiring and growing it"),
    decl("--weekends", "anijams.com", true),
    [["}", dim]],
  ]
    .map(
      (parts, i) =>
        `<g class="rule" style="animation-delay:${(1.42 + i * 0.06).toFixed(2)}s">${code(split + 20, top - 4 + i * 21, parts)}</g>`,
    )
    .join("");
  const source = `<text class="m" x="${w - 24}" y="${top - 4}" font-size="12" fill="${B.fog}" text-anchor="end" text-decoration="underline">career.css:2015</text>`;

  const css = `
.paint{animation:paint .6s cubic-bezier(.2,.7,.2,1) backwards}
.stretch{animation:stretch .9s cubic-bezier(.6,0,.2,1) backwards}
@keyframes stretch{from{font-stretch:87.5%;letter-spacing:0}}
@keyframes paint{from{opacity:0;filter:blur(6px)}}
.flash{opacity:0;animation:flash .5s ease-out .38s}
@keyframes flash{0%{opacity:0}20%{opacity:.35}100%{opacity:0}}
.skel{opacity:0;animation:skel .8s ease-out}
@keyframes skel{0%,55%{opacity:1}100%{opacity:0}}
.grow{transform-origin:50% 50%;animation:grow .42s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes grow{from{opacity:0;transform:scale(.97)}}
.fade{animation:fade .5s ease backwards}
@keyframes fade{from{opacity:0}}
.pop{transform-box:fill-box;transform-origin:0 50%;animation:pop .32s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes pop{from{opacity:0;transform:translateX(-6px) scale(.98)}}
.rule{animation:rule .35s ease-out backwards}
@keyframes rule{from{opacity:0;transform:translateX(-6px)}}
.cursor{transform:translate(${cx + contentW - 40}px,${cy + contentH - 70}px);animation:cursor 1s cubic-bezier(.3,.7,.2,1) .55s backwards}
@keyframes cursor{from{opacity:0;transform:translate(${w - 60}px,${page - 30}px)}30%{opacity:1}}`;

  const defs = `<filter id="lift" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="${B.ink}" flood-opacity=".16"/><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${B.ink}" flood-opacity=".12"/></filter>`;

  const body = `
<rect width="${w}" height="${page}" fill="${B.paper}"/>
<g class="skel">${skeleton}</g>
${guides}
${rings}
${flash}
${nameLines}
${subtitle}
${rulers}
${tooltip}
<rect y="${dy}" width="${w}" height="${h - dy}" fill="${B.graphite}"/>
<path d="M0 ${dy + 0.5}H${w}M0 ${dy + 35.5}H${w}M${split + 0.5} ${dy + 36}V${h}" stroke="${B.rule}"/>
${tabRow}
${paneTabs}
${selected}
${dom}
${source}
${rules}
${cursor}`;

  return card({
    w,
    h,
    title: "Vicente Torres, Tech Lead at Holded",
    desc: "The name Vicente Torres, inspected in browser developer tools. Eleven years building for the web, the last five at Holded. Its styles read: role, Tech Lead at Holded; owns the frontend architecture; stack, React and TypeScript; team, hiring and growing it; weekends, anijams.com.",
    css,
    defs,
    body,
  });
}

function career() {
  const w = 960;
  const h = 372;
  const now = new Date();
  // Months counted from March 2015, the first day at work.
  const month = (year, m) => (year - 2015) * 12 + (m - 3);
  const nowEnd = month(now.getFullYear(), now.getMonth() + 1) + 1;
  const total = nowEnd + 1;
  const X0 = 24;
  const X1 = w - 24;
  const x = (m) => X0 + (m / total) * (X1 - X0);

  const years = Math.floor((nowEnd - 0) / 12);
  const months = nowEnd % 12;
  const tenure = `${years} years ${months} month${months === 1 ? "" : "s"}`;

  const companies = [
    ["Xerintel", month(2015, 3), month(2017, 2)],
    ["ALEA", month(2017, 4), month(2018, 9)],
    ["Boxmotions", month(2018, 9), month(2020, 9)],
    ["Master Camping", month(2020, 9), month(2021, 11)],
    ["Holded", month(2021, 11), nowEnd],
  ];
  const roles = [
    ["Intern", month(2015, 3), month(2015, 7), B.content],
    ["Full-stack developer", month(2015, 7), month(2017, 2), B.content],
    ["Software engineer", month(2017, 4), month(2018, 9), B.content],
    ["Full-stack developer", month(2018, 9), month(2020, 9), B.content],
    ["Full-stack developer", month(2020, 9), month(2021, 11), B.content],
    ["Frontend developer", month(2021, 11), month(2024, 9), B.content],
    ["Frontend lead", month(2024, 9), month(2026, 9), B.padding],
    ["Tech lead", month(2026, 9), nowEnd, B.border],
  ];

  const header = 44;
  const rulerY = header + 26;
  const timingsY = rulerY + 18;
  const mainY = timingsY + 58;
  const d0 = mainY + 16;
  const d1 = d0 + 25;
  const spanH = 23;
  const tracksEnd = d1 + spanH + 8;

  // Labels are cut with an ellipsis when the span is too short, as DevTools does.
  const fit = (label, width, size) => {
    const room = width - 10;
    const per = size * 0.42;
    if (label.length * per <= room) return label;
    const n = Math.floor(room / per) - 1;
    return n >= 3 ? `${label.slice(0, n)}…` : "";
  };
  const span = (label, from, to, y, fill) => {
    const sx = x(from) + 0.5;
    const sw = Math.max(x(to) - x(from) - 1, 2);
    const text = fit(label, sw, 12);
    return `<rect x="${sx.toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${spanH}" rx="3" fill="${fill}"/>${
      text ? `<text class="m narrow" x="${(sx + 5).toFixed(1)}" y="${y + 16}" font-size="12" font-weight="500" fill="${B.ink}">${text}</text>` : ""
    }`;
  };

  const grid = [];
  const labels = [];
  for (let year = 2015; year <= now.getFullYear(); year++) {
    const gx = year === 2015 ? X0 : x(month(year, 1));
    grid.push(`<path d="M${gx.toFixed(1)} ${rulerY + 6}V${tracksEnd}" stroke="${B.rule}" stroke-opacity=".7"/>`);
    labels.push(`<text class="m" x="${(gx + 4).toFixed(1)}" y="${rulerY}" font-size="11.5" fill="${B.fog}">${year}</text>`);
  }

  const marks = [
    ["Moved to Barcelona", month(2017, 4)],
    ["Launched AniJams", month(2026, 7) + 0.9],
  ]
    .map(([label, at]) => {
      const mx = x(at);
      const end = mx > w - 200;
      return `<path d="M${mx.toFixed(1)} ${timingsY + 20}l5 5-5 5-5-5Z" fill="${B.margin}"/><text class="m" x="${(end ? mx - 10 : mx + 10).toFixed(1)}" y="${timingsY + 29}" font-size="12.5" fill="${B.snow}" text-anchor="${end ? "end" : "start"}">${label}</text>`;
    })
    .join("");

  const trackTitle = (label, y) =>
    `<path d="M${X0} ${y - 8}l4 5 4-5Z" fill="${B.fog}"/><text class="m" x="${X0 + 14}" y="${y}" font-size="12" font-weight="600" fill="${B.fog}">${label}</text>`;

  const xNow = x(nowEnd);
  const tlX = x(month(2026, 9));

  const tipW = 256;
  const tipX = xNow - tipW + 6;
  const tipY = tracksEnd + 20;
  const tip = `<g class="tip">
<path d="M${(tlX + (xNow - tlX) / 2).toFixed(1)} ${d1 + spanH}V${tipY}" stroke="${B.snow}" stroke-opacity=".5"/>
<rect x="${tipX.toFixed(1)}" y="${tipY}" width="${tipW}" height="54" rx="8" fill="${B.raised}" stroke="${B.rule}"/>
<text class="m" x="${(tipX + 14).toFixed(1)}" y="${tipY + 23}" font-size="14" font-weight="600" fill="${B.snow}">Tech Lead at Holded</text>
<text class="m" x="${(tipX + 14).toFixed(1)}" y="${tipY + 42}" font-size="12.5" fill="${B.fog}">Since September 2026, still recording</text>
</g>`;
  const selectedTl = `<rect class="tip" x="${(tlX - 1.5).toFixed(1)}" y="${d1 - 2}" width="${(xNow - tlX + 2).toFixed(1)}" height="${spanH + 4}" rx="4" fill="none" stroke="${B.snow}" stroke-width="1.5"/>`;

  const legend = [
    ["Content", "writing code", B.content],
    ["Padding", "leading the team", B.padding],
    ["Border", "owning the architecture", B.border],
    ["Margin", "the company around it", B.margin],
  ];
  const legendY = h - 34;
  let lx = X0;
  const legendRow = legend
    .map(([layer, meaning, fill]) => {
      const out = `<rect x="${lx}" y="${legendY - 10}" width="12" height="12" rx="2.5" fill="${fill}"/><text class="m" x="${lx + 20}" y="${legendY}" font-size="13" fill="${B.snow}">${layer}<tspan fill="${B.fog}"> is ${meaning}</tspan></text>`;
      lx += 20 + (layer.length + meaning.length + 4) * 6.6 + 30;
      return out;
    })
    .join("");

  const sweep = 2.5;
  const start = 0.35;
  const travel = (xNow - X0).toFixed(1);
  const css = `
.curtain{animation:sweep ${sweep}s cubic-bezier(.45,.05,.4,1) ${start}s backwards;transform:translateX(${travel}px)}
@keyframes sweep{from{transform:translateX(0)}}
.rec{animation:rec 1.4s ease-in-out infinite}
@keyframes rec{50%{opacity:.25}}
.tip{animation:tip .4s cubic-bezier(.2,.8,.2,1) ${(start + sweep + 0.1).toFixed(2)}s backwards}
@keyframes tip{from{opacity:0;transform:translateY(4px)}}`;

  const body = `
<rect width="${w}" height="${h}" fill="${B.graphite}"/>
<circle class="rec" cx="${X0 + 6}" cy="23" r="6" fill="${B.rec}"/>
<text class="m" x="${X0 + 22}" y="28" font-size="15" font-weight="600" fill="${B.snow}">Career, recorded since March 2015</text>
<text class="m" x="${X1}" y="28" font-size="13" fill="${B.fog}" text-anchor="end">${tenure}</text>
<path d="M0 ${header + 0.5}H${w}" stroke="${B.rule}"/>
${labels.join("")}
${grid.join("")}
${trackTitle("Timings", timingsY + 4)}
${marks}
${trackTitle("Main", mainY + 4)}
${companies.map(([label, from, to]) => span(label, from, to, d0, B.margin)).join("")}
${roles.map(([label, from, to, fill]) => span(label, from, to, d1, fill)).join("")}
<g class="curtain">
<rect x="${X0}" y="${timingsY + 12}" width="${X1 - X0 + 40}" height="${tracksEnd - timingsY - 12}" fill="${B.graphite}"/>
<path d="M${X0} ${rulerY + 8}V${tracksEnd}" stroke="${B.rec}" stroke-width="1.5"/>
<path d="M${X0 - 5} ${rulerY + 6}h10l-5 6Z" fill="${B.rec}"/>
</g>
${selectedTl}
${tip}
<path d="M0 ${legendY - 30.5}H${w}" stroke="${B.rule}"/>
${legendRow}`;

  return card({
    w,
    h,
    title: "Career, as a performance recording",
    desc: `A flame chart of a career, recorded since March 2015. Xerintel in Jerez, intern then full-stack developer, 2015 to 2017. Moved to Barcelona in April 2017. ALEA, software engineer, 2017 to 2018. Boxmotions, full-stack developer, 2018 to 2020. Master Camping, full-stack developer, 2020 to 2021. Holded since November 2021: frontend developer, frontend lead from September 2024, Tech Lead since September 2026. Launched AniJams in July 2026. Colors follow the box model: content is writing code, padding is leading the team, border is owning the architecture, margin is the company.`,
    css,
    body,
    mono: false,
  });
}

// ---------------------------------------------------------------------------
// AniJams card, in the game's own style
// ---------------------------------------------------------------------------

// The fonts are the AniJams subsets (Zen Kaku Gothic New, DotGothic16; SIL OFL 1.1).
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

const BASE_CSS = `
.zen{font-family:Zen,system-ui,sans-serif}
.dot{font-family:Dot,ui-monospace,monospace}
.kana{font-family:Kana,sans-serif}
.box{transform-box:fill-box}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

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
const out = { "hero.svg": hero(), "career.svg": career(), "anijams.svg": aniJams() };
for (const [file, content] of Object.entries(out)) {
  writeFileSync(join("assets", file), content);
  console.log(`assets/${file}  ${(content.length / 1024).toFixed(1)} KB`);
}
