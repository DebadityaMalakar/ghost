import { bindDemoControls } from "./demo";
import { registerElements } from "./elements";
import { renderBindings } from "./bindings";
import { subscribe } from "./lib/store";

document.addEventListener("DOMContentLoaded", () => {
  registerElements();
  renderBindings();
  subscribe(renderBindings);
  bindDemoControls();
});
