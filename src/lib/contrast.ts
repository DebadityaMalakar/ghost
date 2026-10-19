/** sRGB channels 0–255 plus alpha 0–1. */
type RGBA = [number, number, number, number];

const WHITE: RGBA = [255, 255, 255, 1];

let ctx: CanvasRenderingContext2D | null = null;

/**
 * Converts any CSS color the browser understands (named, hex, hsl, oklch…)
 * to RGBA by painting one pixel and reading it back.
 */
export const toRGBA = (color: string): RGBA => {
  ctx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return WHITE;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
};

/** Paints `top` over an opaque `bottom`. */
const over = ([r, g, b, a]: RGBA, [br, bg, bb]: RGBA): RGBA => [
  r * a + br * (1 - a),
  g * a + bg * (1 - a),
  b * a + bb * (1 - a),
  1,
];

/** The solid color behind `element`, blending see-through backgrounds of its ancestors. */
const backgroundOf = (element: Element): RGBA => {
  const layers: RGBA[] = [];
  for (let el: Element | null = element; el; el = el.parentElement) {
    const color = toRGBA(getComputedStyle(el).backgroundColor);
    if (color[3] === 0) continue;
    layers.push(color);
    if (color[3] === 1) break;
  }
  // Blend from the furthest layer inwards, starting on the white page canvas
  return layers.reduceRight<RGBA>((below, layer) => over(layer, below), WHITE);
};

/** WCAG relative luminance. */
const luminance = ([r, g, b]: RGBA) => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio (1–21) between an element's text and its background. */
export const contrastRatio = (element: Element) => {
  const background = backgroundOf(element);
  const text = over(toRGBA(getComputedStyle(element).color), background);
  const [light, dark] = [luminance(text), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

/** WCAG AA minimum: 3:1 for large text (24px, or 18.66px bold), 4.5:1 otherwise. */
export const requiredContrast = (element: Element) => {
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const bold = parseInt(style.fontWeight, 10) >= 700;
  return size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
};
