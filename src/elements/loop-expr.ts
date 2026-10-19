import { createError } from "../lib/errors";

// Variable names, numbers and operators only.
const SAFE_EXPRESSION = /^[\w\s+\-*/().><=!&|]+$/;

export interface LoopSpec {
  varName: string;
  initial: number;
  condition: (v: number) => boolean;
  step: (v: number) => number;
}

const fail = (message: string) => {
  createError(message, "ExpressionError");
  return null;
};

/** "let i = 0" / "var i=0" / "i=0" → { varName, initial } */
const parseInit = (init: string) => {
  const match = init.match(/^(?:let|var|const)?\s*(\w+)\s*=\s*([\d.+-]+)$/);
  if (!match) return fail(`<for-element> cannot parse init: "${init}"`);
  return { varName: match[1], initial: parseFloat(match[2]) };
};

/** "i <= 10" → (v) => v <= 10 */
const compileCondition = (cond: string, varName: string) => {
  if (!SAFE_EXPRESSION.test(cond)) {
    return fail(`Unsafe condition in <for-element>: "${cond}"`);
  }
  try {
    return Function(
      "v",
      `"use strict"; const ${varName}=v; return !!(${cond});`
    ) as LoopSpec["condition"];
  } catch {
    return fail(`Failed to compile condition: "${cond}"`);
  }
};

/** Turns a step like i++, i--, i+=n, i*=n or i=i+n into a function body. */
const stepBody = (step: string, varName: string): string | null => {
  const normalized = step.replace(/\s+/g, "");

  if (normalized === `${varName}++` || normalized === `++${varName}`) return "return v + 1;";
  if (normalized === `${varName}--` || normalized === `--${varName}`) return "return v - 1;";

  const compound = normalized.match(new RegExp(`^${varName}([+\\-*/])=([\\d.]+)$`));
  if (compound) {
    const [, op, n] = compound;
    if (!SAFE_EXPRESSION.test(n)) return fail(`Unsafe step in <for-element>: "${step}"`);
    return `return v ${op} ${n};`;
  }

  const assign = normalized.match(new RegExp(`^${varName}=(.+)$`));
  if (assign) {
    const rhs = assign[1].replace(new RegExp(`\\b${varName}\\b`, "g"), "v");
    if (!SAFE_EXPRESSION.test(rhs)) return fail(`Unsafe step in <for-element>: "${step}"`);
    return `return ${rhs};`;
  }

  return fail(`<for-element> cannot parse step: "${step}"`);
};

const compileStep = (step: string, varName: string) => {
  const body = stepBody(step, varName);
  if (body === null) return null;
  try {
    return Function("v", `"use strict"; ${body}`) as LoopSpec["step"];
  } catch {
    return fail(`Failed to compile step: "${step}"`);
  }
};

/** Parses a for-loop header like "let i=0; i <= 10; i++". */
export const parseLoopExpr = (expr: string): LoopSpec | null => {
  const parts = expr.split(";").map((s) => s.trim());
  if (parts.length !== 3) {
    return fail(`<for-element> expr must have exactly 3 parts separated by ";": "${expr}"`);
  }
  const [initPart, condPart, stepPart] = parts;

  const init = parseInit(initPart);
  if (!init) return null;

  const condition = compileCondition(condPart, init.varName);
  if (!condition) return null;

  const step = compileStep(stepPart, init.varName);
  if (!step) return null;

  return { ...init, condition, step };
};
