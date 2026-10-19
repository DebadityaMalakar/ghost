import { contrastRatio, requiredContrast } from "../lib/contrast";
import { createError } from "../lib/errors";

// Legacy <font size="1–7"> steps, in rem so they follow the page's text scale
const LEGACY_SIZES = [0.625, 0.8125, 1, 1.125, 1.5, 2, 3];
const BASE_SIZE = 3; // what "+1" / "-1" are relative to, like <basefont>

/** "1"–"7", "+2" / "-1", or any CSS font-size → a CSS value (null if invalid). */
export const parseFontSize = (value: string): string | null => {
  const v = value.trim();
  const legacy = v.match(/^([+-]?)(\d+)$/);
  if (legacy) {
    const [, sign, digits] = legacy;
    const n = Number(digits);
    const level = sign === "+" ? BASE_SIZE + n : sign === "-" ? BASE_SIZE - n : n;
    return `${LEGACY_SIZES[Math.min(Math.max(level, 1), 7) - 1]}rem`;
  }
  return CSS.supports("font-size", v) ? v : null;
};

/**
 * <font-element size="+2" color="gold" face="Georgia, serif">
 *
 *   size  – 1–7, +n / -n (relative to 3), or any CSS size ("1.25rem")
 *   color – any CSS color. Low-contrast colors are reported on the page
 *   face  – a font-family list
 *
 * Purely visual: wrap in <strong> / <em> when the styling carries meaning.
 */
export class FontElement extends HTMLElement {
  static observedAttributes = ["size", "color", "face"];

  private checkQueued = false;
  private lastWarning = "";

  connectedCallback() {
    this.queueContrastCheck();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "size") this.setStyle("font-size", value && parseFontSize(value), value);
    if (name === "face") this.setStyle("font-family", value, value);
    if (name === "color") this.setStyle("color", value, value);
    this.queueContrastCheck();
  }

  private setStyle(property: string, css: string | null, raw: string | null) {
    if (raw === null) {
      this.style.removeProperty(property);
      return;
    }
    if (!css || !CSS.supports(property, css)) {
      createError(`<font-element> has an invalid ${property}: "${raw}"`, "AttributeError");
      this.style.removeProperty(property);
      return;
    }
    this.style.setProperty(property, css);
  }

  /** Checks contrast once layout has settled; only when the author picked a color. */
  private queueContrastCheck() {
    if (this.checkQueued || !this.isConnected || !this.hasAttribute("color")) return;
    this.checkQueued = true;
    requestAnimationFrame(() => {
      this.checkQueued = false;
      this.checkContrast();
    });
  }

  private checkContrast() {
    const ratio = contrastRatio(this);
    const needed = requiredContrast(this);
    if (ratio >= needed) return;

    const warning =
      `<font-element color="${this.getAttribute("color")}"> has a contrast of ` +
      `${ratio.toFixed(2)}:1 against its background; WCAG AA needs ${needed}:1.`;
    if (warning === this.lastWarning) return;
    this.lastWarning = warning;
    createError(warning, "ContrastError");
  }
}
