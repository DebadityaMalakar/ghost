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
- **Retro, rebuilt** — `<blink-element>`, `<marquee-element>`, `<center-element>` and
  `<font-element>`: the elements the web deprecated, back with clean CSS animations
  and proper accessibility

The idea is to give HTML the building blocks a Turing-complete language needs —
memory, branching and repetition — while you keep writing HTML.
The TypeScript is only the engine underneath.

Rules the project sticks to:

- **No Shadow DOM.** Everything renders into the normal page, so regular CSS just works.
- **Small and readable.** Each element is one short file.
- **Accessible motion.** Anything that moves respects `prefers-reduced-motion`, and anything
  that moves for more than 5 seconds can be paused (WCAG 2.2.2).

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

### Retro elements

The old tags were removed from HTML because they were bad for readability and
accessibility. These versions keep the fun and fix the problems. Without
motion permission (`prefers-reduced-motion: reduce`) blink and marquee show
plain, still text.

```html
<center-element width="36rem">
  <font-element size="+2" face="Georgia, serif" color="#ffd84d">Welcome to my homepage</font-element>
  <p>Counter is now <blink-element>{{counter}}</blink-element></p>
  <marquee-element speed="70">
    <span>★ Under construction ★</span>
    <span>Counter: {{counter}}</span>
  </marquee-element>
</center-element>
```

#### `<blink-element>`

Fades in and out, then settles. It blinks again whenever its text changes, so
it works well around a `{{binding}}`.

| Attribute  | Required | Description                                              |
| ---------- | -------- | -------------------------------------------------------- |
| `rate`     | no       | Blinks per second. Default `1`, max `3` (WCAG 2.3.1)     |
| `duration` | no       | How long it blinks. Default and max `5s` (WCAG 2.2.2)    |

Values above the limits are capped and reported on the page. Call `restart()`
to blink again from JavaScript.

#### `<marquee-element>`

Seamless, GPU-friendly CSS scrolling with a built-in pause/play button.

| Attribute   | Required | Description                                        |
| ----------- | -------- | -------------------------------------------------- |
| `direction` | no       | `left` (default), `right`, `up` or `down`          |
| `behavior`  | no       | `scroll` (default, seamless loop) or `alternate` (bounce) |
| `speed`     | no       | Pixels per second. Default `60`                    |
| `loop`      | no       | Number of runs. Default `infinite`                 |
| `height`    | no       | Box height for `up` / `down`. Default `6em`        |
| `paused`    | no       | Present while paused                               |

- Pauses on its button, on hover, and while anything inside has keyboard focus.
- Screen readers read the content once; the copy used for the seamless loop is
  `aria-hidden` and `inert`.
- Control it from JavaScript with `start()`, `stop()` (the old `<marquee>` names) or `.paused`.
- Tweak the space between loops with the `--marquee-gap` CSS variable.

#### `<center-element>`

Centers its text and block children.

| Attribute | Required | Description                                  |
| --------- | -------- | -------------------------------------------- |
| `width`   | no       | Max width, for a readable centered column    |

#### `<font-element>`

| Attribute | Required | Description                                                         |
| --------- | -------- | ------------------------------------------------------------------- |
| `size`    | no       | `1`–`7`, `+n` / `-n` (relative to 3), or any CSS size like `1.25rem` |
| `color`   | no       | Any CSS color                                                       |
| `face`    | no       | A font-family list                                                  |

Legacy sizes are in `rem`, so they follow the page's text scale and browser zoom.
If `color` doesn't reach WCAG AA contrast against the background (4.5:1, or 3:1
for large text), a `ContrastError` appears on the page. It's styling only, so wrap
it in `<strong>` or `<em>` when the look carries meaning.

All four keep their default styles in `:where()`, so your own CSS always wins.

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
    blink-element.ts
    marquee-element.ts
    center-element.ts
    font-element.ts
  lib/
    errors.ts            on-page error messages
    store.ts             store lookup + change listeners
    template.ts          {{placeholder}} replacement
    duration.ts          "1s" / "500ms" → milliseconds
    contrast.ts          WCAG contrast ratio for <font-element>
  style.css
```

## License

[MIT](LICENSE) © 2026 Debaditya Malakar
