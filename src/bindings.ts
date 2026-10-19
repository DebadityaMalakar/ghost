import { ForElement, IfElement, StoreElement } from "./elements";
import { createError } from "./lib/errors";
import { findStore } from "./lib/store";
import { fillPlaceholders, hasPlaceholders, toDisplay } from "./lib/template";

const isGhostElement = (el: Element) =>
  el instanceof StoreElement || el instanceof IfElement || el instanceof ForElement;

/** Fills {{store}} placeholders in a single leaf element. */
const renderLeaf = (element: Element) => {
  // The first render saves the original text so later renders can reuse it
  const raw = element.getAttribute("data-template") ?? element.textContent ?? "";
  if (!hasPlaceholders(raw)) return;

  if (!element.hasAttribute("data-template")) {
    element.setAttribute("data-template", raw);
  }

  element.textContent = fillPlaceholders(raw, (key) => {
    const store = findStore(key);
    if (store) return toDisplay(store.val);

    // Probably a loop variable that hasn't started yet; <for-element> fills it in later
    if (!element.closest("for-element")) {
      createError(`No <store-element> found with name "${key}".`, "StoreNotFoundError");
    }
    return toDisplay(null);
  });
};

/** Re-renders every {{placeholder}} and <if-element> on the page. */
export const renderBindings = () => {
  document.body?.querySelectorAll(":not(:has(*))").forEach((element) => {
    if (!isGhostElement(element)) renderLeaf(element);
  });

  document.querySelectorAll<IfElement>("if-element").forEach((el) => el.render());
};
