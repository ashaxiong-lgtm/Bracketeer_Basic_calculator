/* Bracketeer engine: a small recursive-descent parser.
   Supports + − × ÷, unary minus, nested brackets and implicit
   multiplication such as 2(3+4). Never uses eval(). */

const Engine = (() => {
  const NUMBER = /^(\d+\.?\d*|\.\d+)(e[+\-−]?\d+)?/i;

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === " ") { i++; continue; }
      const m = src.slice(i).match(NUMBER);
      if (m) {
        tokens.push({ t: "num", v: parseFloat(m[0].replace("−", "-")) });
        i += m[0].length;
      } else if ("+−×÷()".includes(c)) {
        tokens.push({ t: c });
        i++;
      } else {
        throw new Error("Unexpected character: " + c);
      }
    }
    return tokens;
  }

  function parse(tokens) {
    let p = 0;
    const peek = () => (tokens[p] ? tokens[p].t : null);

    function expression() {
      let v = term();
      while (peek() === "+" || peek() === "−") {
        const op = tokens[p++].t;
        const r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }

    function term() {
      let v = unary();
      for (;;) {
        const t = peek();
        if (t === "×") { p++; v *= unary(); }
        else if (t === "÷") {
          p++;
          const d = unary();
          if (d === 0) throw new Error("Cannot divide by zero");
          v /= d;
        } else if (t === "(") { v *= unary(); } // implicit: 2(3+4), (1+2)(3+4)
        else break;
      }
      return v;
    }

    function unary() {
      if (peek() === "−") { p++; return -unary(); }
      if (peek() === "+") { p++; return unary(); }
      return primary();
    }

    function primary() {
      const tk = tokens[p];
      if (!tk) throw new Error("Incomplete expression");
      if (tk.t === "num") { p++; return tk.v; }
      if (tk.t === "(") {
        p++;
        const v = expression();
        if (peek() !== ")") throw new Error("Check your brackets");
        p++;
        return v;
      }
      throw new Error("Check your expression");
    }

    const result = expression();
    if (p < tokens.length) throw new Error("Check your brackets");
    return result;
  }

  /* Tidy a half-typed expression so it can be previewed:
     drop trailing operators / "(" and close any open brackets. */
  function tidy(src) {
    let s = src.replace(/[+−×÷(]+$/, "");
    const open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
    return s + ")".repeat(Math.max(open, 0));
  }

  function evaluate(src) {
    const clean = tidy(src);
    if (clean === "") throw new Error("Empty");
    const value = parse(tokenize(clean));
    if (!Number.isFinite(value)) throw new Error("Result is too large");
    return Number(value.toPrecision(12));
  }

  function format(n) {
    return String(n).replace("-", "−");
  }

  return { evaluate, format, tidy };
})();

if (typeof module !== "undefined") module.exports = Engine;
