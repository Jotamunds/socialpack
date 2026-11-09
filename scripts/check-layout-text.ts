import { crc32, deflateSync, inflateSync } from "node:zlib";
import { polaroidHeadlineBox } from "../src/components/cards/PostCanvas";
import { CAMPAIGN_LAYOUTS } from "../src/lib/campaign-layouts";
import type { PostFormat } from "../src/lib/post-format";
import { renderPostToPngBuffer } from "../src/lib/rendering/satori-renderer";
import type { CompanyProfile, GeneratedPost } from "../src/lib/types";

const FIXED = new Set([0, 1, 2, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30]);

const HEADLINES = [
  { kind: "curto", text: "Café da casa" },
  { kind: "longo", text: "O café da casa, feito devagar para acompanhar a semana inteira" },
  { kind: "preferencia", text: "E aí, qual é a sua preferência" },
  { kind: "fim-de-semana", text: "O fim de semana pede pizza" },
  { kind: "familia", text: "Hoje a mesa é da família" },
];

const company: CompanyProfile = {
  name: "Pizzaria Napoli",
  categoryId: "alimentacao",
  nicheId: "pizzaria",
  city: "Curitiba",
  instagram: "pizzarianapoli",
  toneId: "acolhedor",
  colors: { primary: "#523A28", secondary: "#F3C774", accent: "#f2c200" },
};

function lightPng() {
  const w = 16;
  const h = 16;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (w * 4 + 1);
    raw[o] = 0;
    for (let x = 0; x < w; x++) {
      const p = o + 1 + x * 4;
      raw[p] = 255;
      raw[p + 1] = 246;
      raw[p + 2] = 220;
      raw[p + 3] = 255;
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const t = Buffer.from(type);
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const body = Buffer.concat([t, data]);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const imageUrl = `data:image/png;base64,${lightPng().toString("base64")}`;

function post(layout: number, format: PostFormat, headline: string, subheadline: string): GeneratedPost {
  return {
    id: "post-1",
    day: "Sexta",
    theme: "Fim de semana",
    badgeText: "Fim de semana",
    headline,
    subheadline,
    cta: "Chame a família",
    caption: "x",
    hashtags: ["#pizza"],
    layout,
    format,
    imageUrl,
  } as GeneratedPost;
}

type Rgba = { w: number; h: number; px: Uint8Array };

function decode(png: Buffer): Rgba {
  let pos = 8;
  let w = 0;
  let h = 0;
  const idat: Buffer[] = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.toString("ascii", pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(w * h * 4);
  const stride = w * 4;
  let i = 0;
  let prev = new Uint8Array(stride);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[i++];
    const row = raw.subarray(i, i + stride);
    i += stride;
    const out = px.subarray(y * stride, y * stride + stride);
    for (let x = 0; x < stride; x++) out[x] = row[x];
    if (filter === 1) {
      for (let x = 0; x < stride; x++) out[x] = (out[x] + (x >= 4 ? out[x - 4] : 0)) & 255;
    } else if (filter === 2) {
      for (let x = 0; x < stride; x++) out[x] = (out[x] + prev[x]) & 255;
    } else if (filter === 3) {
      for (let x = 0; x < stride; x++) out[x] = (out[x] + (((x >= 4 ? out[x - 4] : 0) + prev[x]) >> 1)) & 255;
    } else if (filter === 4) {
      for (let x = 0; x < stride; x++) out[x] = (out[x] + paeth(x >= 4 ? out[x - 4] : 0, prev[x], x >= 4 ? prev[x - 4] : 0)) & 255;
    }
    prev = out;
  }
  return { w, h, px };
}

function lum(r: number, g: number, b: number) {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: number[], b: number[]) {
  const l1 = lum(a[0], a[1], a[2]);
  const l2 = lum(b[0], b[1], b[2]);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function inspect(full: Rgba, blank: Rgba) {
  const { w, h, px } = full;
  const mask = new Uint8Array(w * h);
  let cores = 0;
  let weak = 0;
  let edge = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dr = Math.abs(px[i] - blank.px[i]);
      const dg = Math.abs(px[i + 1] - blank.px[i + 1]);
      const db = Math.abs(px[i + 2] - blank.px[i + 2]);
      if (Math.max(dr, dg, db) < 80) continue;
      mask[y * w + x] = 1;
      cores++;
      if (contrast([px[i], px[i + 1], px[i + 2]], [blank.px[i], blank.px[i + 1], blank.px[i + 2]]) < 3) weak++;
      if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) edge++;
    }
  }
  let overlap = false;
  let cut = false;
  for (let x = 0; x < w; x += 4) {
    let start = -1;
    let prevEnd = -1;
    for (let y = 0; y <= h; y++) {
      const on = y < h && mask[y * w + x] === 1;
      if (on && start < 0) start = y;
      if (!on && start >= 0) {
        if (prevEnd >= 0 && start - prevEnd < 2) overlap = true;
        prevEnd = y - 1;
        start = -1;
      }
    }
  }
  let bandStart = -1;
  const bands: Array<[number, number]> = [];
  for (let y = 0; y <= h; y++) {
    let row = 0;
    if (y < h) {
      for (let x = 0; x < w; x += 2) if (mask[y * w + x]) row++;
    }
    const on = row > 4;
    if (on && bandStart < 0) bandStart = y;
    if (!on && bandStart >= 0) {
      bands.push([bandStart, y - 1]);
      bandStart = -1;
    }
  }
  for (const [y0, y1] of bands) {
    let minX = w;
    let maxX = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    let rows = 0;
    let right = 0;
    for (let y = y0; y <= y1; y++) {
      let hit = false;
      for (let x = 0; x < w; x++) if (mask[y * w + x]) hit = true;
      if (!hit) continue;
      rows++;
      if (mask[y * w + maxX] || (maxX > 0 && mask[y * w + maxX - 1])) right++;
    }
    if (rows > 12 && maxX - minX > 80 && right / rows > 0.85) cut = true;
  }
  const kinds: string[] = [];
  if (edge > 0) kinds.push("borda");
  if (overlap) kinds.push("sobreposicao");
  if (cores > 40 && weak / cores > 0.2) kinds.push("contraste");
  if (cut) kinds.push("corte");
  return kinds;
}

/** Título do Polaroid no cartão girado 4°. Falha se a tinta passar da altura reservada ou da borda branca. */
function polaroidTitleOverflow(full: Rgba, reserved: number) {
  const { w, h, px } = full;
  const cx = 515;
  const cy = 446;
  const cos = Math.cos((4 * Math.PI) / 180);
  const sin = Math.sin((4 * Math.PI) / 180);
  const points: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!(px[i] < 50 && px[i + 1] < 55 && px[i + 2] < 80)) continue;
      let white = 0;
      for (const [nx, ny] of [[x + 6, y], [x - 6, y], [x, y + 6], [x, y - 6]] as const) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = (ny * w + nx) * 4;
        if (px[j] > 235 && px[j + 1] > 235 && px[j + 2] > 225) white++;
      }
      if (white < 3) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      points.push([dx * cos + dy * sin + 310, -dx * sin + dy * cos + 350]);
    }
  }
  points.sort((a, b) => a[1] - b[1]);
  const clusters: Array<Array<[number, number]>> = [];
  for (const point of points) {
    const current = clusters[clusters.length - 1];
    if (!current || point[1] - current[current.length - 1][1] > 24) clusters.push([point]);
    else current.push(point);
  }
  const title = clusters.filter((cluster) => cluster.length > 80).sort((a, b) => b.length - a.length)[0];
  const kinds: string[] = [];
  if (!title) return ["altura"];
  const ys = title.map((point) => point[1]);
  const height = Math.max(...ys) - Math.min(...ys) + 1;
  if (height > reserved + 1) kinds.push("altura");
  const escaped = clusters.some(
    (cluster) => cluster.length > 40 && cluster.some(([lx, ly]) => lx < -1 || ly < -1 || lx > 621 || ly > 701),
  );
  if (escaped) kinds.push("cartao");
  return kinds;
}

function formatsFor(layout: number): PostFormat[] {
  return layout <= 6 ? ["square"] : ["square", "portrait", "story"];
}

async function main() {
  const layouts = [0, 1, 2, 3, 4, 5, 6, ...CAMPAIGN_LAYOUTS.map((item) => item.id)];
  const failures: string[] = [];
  let fixedFailures = 0;
  for (const layout of layouts) {
    for (const format of formatsFor(layout)) {
      let blank: Rgba;
      try {
        blank = decode(await renderPostToPngBuffer(post(layout, format, ".", "."), company));
      } catch (error) {
        const line = `layout ${layout} ${format}: erro ${error instanceof Error ? error.message.split("\n")[0] : "render"}`;
        console.log(line);
        failures.push(line);
        if (FIXED.has(layout)) fixedFailures++;
        continue;
      }
      for (const headline of HEADLINES) {
        let png: Buffer;
        try {
          png = await renderPostToPngBuffer(
            post(layout, format, headline.text, "Um sabor para a galera e outro para quem sempre pede diferente."),
            company,
          );
        } catch (error) {
          const line = `layout ${layout} ${format} ${headline.kind}: erro ${error instanceof Error ? error.message.split("\n")[0] : "render"}`;
          console.log(line);
          failures.push(line);
          if (FIXED.has(layout)) fixedFailures++;
          continue;
        }
        const decoded = decode(png);
        const kinds = inspect(decoded, blank);
        if (layout === 1) {
          const box = polaroidHeadlineBox(headline.text);
          for (const kind of polaroidTitleOverflow(decoded, box.height)) {
            if (!kinds.includes(kind)) kinds.push(kind);
          }
        }
        const label = `layout ${layout} ${format} ${headline.kind}`;
        if (kinds.length === 0) {
          console.log(`${label}: ok`);
          continue;
        }
        const line = `${label}: ${kinds.join(", ")}`;
        console.log(line);
        failures.push(line);
        if (FIXED.has(layout)) fixedFailures++;
      }
    }
  }
  console.log(`\nFalhas em layouts corrigidos: ${fixedFailures}`);
  console.log(`Falhas em outros layouts: ${failures.length - fixedFailures}`);
  if (fixedFailures > 0) process.exit(1);
}

main();
