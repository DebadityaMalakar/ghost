<p align="center">
  <img src="public/icon-192.png" alt="ghost logo" width="128" height="128" />
</p>

<h1 align="center">ghost</h1>

<p align="center"><em>Programming in plain HTML — state, conditionals and loops as custom elements.</em></p>

---

> **⚠️ This is a for-fun project, not for real use.**
> It's an experiment, not a framework. There are no tests, no stability guarantees,
> and expressions are evaluated with `Function()` behind a simple regex check.
> Please don't ship it to production.

## What is this?

HTML on its own is a markup language: it describes a page but can't _compute_ anything.
**ghost** is a small TypeScript implementation that adds basic programming capabilities
to HTML through custom elements, so you can write logic directly in your markup:

- **State** — `<store-element>` holds named values
- **Conditionals** — `<if-element>` shows content only when an expression is true
- **Loops** — `<for-element>` repeats over a counter on a timer
- **Bindings** — `{{name}}` anywhere in text shows a value and updates automatically

The idea is to give HTML the building blocks a Turing-complete language needs —
memory, branching and repetition — while you keep writing HTML.
The TypeScript is only the engine underneath.

Rules the project sticks to:

- **No Shadow DOM.** Everything renders into the normal page, so regular CSS just works.
- **Small and readable.** Each element is one short file.

## Example

```html
<store-element name="counter" val="0"></store-element>

<h1>{{counter}}</h1>

<if-element expr="{{counter}} > 10">
  <p>The counter is greater than 10!</p>
</if-element>

<for-element expr="let i=0; i <= 10; i++" timeout="0s" interval="1s" loop="true">
  <p>Looping: {{i}}</p>
</for-element>
```

## Elements

### `<store-element>`

Holds a named value.

| Attribute | Required | Description                 |
| --------- | -------- | --------------------------- |
| `name`    | yes      | Name used in `{{name}}`     |
| `val`     | no       | Starting value              |

Setting `.val` from JavaScript re-renders every binding on the page:

```js
document.querySelector('store-element[name="counter"]').val = 5;
```

### `<if-element>`

Shows its children only while `expr` is true.

| Attribute | Required | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| `expr`    | yes      | e.g. `{{counter}} > 10`. Numbers and operators only after `{{}}` values are filled in |

A missing store counts as `0` inside an expression.

### `<for-element>`

Repeats its children like a `for` loop, one step per tick.

| Attribute  | Required | Description                                            |
| ---------- | -------- | ------------------------------------------------------ |
| `expr`     | yes      | Loop header, e.g. `let i=0; i <= 10; i++`              |
| `timeout`  | no       | Delay before starting (`"0s"`, `"500ms"`). Default `0` |
| `interval` | no       | Delay between steps. Default `1s`                      |
| `loop`     | no       | `"true"` to start over when finished                   |

Supported steps: `i++`, `i--`, `i+=n`, `i-=n`, `i*=n`, `i/=n`, `i=i+n`.

Control it from JavaScript with `start()`, `stop()`, `resume()` and `reset()`.

### `{{bindings}}`

- `{{name}}` in text shows the value of the matching store (or the loop variable inside a `<for-element>`).
- A value that doesn't exist or hasn't been set yet shows as **`null`**.
- Unknown names also show a red error box on the page, to help catch typos.

## Running it

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev      # start the dev server
bun run build    # type-check and build to dist/
bun run icons    # re-render the logo PNGs from assets/logo.svg
```

## Project layout

```
assets/logo.svg          source logo (edit this, then `bun run icons`)
scripts/rasterize.ts     Bun script: SVG → favicon + PNG icons (via resvg)
public/                  favicon and generated icons
src/
  main.ts                startup
  bindings.ts            fills in {{placeholders}} and <if-element>s
  demo.ts                demo button handlers for index.html
  elements/
    store-element.ts
    if-element.ts
    for-element.ts
    loop-expr.ts         parses "let i=0; i<=10; i++"
  lib/
    errors.ts            on-page error messages
    store.ts             store lookup + change listeners
    template.ts          {{placeholder}} replacement
    duration.ts          "1s" / "500ms" → milliseconds
  style.css
```

## License

[MIT](LICENSE) © 2026 Debaditya Malakar
