import { BlinkElement } from "./blink-element";
import { CenterElement } from "./center-element";
import { FontElement } from "./font-element";
import { ForElement } from "./for-element";
import { IfElement } from "./if-element";
import { MarqueeElement } from "./marquee-element";
import { StoreElement } from "./store-element";

export { BlinkElement, CenterElement, FontElement, ForElement, IfElement, MarqueeElement, StoreElement };

export const registerElements = () => {
  customElements.define("store-element", StoreElement);
  customElements.define("if-element", IfElement);
  customElements.define("for-element", ForElement);
  customElements.define("blink-element", BlinkElement);
  customElements.define("marquee-element", MarqueeElement);
  customElements.define("center-element", CenterElement);
  customElements.define("font-element", FontElement);
  customElements.upgrade(document.body);
};
