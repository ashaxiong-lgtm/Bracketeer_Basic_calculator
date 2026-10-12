# Bracketeer

A basic calculator with nested brackets, built with plain HTML, CSS and JavaScript.

## Features

- Operations: add (+), subtract (−), multiply (×), divide (÷)
- Brackets with nesting, e.g. `((2+3)×(4−1))÷5`, and implicit multiplication: `2(3+4)`
- Each bracket depth gets its own colour; unclosed brackets show a faded ghost `)`
- Live result preview while you type
- Clear (AC), backspace, decimal point, divide-by-zero and bracket error messages
- Keyboard support: digits, `+ - * /`, `( )`, `Enter`, `Backspace`, `Esc`
- Recent calculations, saved in the browser
- Responsive layout; no `eval()` is used (own expression parser)

## Run locally

Open `index.html` in a browser. No build step.

## Project structure

```
index.html   page structure
style.css    styling
engine.js    expression parser (no eval)
script.js    buttons, keyboard, display, history
```
