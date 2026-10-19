import type { ForElement } from "./elements";
import { findStore } from "./lib/store";

const onClick = (id: string, handler: () => void) => {
  document.getElementById(id)?.addEventListener("click", handler);
};

const changeCounter = (delta: number) => {
  const store = findStore("counter");
  if (!store) return;
  store.val = (parseInt(store.val?.toString() ?? "0", 10) + delta).toString();
};

const loop = () => document.querySelector<ForElement>("for-element");

/** Wires up the demo buttons in index.html. */
export const bindDemoControls = () => {
  onClick("add", () => changeCounter(1));
  onClick("sub", () => changeCounter(-1));
  onClick("startloop", () => loop()?.start());
  onClick("stoploop", () => loop()?.stop());
  onClick("resumeloop", () => loop()?.resume());
  onClick("resetloop", () => loop()?.reset());
};
