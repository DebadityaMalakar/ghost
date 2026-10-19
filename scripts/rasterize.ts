// Renders assets/logo.svg into the favicon + PNG icons in public/.
// Run with: bun run icons
import { Resvg } from "@resvg/resvg-js";

const SOURCE = "assets/logo.svg";
const OUT_DIR = "public";

const svg = await Bun.file(SOURCE).text();

/** The plain ghost on a transparent background. */
const transparent = svg.replace("<!--tile-->", "");

/** The ghost on a dark purple square, for app icons. */
const onTile = (radius: number) =>
  svg.replace(
    "<!--tile-->",
    `<rect width="256" height="256" rx="${radius}" fill="url(#tile)"/>`
  );

const outputs = [
  { file: "favicon-32.png", size: 32, svg: transparent },
  { file: "logo-512.png", size: 512, svg: transparent },
  { file: "icon-192.png", size: 192, svg: onTile(56) },
  { file: "icon-512.png", size: 512, svg: onTile(56) },
  // iOS rounds the corners itself, so this one stays square
  { file: "apple-touch-icon.png", size: 180, svg: onTile(0) },
];

const render = (source: string, size: number) =>
  new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng();

await Bun.write(`${OUT_DIR}/favicon.svg`, transparent);
console.log(`✓ ${OUT_DIR}/favicon.svg`);

for (const { file, size, svg } of outputs) {
  await Bun.write(`${OUT_DIR}/${file}`, render(svg, size));
  console.log(`✓ ${OUT_DIR}/${file} (${size}×${size})`);
}
