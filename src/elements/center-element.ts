import { createError } from "../lib/errors";

/**
 * <center-element width="40rem">
 *
 *   width – optional max width, for a readable centered column
 *
 * Centers its text and its block children. Layout only, no semantics.
 */
export class CenterElement extends HTMLElement {
  static observedAttributes = ["width"];

  attributeChangedCallback(_name: string, _old: string | null, value: string | null) {
    if (value === null) {
      this.style.removeProperty("--center-width");
    } else if (CSS.supports("max-inline-size", value)) {
      this.style.setProperty("--center-width", value);
    } else {
      createError(`<center-element> has an invalid width: "${value}"`, "AttributeError");
    }
  }
}
