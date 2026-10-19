import { parseDuration } from "../lib/duration";
import { createError } from "../lib/errors";

// WCAG 2.3.1: never more than three flashes a second
const MAX_RATE = 3;
// WCAG 2.2.2: blinking that stops within 5 seconds needs no pause control
const MAX_DURATION_MS = 5000;

/**
 * <blink-element rate="1" duration="5s">
 *
 *   rate     – blinks per second (default 1, max 3)
 *   duration – how long to blink before settling (default and max "5s")
 *
 * Blinks again whenever its text changes, so it suits {{bindings}}.
 * Stays still for people who prefer reduced motion (see style.css).
 */
export class BlinkElement extends HTMLElement {
  static observedAttributes = ["rate", "duration"];

  private lastText = "";
  private readonly observer = new MutationObserver(() => this.onContentChange());

  connectedCallback() {
    this.lastText = this.textContent ?? "";
    this.observer.observe(this, { childList: true, subtree: true, characterData: true });
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  attributeChangedCallback() {
    this.configure();
  }

  /** Starts blinking again from the beginning. */
  restart() {
    this.style.animation = "none";
    void this.offsetWidth; // flush the style so the animation really restarts
    this.style.removeProperty("animation");
  }

  private onContentChange() {
    const text = this.textContent ?? "";
    if (text === this.lastText) return;
    this.lastText = text;
    this.restart();
  }

  private configure() {
    let rate = parseFloat(this.getAttribute("rate") ?? "") || 1;
    if (rate <= 0) rate = 1;
    if (rate > MAX_RATE) {
      createError(`<blink-element> rate ${rate} is capped at ${MAX_RATE} per second.`, "AccessibilityError");
      rate = MAX_RATE;
    }

    let durationMs = parseDuration(this.getAttribute("duration"), MAX_DURATION_MS);
    if (durationMs > MAX_DURATION_MS) {
      createError(`<blink-element> duration is capped at 5s.`, "AccessibilityError");
      durationMs = MAX_DURATION_MS;
    }

    const blinks = Math.max(1, Math.floor((durationMs / 1000) * rate));
    this.style.setProperty("--blink-period", `${1 / rate}s`);
    this.style.setProperty("--blink-count", String(blinks));
  }
}
