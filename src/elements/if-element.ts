import { createError, requireAttribute } from "../lib/errors";
import { findStore } from "../lib/store";
import { fillPlaceholders } from "../lib/template";

// After store values are substituted, only numbers and operators are allowed.
const SAFE_EXPRESSION = /^[\d\s+\-*/().><=!&|]+$/;

/**
 * <if-element expr="{{counter}} > 10">
 * Shows its children only while `expr` is true.
 */
export class IfElement extends HTMLElement {
  expr: string | null = null;

  constructor() {
    super();
    requireAttribute(this, "expr");
    this.expr = this.getAttribute("expr");
  }

  evaluate(): boolean {
    if (!this.expr) return false;

    const resolved = fillPlaceholders(
      this.expr,
      (key) => findStore(key)?.val?.toString() ?? "0"
    );

    if (!SAFE_EXPRESSION.test(resolved)) {
      createError(`Unsafe expression in <if-element>: "${resolved}"`, "ExpressionError");
      return false;
    }

    try {
      return Boolean(Function(`"use strict"; return (${resolved});`)());
    } catch {
      createError(`Failed to evaluate expression: "${resolved}"`, "ExpressionError");
      return false;
    }
  }

  render() {
    this.style.display = this.evaluate() ? "" : "none";
  }
}
