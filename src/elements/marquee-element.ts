import { createError } from "../lib/errors";

type Axis = "x" | "y";
type Behavior = "scroll" | "alternate";

const DIRECTIONS: Record<string, { axis: Axis; reverse: boolean }> = {
  left: { axis: "x", reverse: false },
  right: { axis: "x", reverse: true },
  up: { axis: "y", reverse: false },
  down: { axis: "y", reverse: true },
};
const BEHAVIORS: readonly string[] = ["scroll", "alternate"];
const DEFAULT_SPEED = 60; // px per second

const div = (className: string) => {
  const el = document.createElement("div");
  el.className = className;
  return el;
};

/**
 * <marquee-element direction="left" behavior="scroll" speed="60" loop="infinite">
 *
 *   direction – left | right | up | down        (default left)
 *   behavior  – scroll (seamless) | alternate    (default scroll)
 *   speed     – pixels per second                (default 60)
 *   loop      – number of runs, or "infinite"    (default infinite)
 *   height    – box height for up / down         (default 6em)
 *   paused    – present while paused
 *
 * Renders a pause/play button and pauses on hover or keyboard focus.
 * Screen readers read the content once; the copy used for the seamless
 * loop is hidden from them. With reduced motion it's just static text.
 *
 * Light DOM result:
 *   <div class="marquee-viewport">
 *     <div class="marquee-track">
 *       <div class="marquee-content">…your children…</div>
 *       <div class="marquee-content" aria-hidden="true" inert>…copy…</div>
 *     </div>
 *   </div>
 *   <button class="marquee-toggle">
 */
export class MarqueeElement extends HTMLElement {
  static observedAttributes = ["direction", "behavior", "speed", "loop", "height", "paused"];

  private viewport: HTMLDivElement | null = null;
  private content: HTMLDivElement | null = null;
  private clone: HTMLDivElement | null = null;
  private toggle: HTMLButtonElement | null = null;

  private axis: Axis = "x";
  private behavior: Behavior = "scroll";
  private speed = DEFAULT_SPEED;

  private readonly resizeObserver = new ResizeObserver(() => this.measure());
  private readonly mutationObserver = new MutationObserver(() => this.syncClone());

  get paused() {
    return this.hasAttribute("paused");
  }

  set paused(value: boolean) {
    this.toggleAttribute("paused", value);
  }

  /** Same names as the old <marquee>. */
  start() {
    this.paused = false;
  }

  stop() {
    this.paused = true;
  }

  connectedCallback() {
    if (!this.content) this.build();
    this.configure();
    this.resizeObserver.observe(this.viewport!);
    this.resizeObserver.observe(this.content!);
    this.mutationObserver.observe(this.content!, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    this.mutationObserver.disconnect();
  }

  attributeChangedCallback(name: string) {
    if (!this.content) return; // not built yet; connectedCallback configures
    if (name === "paused") this.updateToggle();
    else this.configure();
  }

  /** Moves the children into a scrolling track and adds the pause button. */
  private build() {
    this.viewport = div("marquee-viewport");
    const track = div("marquee-track");
    this.content = div("marquee-content");
    this.content.append(...this.childNodes);

    this.clone = div("marquee-content");
    this.clone.setAttribute("aria-hidden", "true");
    this.clone.inert = true; // nothing in the copy can be focused or clicked
    this.syncClone();

    track.append(this.content, this.clone);
    this.viewport.append(track);

    this.toggle = document.createElement("button");
    this.toggle.type = "button";
    this.toggle.className = "marquee-toggle";
    this.toggle.append(document.createElement("span"));
    this.toggle.addEventListener("click", () => (this.paused = !this.paused));

    this.append(this.viewport, this.toggle);
    this.updateToggle();
  }

  private syncClone() {
    if (!this.content || !this.clone) return;
    this.clone.replaceChildren(...[...this.content.childNodes].map((n) => n.cloneNode(true)));
  }

  private updateToggle() {
    if (!this.toggle) return;
    const paused = this.paused;
    this.toggle.setAttribute("aria-label", paused ? "Play scrolling text" : "Pause scrolling text");
    // ︎ asks for the text glyph, not an emoji
    this.toggle.firstElementChild!.textContent = paused ? "▶︎" : "❚❚";
    this.toggle.firstElementChild!.setAttribute("aria-hidden", "true");
  }

  /** Reads the attributes into data-* hooks and CSS variables for style.css. */
  private configure() {
    const direction = this.getAttribute("direction") ?? "left";
    let spec = DIRECTIONS[direction];
    if (!spec) {
      createError(`<marquee-element> direction must be left, right, up or down: "${direction}"`, "AttributeError");
      spec = DIRECTIONS.left;
    }

    const behavior = this.getAttribute("behavior") ?? "scroll";
    if (BEHAVIORS.includes(behavior)) {
      this.behavior = behavior as Behavior;
    } else {
      createError(`<marquee-element> behavior must be scroll or alternate: "${behavior}"`, "AttributeError");
      this.behavior = "scroll";
    }

    const speed = parseFloat(this.getAttribute("speed") ?? "");
    this.speed = speed > 0 ? speed : DEFAULT_SPEED;

    const loop = this.getAttribute("loop");
    const runs = parseInt(loop ?? "", 10);
    this.style.setProperty("--marquee-iterations", runs > 0 ? String(runs) : "infinite");

    const height = this.getAttribute("height");
    if (height && CSS.supports("block-size", height)) this.style.setProperty("--marquee-height", height);
    else this.style.removeProperty("--marquee-height");

    this.axis = spec.axis;
    this.dataset.axis = spec.axis;
    this.dataset.behavior = this.behavior;
    this.toggleAttribute("data-reverse", spec.reverse);
    this.measure();
  }

  /** Turns the speed into an animation duration for the current sizes. */
  private measure() {
    if (!this.viewport || !this.content) return;
    const horizontal = this.axis === "x";
    const contentSize = horizontal ? this.content.offsetWidth : this.content.offsetHeight;
    const viewportSize = horizontal ? this.viewport.clientWidth : this.viewport.clientHeight;

    // alternate bounces between the two edges; scroll moves one full copy
    const bounce = viewportSize - contentSize;
    const distance = this.behavior === "scroll" ? contentSize : Math.abs(bounce);

    this.style.setProperty("--marquee-distance", `${bounce}px`);
    this.style.setProperty("--marquee-duration", `${Math.max(distance / this.speed, 0.5)}s`);
  }
}
