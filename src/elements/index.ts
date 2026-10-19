import { ForElement } from "./for-element";
import { IfElement } from "./if-element";
import { StoreElement } from "./store-element";

export { ForElement, IfElement, StoreElement };

export const registerElements = () => {
  customElements.define("store-element", StoreElement);
  customElements.define("if-element", IfElement);
  customElements.define("for-element", ForElement);
  customElements.upgrade(document.body);
};
