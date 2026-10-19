import { parseDuration } from "../lib/duration";
import { createError, requireAttribute } from "../lib/errors";
import { findStore } from "../lib/store";
import { fillPlaceholders, toDisplay } from "../lib/template";
import { parseLoopExpr, type LoopSpec } from "./loop-expr";

/**
 * <for-element expr="let i=0; i <= 10; i++" timeout="0s" interval="1s" loop="true">
 *
 *   expr     – for-loop header split by ";"
 *   timeout  – delay before the loop starts (e.g. "0s", "500ms")
 *   interval – delay between ticks         (e.g. "1s", "200ms")
 *   loop     – if "true", restarts after the loop finishes
 *
 * Children are a template. On each tick every {{var}} is replaced with
 * the loop variable (or a store value with that name).
 */
export class ForElement extends HTMLElement {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  private spec: LoopSpec | null = null;
  private value = 0;
  private shouldLoop = false;

  // The original innerHTML, captured when the loop starts
  private template = "";

  constructor() {
    super();
    requireAttribute(this, "expr");
  }

  connectedCallback() {
    // Capture before the page bindings replace {{var}} with "null"
    if (!this.template) this.template = this.innerHTML;
  }

  start() {
    if (this.running || !this.load()) return;

    this.shouldLoop = this.getAttribute("loop") === "true";
    // Only capture once: after the first tick innerHTML holds rendered values
    if (!this.template) this.template = this.innerHTML;
    this.running = true;

    const timeoutMs = parseDuration(this.getAttribute("timeout"), 0);
    this.timeoutId = setTimeout(() => this.tickRepeatedly(), timeoutMs);
  }

  stop() {
    if (this.intervalId !== null) clearInterval(this.intervalId);
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.intervalId = null;
    this.timeoutId = null;
    this.running = false;
  }

  resume() {
    if (this.running) return;
    // Never started, so there is nothing to resume
    if (!this.spec) {
      this.start();
      return;
    }
    this.running = true;
    this.tickRepeatedly();
  }

  reset() {
    this.stop();
    this.load();
    if (this.template) this.render(null);
  }

  /** Parses `expr` and rewinds the loop variable to its starting value. */
  private load(): boolean {
    const spec = parseLoopExpr(this.getAttribute("expr") ?? "");
    if (!spec) return false;
    this.spec = spec;
    this.value = spec.initial;
    return true;
  }

  /** Renders one tick now, then one every `interval`. */
  private tickRepeatedly() {
    const intervalMs = parseDuration(this.getAttribute("interval"), 1000);
    this.tick();
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  private tick() {
    if (!this.spec) return;

    if (!this.spec.condition(this.value)) {
      if (this.shouldLoop) {
        this.load();
        this.tick(); // show the first frame of the next cycle right away
      } else {
        this.stop();
      }
      return;
    }

    this.render(this.value);
    this.value = this.spec.step(this.value);
  }

  /** Fills the template; a `null` loop value shows as "null". */
  private render(loopValue: number | null) {
    const varName = this.spec?.varName;
    this.innerHTML = fillPlaceholders(this.template, (key) => {
      if (key === varName) return toDisplay(loopValue);

      const store = findStore(key);
      if (store) return toDisplay(store.val);

      createError(`Unknown variable "{{${key}}}" in <for-element>.`, "StoreNotFoundError");
      return toDisplay(null);
    });
  }
}
