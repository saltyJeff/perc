import { c as createStore, d as delegateEvents, a as createSignal, i as insert, b as createComponent, M as Match, e as addEventListener, f as createRenderEffect, g as className, S as Switch, m as memo, s as setAttribute, t as template, h as createRoot, o as onMount, j as onCleanup, k as style, l as setStyleProperty, n as Show, F as For, p as createEffect, u as use, q as createMemo, r as render } from "./solid-BjSJ4mY_.js";
import { s as styleTags, t as tags, L as LRParser, a as LRLanguage, i as indentNodeProp, d as delimitedIndent, f as foldNodeProp, b as foldInside, c as LanguageSupport, e as completeAnyWord, S as StateEffect, g as StateField, E as EditorView, D as Decoration, C as Compartment, h as EditorState, j as basicSetup, k as githubDark, m as monokai, l as githubLight, n as keymap, o as indentWithTab, p as indentUnit, q as autocompletion } from "./codemirror-UbtsnXtE.js";
import "./vendor-BuqXNoU1.js";
class perc_type {
  // Structural
  get(key2) {
    return new perc_err("Method 'get' not implemented.");
  }
  set(key2, value) {
    return new perc_err("Method 'set' not implemented.");
  }
  // Arithmetic
  add(other) {
    return new perc_err("Method 'add' not implemented.");
  }
  sub(other) {
    return new perc_err("Method 'sub' not implemented.");
  }
  mul(other) {
    return new perc_err("Method 'mul' not implemented.");
  }
  div(other) {
    return new perc_err("Method 'div' not implemented.");
  }
  mod(other) {
    return new perc_err("Method 'mod' not implemented.");
  }
  pow(other) {
    return new perc_err("Method 'pow' not implemented.");
  }
  // Logical
  and(other) {
    return new perc_err("Method 'and' not implemented.");
  }
  or(other) {
    return new perc_err("Method 'or' not implemented.");
  }
  xor(other) {
    return new perc_err("Method 'xor' not implemented.");
  }
  not() {
    return new perc_err("Method 'not' not implemented.");
  }
  // Comparison
  eq(other) {
    return new perc_bool(this === other);
  }
  ne(other) {
    return new perc_bool(this !== other);
  }
  lt(other) {
    return new perc_bool(false);
  }
  le(other) {
    return new perc_bool(false);
  }
  gt(other) {
    return new perc_bool(false);
  }
  ge(other) {
    return new perc_bool(false);
  }
  // Bitwise
  bitwise_and(other) {
    return new perc_err("Method 'bitwise_and' not implemented.");
  }
  bitwise_or(other) {
    return new perc_err("Method 'bitwise_or' not implemented.");
  }
  bitwise_xor(other) {
    return new perc_err("Method 'bitwise_xor' not implemented.");
  }
  shl(other) {
    return new perc_err("Method 'shl' not implemented.");
  }
  shr(other) {
    return new perc_err("Method 'shr' not implemented.");
  }
  is_truthy() {
    return true;
  }
  get_iterator() {
    return new perc_err(`Type '${this.type}' is not iterable`);
  }
  clone() {
    return new perc_err("Cannot clone primitive type");
  }
  to_string() {
    return "[object perc_type]";
  }
}
class perc_err extends perc_type {
  value;
  location;
  get type() {
    return "error";
  }
  constructor(value, location) {
    super();
    this.value = value;
    this.location = location;
  }
  to_string() {
    return "Error: " + this.value;
  }
  // Propagate error
  get(key2) {
    return this;
  }
  set(key2, value) {
    return this;
  }
  add(other) {
    return this;
  }
  sub(other) {
    return this;
  }
  mul(other) {
    return this;
  }
  div(other) {
    return this;
  }
  mod(other) {
    return this;
  }
  pow(other) {
    return this;
  }
  and(other) {
    return this;
  }
  or(other) {
    return this;
  }
  xor(other) {
    return this;
  }
  not() {
    return this;
  }
  bitwise_and(other) {
    return this;
  }
  bitwise_or(other) {
    return this;
  }
  bitwise_xor(other) {
    return this;
  }
  shl(other) {
    return this;
  }
  shr(other) {
    return this;
  }
  eq(other) {
    return new perc_bool(false);
  }
  ne(other) {
    return new perc_bool(true);
  }
}
class perc_nil extends perc_type {
  get type() {
    return "nil";
  }
  to_string() {
    return "nil";
  }
  is_truthy() {
    return false;
  }
  eq(other) {
    return new perc_bool(other instanceof perc_nil);
  }
  clone() {
    return this;
  }
}
class perc_bool extends perc_type {
  value;
  get type() {
    return "bool";
  }
  constructor(value) {
    super();
    this.value = !!value;
  }
  to_string() {
    return this.value.toString();
  }
  is_truthy() {
    return this.value;
  }
  not() {
    return new perc_bool(!this.value);
  }
  eq(other) {
    return new perc_bool(other instanceof perc_bool && this.value === other.value);
  }
  clone() {
    return this;
  }
}
class perc_number extends perc_type {
  buffer;
  type;
  constructor(value, type = "f64") {
    super();
    this.type = type;
    switch (type) {
      case "f32":
        this.buffer = new Float32Array(1);
        break;
      case "i32":
        this.buffer = new Int32Array(1);
        break;
      case "u32":
        this.buffer = new Uint32Array(1);
        break;
      case "i16":
        this.buffer = new Int16Array(1);
        break;
      case "u16":
        this.buffer = new Uint16Array(1);
        break;
      case "i8":
        this.buffer = new Int8Array(1);
        break;
      case "u8":
        this.buffer = new Uint8Array(1);
        break;
      default:
        this.buffer = new Float64Array(1);
        break;
    }
    this.buffer[0] = value;
  }
  get val() {
    return this.buffer[0];
  }
  add(other) {
    if (other instanceof perc_number) return new perc_number(this.val + other.val, this.type);
    return super.add(other);
  }
  sub(other) {
    if (other instanceof perc_number) return new perc_number(this.val - other.val, this.type);
    return super.sub(other);
  }
  mul(other) {
    if (other instanceof perc_number) return new perc_number(this.val * other.val, this.type);
    return super.mul(other);
  }
  div(other) {
    if (other instanceof perc_number) {
      if (other.val === 0) return new perc_err("Division by zero");
      return new perc_number(this.val / other.val, this.type);
    }
    return super.div(other);
  }
  mod(other) {
    if (other instanceof perc_number) return new perc_number(this.val % other.val, this.type);
    return super.mod(other);
  }
  pow(other) {
    if (other instanceof perc_number) return new perc_number(Math.pow(this.val, other.val), this.type);
    return super.pow(other);
  }
  // Bitwise ops - always behave as 32-bit ints in JS
  bitwise_and(other) {
    if (other instanceof perc_number) return new perc_number(this.val & other.val, this.type);
    return super.bitwise_and(other);
  }
  bitwise_or(other) {
    if (other instanceof perc_number) return new perc_number(this.val | other.val, this.type);
    return super.bitwise_or(other);
  }
  bitwise_xor(other) {
    if (other instanceof perc_number) return new perc_number(this.val ^ other.val, this.type);
    return super.bitwise_xor(other);
  }
  shl(other) {
    if (other instanceof perc_number) return new perc_number(this.val << other.val, this.type);
    return super.shl(other);
  }
  shr(other) {
    if (other instanceof perc_number) return new perc_number(this.val >> other.val, this.type);
    return super.shr(other);
  }
  eq(other) {
    return new perc_bool(other instanceof perc_number && this.val === other.val);
  }
  lt(other) {
    return new perc_bool(other instanceof perc_number && this.val < other.val);
  }
  le(other) {
    return new perc_bool(other instanceof perc_number && this.val <= other.val);
  }
  gt(other) {
    return new perc_bool(other instanceof perc_number && this.val > other.val);
  }
  ge(other) {
    return new perc_bool(other instanceof perc_number && this.val >= other.val);
  }
  clone() {
    return this;
  }
  to_string() {
    return this.val.toString();
  }
}
class perc_native_method extends perc_type {
  name;
  handler;
  constructor(name, handler) {
    super();
    this.name = name;
    this.handler = handler;
  }
  get type() {
    return "native_method";
  }
  to_string() {
    return `<native method ${this.name}>`;
  }
}
class perc_string extends perc_type {
  value;
  get type() {
    return "string";
  }
  constructor(value) {
    super();
    this.value = value;
  }
  to_string() {
    return this.value;
  }
  add(other) {
    return new perc_string(this.value + other.to_string());
  }
  get(key2) {
    if (key2 instanceof perc_number) {
      const idx = key2.buffer[0] - 1;
      if (idx < 0) return new perc_err("Index out of bounds");
      let i = 0;
      for (const char of this.value) {
        if (i === idx) return new perc_string(char);
        i++;
      }
      return new perc_err("Index out of bounds");
    }
    if (key2 instanceof perc_string) {
      switch (key2.value) {
        case "len":
          return new perc_native_method("len", () => new perc_number(this.value.length));
        case "upper":
          return new perc_native_method("upper", () => new perc_string(this.value.toUpperCase()));
        case "lower":
          return new perc_native_method("lower", () => new perc_string(this.value.toLowerCase()));
        case "split":
          return new perc_native_method("split", (sep) => {
            const s = sep instanceof perc_string ? sep.value : " ";
            return new perc_list(this.value.split(s).map((p) => new perc_string(p)));
          });
        case "has":
          return new perc_native_method("has", (sub) => {
            const s = sub instanceof perc_string ? sub.value : sub.to_string();
            return new perc_bool(this.value.includes(s));
          });
      }
    }
    return super.get(key2);
  }
  eq(other) {
    return new perc_bool(other instanceof perc_string && this.value === other.value);
  }
  get_iterator() {
    const iter = this.value[Symbol.iterator]();
    return {
      next: () => {
        const res = iter.next();
        if (res.done) return { value: new perc_nil(), done: true };
        return { value: new perc_string(res.value), done: false };
      }
    };
  }
  clone() {
    return this;
  }
}
let nextAddress = 1;
class perc_list extends perc_type {
  elements;
  pseudoAddress;
  get type() {
    return "list";
  }
  constructor(elements = []) {
    super();
    this.elements = elements;
    this.pseudoAddress = nextAddress++;
  }
  get(key2) {
    if (key2 instanceof perc_number) {
      const idx = key2.buffer[0] - 1;
      if (idx >= 0 && idx < this.elements.length) return this.elements[idx];
      return new perc_err("Index out of bounds");
    }
    if (key2 instanceof perc_string) {
      switch (key2.value) {
        case "push":
          return new perc_native_method("push", (val) => {
            this.elements.push(val);
            return val;
          });
        case "pop":
          return new perc_native_method("pop", () => {
            if (this.elements.length === 0) return new perc_nil();
            return this.elements.pop();
          });
        case "insert":
          return new perc_native_method("insert", (idx, val) => {
            if (idx instanceof perc_number) {
              let i = idx.buffer[0] - 1;
              if (i < 0) i = 0;
              if (i > this.elements.length) i = this.elements.length;
              this.elements.splice(i, 0, val);
              return val;
            }
            return new perc_err("Index must be a number");
          });
        case "remove":
          return new perc_native_method("remove", (val) => {
            const idx = this.elements.findIndex((e) => e.eq(val).is_truthy());
            if (idx !== -1) {
              this.elements.splice(idx, 1);
              return new perc_bool(true);
            }
            return new perc_bool(false);
          });
        case "delete":
          return new perc_native_method("delete", (idx) => {
            if (idx instanceof perc_number) {
              const i = idx.buffer[0] - 1;
              if (i >= 0 && i < this.elements.length) {
                const removed = this.elements.splice(i, 1)[0];
                return removed;
              }
              return new perc_nil();
            }
            return new perc_err("Index must be a number");
          });
        case "contains":
          return new perc_native_method("contains", (val) => {
            const found = this.elements.some((e) => e.eq(val).is_truthy());
            return new perc_bool(found);
          });
        case "index_of":
          return new perc_native_method("index_of", (val) => {
            const idx = this.elements.findIndex((e) => e.eq(val).is_truthy());
            return new perc_number(idx !== -1 ? idx + 1 : -1, "i32");
          });
        case "clear":
          return new perc_native_method("clear", () => {
            this.elements = [];
            return new perc_nil();
          });
        case "join":
          return new perc_native_method("join", (sep) => {
            const s = sep instanceof perc_string ? sep.value : ", ";
            return new perc_string(this.elements.map((e) => e.to_string()).join(s));
          });
        case "len":
          return new perc_native_method("len", () => new perc_number(this.elements.length));
      }
    }
    return super.get(key2);
  }
  set(key2, value) {
    if (key2 instanceof perc_number) {
      const idx = key2.buffer[0] - 1;
      if (idx >= 0 && idx < this.elements.length) {
        this.elements[idx] = value;
        return value;
      }
      return new perc_err("Index out of bounds");
    }
    return super.set(key2, value);
  }
  clone() {
    return new perc_list(this.elements.map((e) => e.clone()));
  }
  get_iterator() {
    let i = 0;
    return {
      next: () => {
        if (i < this.elements.length) {
          return { value: this.elements[i++], done: false };
        }
        return { value: new perc_nil(), done: true };
      }
    };
  }
  to_string() {
    return "[" + this.elements.map((e) => e.to_string()).join(", ") + "]";
  }
}
class perc_tuple extends perc_type {
  elements;
  get type() {
    return "tuple";
  }
  constructor(elements = []) {
    super();
    this.elements = elements;
  }
  get(key2) {
    if (key2 instanceof perc_number) {
      const idx = key2.buffer[0] - 1;
      if (idx >= 0 && idx < this.elements.length) return this.elements[idx];
      return new perc_err("Index out of bounds");
    }
    if (key2 instanceof perc_string && key2.value === "len") {
      return new perc_native_method("len", () => new perc_number(this.elements.length));
    }
    return super.get(key2);
  }
  set(key2, value) {
    return new perc_err("Tuples are immutable");
  }
  clone() {
    return this;
  }
  get_iterator() {
    let i = 0;
    return {
      next: () => {
        if (i < this.elements.length) {
          return { value: this.elements[i++], done: false };
        }
        return { value: new perc_nil(), done: true };
      }
    };
  }
  to_string() {
    return "(| " + this.elements.map((e) => e.to_string()).join(", ") + " |)";
  }
}
class perc_map extends perc_type {
  data;
  pseudoAddress;
  get type() {
    return "map";
  }
  constructor() {
    super();
    this.data = /* @__PURE__ */ new Map();
    this.pseudoAddress = nextAddress++;
  }
  get(key2) {
    if (key2 instanceof perc_string) {
      switch (key2.value) {
        case "keys":
          return new perc_native_method("keys", () => {
            return new perc_list(Array.from(this.data.keys()).map((k2) => new perc_string(k2)));
          });
        case "values":
          return new perc_native_method("values", () => {
            return new perc_list(Array.from(this.data.values()));
          });
        case "contains":
          return new perc_native_method("contains", (k2) => {
            return new perc_bool(this.data.has(k2.to_string()));
          });
        case "delete":
          return new perc_native_method("delete", (k2) => {
            const existed = this.data.delete(k2.to_string());
            return new perc_bool(existed);
          });
        case "clear":
          return new perc_native_method("clear", () => {
            this.data.clear();
            return new perc_nil();
          });
        case "len":
          return new perc_native_method("len", () => new perc_number(this.data.size));
      }
    }
    const k = key2.to_string();
    return this.data.get(k) || new perc_nil();
  }
  set(key2, value) {
    this.data.set(key2.to_string(), value);
    return value;
  }
  clone() {
    const m = new perc_map();
    for (const [k, v] of this.data.entries()) {
      m.data.set(k, v.clone());
    }
    return m;
  }
  to_string() {
    const entries = Array.from(this.data.entries()).map(([k, v]) => `${k}: ${v.to_string()}`).join(", ");
    return "{" + entries + "}";
  }
  get_iterator() {
    const keys = Array.from(this.data.keys());
    let i = 0;
    return {
      next: () => {
        if (i < keys.length) {
          return { value: new perc_string(keys[i++]), done: false };
        }
        return { value: new perc_nil(), done: true };
      }
    };
  }
}
class perc_range extends perc_type {
  start;
  end;
  step;
  get type() {
    return "range";
  }
  constructor(start, end, step = 1) {
    super();
    this.start = start;
    this.end = end;
    this.step = step;
    if (this.step === 0) this.step = 1;
  }
  get_iterator() {
    let current = this.start;
    const end = this.end;
    const step = this.step;
    return {
      next: () => {
        if (step > 0 && current < end || step < 0 && current > end) {
          const val = current;
          current += step;
          return { value: new perc_number(val, "i32"), done: false };
        }
        return { value: new perc_nil(), done: true };
      }
    };
  }
  to_string() {
    return `range(${this.start}, ${this.end}, ${this.step})`;
  }
  clone() {
    return this;
  }
  // Ranges are immutable value objects effectively
}
class perc_closure extends perc_type {
  addr;
  name;
  captured;
  get type() {
    return "function";
  }
  constructor(addr, captured, name = "anonymous") {
    super();
    this.addr = addr;
    this.captured = captured;
    this.name = name;
  }
  to_string() {
    return this.name === "anonymous" ? `<function at ${this.addr}>` : `<function ${this.name}>`;
  }
}
class PercCompileError extends Error {
  constructor(message, location) {
    super(message);
    this.location = location;
    this.name = "PercCompileError";
  }
}
function getLineCol(source, offset) {
  const lines = source.slice(0, offset).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}
function getLocation(source, start, end) {
  const startPos = getLineCol(source, start);
  const endPos = getLineCol(source, end);
  return {
    start: { offset: start, line: startPos.line, column: startPos.column },
    end: { offset: end, line: endPos.line, column: endPos.column }
  };
}
function getIdentifierName(source, cursor) {
  let currentType = cursor.name;
  let depth = 0;
  while (["PostfixExpression", "PrimaryExpression", "Expression", "Statement", "Literal"].includes(currentType)) {
    if (cursor.firstChild()) {
      depth++;
      currentType = cursor.name;
    } else {
      break;
    }
  }
  let name = null;
  if (currentType === "Identifier") {
    name = source.slice(cursor.from, cursor.to);
  }
  while (depth > 0) {
    cursor.parent();
    depth--;
  }
  return name;
}
function expect(source, cursor, expected, context) {
  const name = cursor.name;
  if (name === expected) return;
  if (name === "⚠") {
    throw new PercCompileError(
      `Expected '${expected}' in ${context}, but found syntax error (unexpected token)`,
      getLocation(source, cursor.from, cursor.to)
    );
  }
  throw new PercCompileError(
    `Expected '${expected}' in ${context}, but found '${name}'`,
    getLocation(source, cursor.from, cursor.to)
  );
}
function compileBinaryExpression(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  compiler.visit(cursor);
  cursor.nextSibling();
  const binOp = compiler.source.slice(cursor.from, cursor.to);
  cursor.nextSibling();
  compiler.visit(cursor);
  compiler.emit({ type: "binary_op", op: binOp }, loc);
  cursor.parent();
}
function compileUnaryExpression(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  const unOp = compiler.source.slice(cursor.from, cursor.to);
  cursor.nextSibling();
  compiler.visit(cursor);
  compiler.emit({ type: "unary_op", op: unOp }, loc);
  cursor.parent();
}
function compileCallExpression(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  const start = cursor.from;
  const end = cursor.to;
  cursor.firstChild();
  const calleeName = getIdentifierName(compiler.source, cursor);
  if (calleeName === "typeof") {
    cursor.nextSibling();
    const count = compiler.visitArgumentList(cursor);
    if (count !== 1) throw new PercCompileError("typeof expects exactly 1 argument", getLocation(compiler.source, start, end));
    compiler.emit({ type: "typeof" }, loc);
    cursor.parent();
    return;
  }
  if (calleeName && compiler.foreign_funcs.has(calleeName)) {
    cursor.nextSibling();
    const n = compiler.visitArgumentList(cursor);
    compiler.emit({ type: "call_foreign", name: calleeName, nargs: n }, loc);
    cursor.parent();
    return;
  }
  compiler.visit(cursor);
  cursor.nextSibling();
  const gArgs = compiler.visitArgumentList(cursor);
  compiler.emit({ type: "call", nargs: gArgs }, loc);
  cursor.parent();
}
function compileMemberExpression(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  compiler.visit(cursor);
  cursor.nextSibling();
  if (cursor.name === ".") {
    cursor.nextSibling();
    const pName = compiler.source.slice(cursor.from, cursor.to);
    compiler.emit({ type: "member_load", name: pName }, loc);
  } else {
    cursor.nextSibling();
    compiler.visit(cursor);
    compiler.emit({ type: "index_load" }, loc);
  }
  cursor.parent();
}
function compileInstantiationExpression(compiler, cursor) {
  cursor.firstChild();
  cursor.nextSibling();
  compiler.visit(cursor);
  cursor.parent();
}
function compileArrayLiteral(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  let arrSize = 0;
  while (cursor.nextSibling() && cursor.name !== "]") {
    if (cursor.name !== ",") {
      compiler.visit(cursor);
      arrSize++;
    }
  }
  compiler.emit({ type: "new_array", size: arrSize }, loc);
  cursor.parent();
}
function compileTupleLiteral(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  let tupSize = 0;
  while (cursor.nextSibling() && cursor.name !== "|)") {
    if (cursor.name !== ",") {
      compiler.visit(cursor);
      tupSize++;
    }
  }
  compiler.emit({ type: "new_tuple", size: tupSize }, loc);
  cursor.parent();
}
function compileMapLiteral(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  let mapSize = 0;
  while (cursor.nextSibling() && cursor.name !== "}") {
    if (cursor.name === "Pair") {
      cursor.firstChild();
      compiler.visit(cursor);
      cursor.nextSibling();
      cursor.nextSibling();
      compiler.visit(cursor);
      cursor.parent();
      mapSize++;
    }
  }
  compiler.emit({ type: "new_map", size: mapSize }, loc);
  cursor.parent();
}
function compileFunction(compiler, cursor, type) {
  const loc = { start: cursor.from, end: cursor.to };
  const funcJumpOverIdx = compiler.opcodes.length;
  compiler.emit({ type: "jump", addr: 0 }, loc);
  const funcStartAddr = compiler.opcodes.length;
  cursor.firstChild();
  let fName = "anonymous";
  if (type === "FunctionDeclaration") {
    cursor.nextSibling();
    fName = compiler.source.slice(cursor.from, cursor.to);
  }
  cursor.nextSibling();
  const params = [];
  if (cursor.firstChild()) {
    while (cursor.nextSibling() && cursor.name !== ")") {
      if (cursor.name === "Identifier") {
        params.push(compiler.source.slice(cursor.from, cursor.to));
      }
    }
    cursor.parent();
  }
  compiler.enter_scope();
  params.slice().reverse().forEach((p) => {
    compiler.declare_var(p, loc);
    compiler.emit({ type: "init", name: p, catch: false }, loc);
  });
  cursor.nextSibling();
  compiler.visit(cursor);
  compiler.exit_scope();
  compiler.emit({ type: "push", imm: new perc_nil() }, loc);
  compiler.emit({ type: "ret" }, loc);
  compiler.opcodes[funcJumpOverIdx].addr = compiler.opcodes.length;
  compiler.emit({
    type: "make_closure",
    addr: funcStartAddr,
    captured: [],
    name: fName
  }, loc);
  if (type === "FunctionDeclaration") {
    compiler.emit({ type: "init", name: fName, catch: false }, loc);
  }
  cursor.parent();
}
function compileLiteral(compiler, cursor) {
  const type = cursor.name;
  const start = cursor.from;
  const end = cursor.to;
  const loc = { start, end };
  switch (type) {
    case "IntegerLiteral":
      compiler.emit({ type: "push", imm: new perc_number(parseInt(compiler.source.slice(start, end).replace(/_/g, "")), "i32") }, loc);
      break;
    case "FloatLiteral":
      compiler.emit({ type: "push", imm: new perc_number(parseFloat(compiler.source.slice(start, end).replace(/_/g, "")), "f64") }, loc);
      break;
    case "StringLiteral":
      compiler.emit({ type: "push", imm: new perc_string(JSON.parse(compiler.source.slice(start, end))) }, loc);
      break;
    case "BooleanLiteral":
      compiler.emit({ type: "push", imm: new perc_bool(compiler.source.slice(start, end) === "true") }, loc);
      break;
    case "NilLiteral":
      compiler.emit({ type: "push", imm: new perc_nil() }, loc);
      break;
  }
}
function compileSourceFileOrBlock(compiler, cursor) {
  const type = cursor.name;
  const loc = { start: cursor.from, end: cursor.to };
  const end = cursor.to;
  if (type === "Block" || type === "SourceFile") {
    if (type === "Block") {
      compiler.enter_scope();
      compiler.emit({ type: "enter_scope" }, loc);
    }
    if (cursor.firstChild()) {
      do {
        const nodeName = cursor.name;
        let isFuncDecl = false;
        let parentIsStatement = false;
        if (nodeName === "FunctionDeclaration") {
          isFuncDecl = true;
        } else if (nodeName === "Statement") {
          if (cursor.firstChild()) {
            if (cursor.name === "FunctionDeclaration") {
              isFuncDecl = true;
              parentIsStatement = true;
            } else {
              cursor.parent();
            }
          }
        }
        if (isFuncDecl) {
          cursor.firstChild();
          cursor.nextSibling();
          const funcName = compiler.source.slice(cursor.from, cursor.to);
          const funcLoc = { start: cursor.from, end: cursor.to };
          try {
            compiler.declare_var(funcName, funcLoc);
          } catch (e) {
          }
          cursor.parent();
        }
        if (parentIsStatement) {
          cursor.parent();
        }
      } while (cursor.nextSibling());
      cursor.parent();
    }
    if (cursor.firstChild()) {
      do {
        const n = cursor.name;
        if (n === "⚠") {
          throw new PercCompileError(
            `Unexpected syntax in ${type}. check for missing ';' or '}'`,
            getLocation(compiler.source, cursor.from, cursor.to)
          );
        }
        if (n !== "{" && n !== "}" && n !== ";" && n !== "LineComment" && n !== "BlockComment") {
          compiler.visit(cursor);
        }
      } while (cursor.nextSibling());
      if (type === "Block") {
        if (cursor.name !== "}") {
          throw new PercCompileError(
            "Missing closing '}' for block",
            getLocation(compiler.source, end, end)
          );
        }
      }
      cursor.parent();
    }
    if (type === "Block") {
      compiler.emit({ type: "exit_scope" }, loc);
      compiler.exit_scope();
    }
  } else {
    compiler.visit(cursor);
  }
}
function compileIfStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  const end = cursor.to;
  cursor.firstChild();
  if (!cursor.nextSibling()) throw new PercCompileError("Unexpected end of IfStatement", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "(", "if statement");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in if statement", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  if (!cursor.nextSibling()) throw new PercCompileError("Missing closing ')' in if statement", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, ")", "if statement");
  const jumpIfFalseIdx = compiler.opcodes.length;
  compiler.emit({ type: "jump_if_false", addr: 0 }, loc);
  if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in if statement", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "then", "if statement");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing block in if statement", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  const jumpToEndIdx = compiler.opcodes.length;
  compiler.emit({ type: "jump", addr: 0 }, loc);
  compiler.opcodes[jumpIfFalseIdx].addr = compiler.opcodes.length;
  if (cursor.nextSibling()) {
    if (cursor.name === "else") {
      if (!cursor.nextSibling()) throw new PercCompileError("Missing block after else", getLocation(compiler.source, end, end));
      compiler.visit(cursor);
    }
  }
  compiler.opcodes[jumpToEndIdx].addr = compiler.opcodes.length;
  cursor.parent();
}
function compileWhileStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  const end = cursor.to;
  const whileStartAddr = compiler.opcodes.length;
  cursor.firstChild();
  if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in while loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "(", "while loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in while loop", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  const whileJumpOutIdx = compiler.opcodes.length;
  compiler.emit({ type: "jump_if_false", addr: 0 }, loc);
  if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in while loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, ")", "while loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in while loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "then", "while loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing block in while loop", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  compiler.emit({ type: "jump", addr: whileStartAddr }, loc);
  compiler.opcodes[whileJumpOutIdx].addr = compiler.opcodes.length;
  cursor.parent();
}
function compileVarRef(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  cursor.nextSibling();
  const varName = compiler.source.slice(cursor.from, cursor.to);
  cursor.nextSibling();
  const isCatchRef = cursor.name === "CatchAssignOp";
  cursor.nextSibling();
  compiler.visit(cursor);
  compiler.declare_var(varName, loc);
  compiler.emit({ type: "ref", name: varName, catch: isCatchRef }, loc);
  cursor.parent();
}
function compileForInStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  const end = cursor.to;
  cursor.firstChild();
  if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in for loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "(", "for loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing 'init' in for loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "init", "for loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing identifier in for loop", getLocation(compiler.source, end, end));
  const iterItem = compiler.source.slice(cursor.from, cursor.to);
  if (!cursor.nextSibling()) throw new PercCompileError("Missing 'in' in for loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "in", "for loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing iterable expression in for loop", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  compiler.emit({ type: "get_iter" }, loc);
  const forStartAddr = compiler.opcodes.length;
  compiler.emit({ type: "iter_next" }, loc);
  const forJumpOutIdx = compiler.opcodes.length;
  compiler.emit({ type: "jump_if_false", addr: 0 }, loc);
  compiler.enter_scope();
  compiler.declare_var(iterItem, loc);
  compiler.emit({ type: "init", name: iterItem, catch: false }, loc);
  if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in for loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, ")", "for loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in for loop", getLocation(compiler.source, end, end));
  expect(compiler.source, cursor, "then", "for loop");
  if (!cursor.nextSibling()) throw new PercCompileError("Missing block in for loop", getLocation(compiler.source, end, end));
  compiler.visit(cursor);
  compiler.exit_scope();
  compiler.emit({ type: "jump", addr: forStartAddr }, loc);
  compiler.opcodes[forJumpOutIdx].addr = compiler.opcodes.length;
  cursor.parent();
}
function compileVarInit(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  cursor.nextSibling();
  const varName = compiler.source.slice(cursor.from, cursor.to);
  cursor.nextSibling();
  const isCatchInit = cursor.name === "CatchAssignOp";
  cursor.nextSibling();
  compiler.visit(cursor);
  compiler.declare_var(varName, loc);
  compiler.emit({ type: "init", name: varName, catch: isCatchInit }, loc);
  cursor.parent();
}
function compileVarChange(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  cursor.nextSibling();
  const targetIdName = getIdentifierName(compiler.source, cursor);
  if (targetIdName) {
    if (!compiler.resolve_var(targetIdName)) {
      compiler.errors.push(new PercCompileError(
        `Variable '${targetIdName}' is not defined`,
        getLocation(compiler.source, cursor.from, cursor.to)
      ));
    }
    cursor.nextSibling();
    const isCatchChange = cursor.name === "CatchAssignOp";
    cursor.nextSibling();
    compiler.visit(cursor);
    compiler.emit({ type: "store", name: targetIdName, catch: isCatchChange }, loc);
  } else if (cursor.name === "MemberExpression") {
    cursor.firstChild();
    compiler.visit(cursor);
    cursor.nextSibling();
    if (cursor.name === ".") {
      cursor.nextSibling();
      const propName = compiler.source.slice(cursor.from, cursor.to);
      cursor.parent();
      cursor.nextSibling();
      const isCatchChange = cursor.name === "CatchAssignOp";
      cursor.nextSibling();
      compiler.visit(cursor);
      compiler.emit({ type: "member_store", name: propName, catch: isCatchChange }, loc);
    } else {
      cursor.nextSibling();
      compiler.visit(cursor);
      cursor.nextSibling();
      cursor.parent();
      cursor.nextSibling();
      const isCatchChange = cursor.name === "CatchAssignOp";
      cursor.nextSibling();
      compiler.visit(cursor);
      compiler.emit({ type: "index_store", catch: isCatchChange }, loc);
    }
  }
  cursor.parent();
}
function compileReturnStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  if (cursor.nextSibling()) {
    compiler.visit(cursor);
  } else {
    compiler.emit({ type: "push", imm: new perc_nil() }, loc);
  }
  compiler.emit({ type: "ret" }, loc);
  cursor.parent();
}
function compileDebuggerStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  compiler.emit({ type: "debugger" }, loc);
}
function compileExpressionStatement(compiler, cursor) {
  const loc = { start: cursor.from, end: cursor.to };
  cursor.firstChild();
  compiler.visit(cursor);
  compiler.emit({ type: "pop" }, loc);
  cursor.parent();
}
class Compiler {
  opcodes = [];
  foreign_funcs;
  source = "";
  constructor(foreign_funcs = [], declared_vars = []) {
    this.foreign_funcs = new Set(foreign_funcs);
    this.predeclared_vars = new Set(declared_vars);
  }
  predeclared_vars;
  scopes = [];
  errors = [];
  enter_scope() {
    this.scopes.push(/* @__PURE__ */ new Set());
  }
  exit_scope() {
    this.scopes.pop();
  }
  resolve_var(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) return true;
    }
    return false;
  }
  declare_var(name, location) {
    const current = this.scopes[this.scopes.length - 1];
    if (current.has(name)) {
      this.errors.push(new PercCompileError(
        `Variable '${name}' already declared in this scope`,
        getLocation(this.source, location.start, location.end)
      ));
    } else {
      current.add(name);
    }
  }
  compile(source, tree) {
    this.opcodes = [];
    this.errors = [];
    this.scopes = [];
    this.source = source;
    this.enter_scope();
    const cursor = tree.cursor();
    this.visit(cursor);
    this.exit_scope();
    return { opcodes: this.opcodes, errors: this.errors };
  }
  compile_repl(source, tree) {
    this.opcodes = [];
    this.errors = [];
    this.scopes = [];
    this.source = source;
    this.enter_scope();
    const globalCheck = this.scopes[0];
    for (const v of this.predeclared_vars) {
      globalCheck.add(v);
    }
    const cursor = tree.cursor();
    if (cursor.name === "SourceFile") {
      if (cursor.firstChild()) {
        do {
          const isLast = !cursor.nextSibling();
          if (!isLast) cursor.prevSibling();
          let isExprStmt = false;
          if (cursor.name === "ExpressionStatement") isExprStmt = true;
          else if (cursor.name === "Statement") {
            if (cursor.firstChild()) {
              if (cursor.name === "ExpressionStatement") isExprStmt = true;
              cursor.parent();
            }
          }
          if (isLast && isExprStmt) {
            let moved = false;
            if (cursor.name === "Statement") {
              cursor.firstChild();
              moved = true;
            }
            cursor.firstChild();
            this.visit(cursor);
            cursor.parent();
            if (moved) cursor.parent();
          } else {
            this.visit(cursor);
          }
        } while (cursor.nextSibling());
        cursor.parent();
      }
    } else {
      this.visit(cursor);
    }
    this.exit_scope();
    return { opcodes: this.opcodes, errors: this.errors };
  }
  emit(op, location) {
    this.opcodes.push({
      ...op,
      src_start: location.start,
      src_end: location.end
    });
  }
  visit(cursor) {
    const type = cursor.name;
    switch (type) {
      case "SourceFile":
      case "Block":
        compileSourceFileOrBlock(this, cursor);
        break;
      case "IfStatement":
        compileIfStatement(this, cursor);
        break;
      case "WhileStatement":
        compileWhileStatement(this, cursor);
        break;
      case "ForInStatement":
        compileForInStatement(this, cursor);
        break;
      case "Statement":
      case "Expression":
      case "PostfixExpression":
      case "PrimaryExpression":
      case "Literal":
        if (cursor.firstChild()) {
          this.visit(cursor);
          cursor.parent();
        }
        break;
      case "VarInit":
        compileVarInit(this, cursor);
        break;
      case "VarChange":
        compileVarChange(this, cursor);
        break;
      case "VarRef":
        compileVarRef(this, cursor);
        break;
      case "ReturnStatement":
        compileReturnStatement(this, cursor);
        break;
      case "DebuggerStatement":
        compileDebuggerStatement(this, cursor);
        break;
      case "ExpressionStatement":
        compileExpressionStatement(this, cursor);
        break;
      case "BinaryExpression":
        compileBinaryExpression(this, cursor);
        break;
      case "UnaryExpression":
        compileUnaryExpression(this, cursor);
        break;
      case "CallExpression":
        compileCallExpression(this, cursor);
        break;
      case "MemberExpression":
        compileMemberExpression(this, cursor);
        break;
      case "InstantiationExpression":
        compileInstantiationExpression(this, cursor);
        break;
      case "ArrayLiteral":
        compileArrayLiteral(this, cursor);
        break;
      case "TupleLiteral":
        compileTupleLiteral(this, cursor);
        break;
      case "MapLiteral":
        compileMapLiteral(this, cursor);
        break;
      case "FunctionDeclaration":
      case "FunctionLiteral":
        compileFunction(this, cursor, type);
        break;
      case "Identifier":
        const name = this.source.slice(cursor.from, cursor.to);
        if (!this.resolve_var(name) && !this.foreign_funcs.has(name)) {
          this.errors.push(new PercCompileError(
            `Variable '${name}' is not defined`,
            getLocation(this.source, cursor.from, cursor.to)
          ));
        }
        this.emit({ type: "load", name }, { start: cursor.from, end: cursor.to });
        break;
      case "IntegerLiteral":
      case "FloatLiteral":
      case "StringLiteral":
      case "BooleanLiteral":
      case "NilLiteral":
        compileLiteral(this, cursor);
        break;
      case "ParenthesizedExpression":
        cursor.firstChild();
        cursor.nextSibling();
        this.visit(cursor);
        cursor.parent();
        break;
      case "⚠":
        throw new PercCompileError(
          `Unexpected token or expression.`,
          getLocation(this.source, cursor.from, cursor.to)
        );
    }
  }
  visitArgumentList(cursor) {
    let count = 0;
    if (cursor.firstChild()) {
      while (cursor.nextSibling() && cursor.name !== ")") {
        if (cursor.name !== ",") {
          this.visit(cursor);
          count++;
        }
      }
      cursor.parent();
    }
    return count;
  }
}
const standardBuiltins = {};
const types = ["i8", "u8", "i16", "u16", "i32", "u32", "f32", "f64"];
for (const t of types) {
  standardBuiltins[t] = (arg) => {
    if (arg instanceof perc_number) return new perc_number(arg.buffer[0], t);
    if (arg instanceof perc_string) {
      const n = parseFloat(arg.value);
      if (!isNaN(n)) return new perc_number(n, t);
    }
    return new perc_err(`Cannot cast ${arg.to_string()} to ${t}`);
  };
}
standardBuiltins["int"] = standardBuiltins["i32"];
standardBuiltins["float"] = standardBuiltins["f64"];
standardBuiltins["clone"] = (arg) => {
  return arg.clone();
};
standardBuiltins["len"] = (arg) => {
  if (arg instanceof perc_list) return new perc_number(arg.elements.length);
  if (arg instanceof perc_string) return new perc_number(arg.value.length);
  if (arg instanceof perc_map) return new perc_number(arg.data.size);
  if (arg instanceof perc_tuple) return new perc_number(arg.elements.length);
  return new perc_err(`Type '${arg.type}' has no length`);
};
standardBuiltins["str"] = (arg) => {
  return new perc_string(arg.to_string());
};
standardBuiltins["range"] = (...args) => {
  if (args.length === 0) return new perc_err("range() expects at least 1 argument");
  let start = 0;
  let end = 0;
  let step = 1;
  if (args.length === 1) {
    if (args[0] instanceof perc_number) {
      end = args[0].buffer[0];
    } else {
      return new perc_err("range() arguments must be numbers");
    }
  } else if (args.length >= 2) {
    if (args[0] instanceof perc_number && args[1] instanceof perc_number) {
      start = args[0].buffer[0];
      end = args[1].buffer[0];
    } else {
      return new perc_err("range() arguments must be numbers");
    }
    if (args.length >= 3) {
      if (args[2] instanceof perc_number) {
        step = args[2].buffer[0];
      } else {
        return new perc_err("range() arguments must be numbers");
      }
    }
  }
  return new perc_range(start, end, step);
};
standardBuiltins["rgb"] = (r, g, b) => {
  const m = new perc_map();
  m.set(new perc_string("r"), r);
  m.set(new perc_string("g"), g);
  m.set(new perc_string("b"), b);
  m.set(new perc_string("a"), new perc_number(1));
  return m;
};
standardBuiltins["rgba"] = (r, g, b, a) => {
  const m = new perc_map();
  m.set(new perc_string("r"), r);
  m.set(new perc_string("g"), g);
  m.set(new perc_string("b"), b);
  m.set(new perc_string("a"), a);
  return m;
};
standardBuiltins["hsl"] = (h, s, l) => {
  const hv = h instanceof perc_number ? h.buffer[0] : 0;
  const sv = s instanceof perc_number ? s.buffer[0] / 100 : 0;
  const lv = l instanceof perc_number ? l.buffer[0] / 100 : 0;
  const k = (n) => (n + hv / 30) % 12;
  const a = sv * Math.min(lv, 1 - lv);
  const f = (n) => lv - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  const m = new perc_map();
  m.set(new perc_string("r"), new perc_number(r, "u8"));
  m.set(new perc_string("g"), new perc_number(g, "u8"));
  m.set(new perc_string("b"), new perc_number(b, "u8"));
  m.set(new perc_string("a"), new perc_number(1));
  return m;
};
standardBuiltins["hsla"] = (h, s, l, a) => {
  const hv = h instanceof perc_number ? h.buffer[0] : 0;
  const sv = s instanceof perc_number ? s.buffer[0] / 100 : 0;
  const lv = l instanceof perc_number ? l.buffer[0] / 100 : 0;
  const k = (n) => (n + hv / 30) % 12;
  const ka = sv * Math.min(lv, 1 - lv);
  const f = (n) => lv - ka * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  const m = new perc_map();
  m.set(new perc_string("r"), new perc_number(r, "u8"));
  m.set(new perc_string("g"), new perc_number(g, "u8"));
  m.set(new perc_string("b"), new perc_number(b, "u8"));
  m.set(new perc_string("a"), a);
  return m;
};
function createDebugStore() {
  const [state, setState] = createStore({
    currentExpression: {
      value: null,
      type: null
    },
    callStack: [],
    status: "Idle",
    activeRange: null,
    lastUpdatedVar: null
  });
  return [state, setState];
}
class Scope {
  values = /* @__PURE__ */ new Map();
  definitions = /* @__PURE__ */ new Map();
  parent = null;
  is_closure_scope = false;
  constructor(parent = null) {
    this.parent = parent;
  }
  define(name, value, range) {
    this.values.set(name, value);
    this.definitions.set(name, range);
  }
  assign(name, value, range) {
    if (this.values.has(name)) {
      this.values.set(name, value);
      this.definitions.set(name, range);
      return true;
    }
    if (this.parent) return this.parent.assign(name, value, range);
    return false;
  }
  lookup(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.lookup(name);
    return null;
  }
  lookup_definition(name) {
    if (this.definitions.has(name)) return this.definitions.get(name);
    if (this.parent) return this.parent.lookup_definition(name);
    return null;
  }
}
class Frame {
  scope;
  ret_addr;
  stack_start;
  name;
  args;
  constructor(scope, ret_addr, stack_start, name = "global", args = []) {
    this.scope = scope;
    this.ret_addr = ret_addr;
    this.stack_start = stack_start;
    this.name = name;
    this.args = args;
  }
}
class VM {
  code = [];
  ip = 0;
  stack = [];
  call_stack = [];
  current_frame;
  foreign_funcs = /* @__PURE__ */ new Map();
  events = {};
  iterators = [];
  is_waiting_for_input = false;
  in_debug_mode = false;
  debugStore;
  setDebugStore;
  constructor(code = []) {
    const [store, setStore] = createDebugStore();
    this.debugStore = store;
    this.setDebugStore = setStore;
    this.code = code;
    this.reset_state();
    this.register_builtins(standardBuiltins);
  }
  register_builtins(funcs) {
    for (const [name, func] of Object.entries(funcs)) {
      this.register_foreign(name, func);
    }
  }
  reset_state() {
    this.ip = 0;
    this.stack = [];
    this.call_stack = [];
    this.iterators = [];
    this.is_waiting_for_input = false;
    this.in_debug_mode = false;
    const global_scope = new Scope();
    this.current_frame = new Frame(global_scope, -1, 0, "global");
    this.setDebugStore({
      currentExpression: { value: null, type: null },
      callStack: [{
        id: `frame-global-${Date.now()}`,
        name: "global",
        args: [],
        variables: {},
        open: true
      }],
      status: "Idle",
      activeRange: null,
      lastUpdatedVar: null
    });
    this.events.on_frame_push?.(this.current_frame);
  }
  execute(source, parser2) {
    try {
      const tree = parser2.parse(source);
      const compiler = new Compiler(Array.from(this.foreign_funcs.keys()));
      const result = compiler.compile(source, tree);
      if (result.errors.length > 0) {
        const firstErr = result.errors[0];
        const loc = [firstErr.location.start.offset, firstErr.location.end.offset];
        console.error(firstErr.message, loc);
        throw firstErr;
      }
      this.code = result.opcodes;
      this.reset_state();
    } catch (e) {
      const loc = e.location ? [e.location.start.offset, e.location.end.offset] : null;
      console.error(e.message, loc);
      throw e;
    }
  }
  execute_repl(source, parser2) {
    try {
      const tree = parser2.parse(source);
      const existingVars = [];
      if (this.current_frame && this.current_frame.scope) {
        let s = this.current_frame.scope;
        while (s) {
          for (const k of s.values.keys()) {
            existingVars.push(k);
          }
          s = s.parent;
        }
      }
      const compiler = new Compiler(Array.from(this.foreign_funcs.keys()), existingVars);
      const result = compiler.compile_repl(source, tree);
      if (result.errors.length > 0) {
        const firstErr = result.errors[0];
        const loc = [firstErr.location.start.offset, firstErr.location.end.offset];
        console.error(firstErr.message, loc);
        throw firstErr;
      }
      this.code = result.opcodes;
      this.ip = 0;
      this.stack = [];
      this.call_stack = [];
      this.iterators = [];
      this.is_waiting_for_input = false;
      if (!this.current_frame) {
        const global_scope = new Scope();
        this.current_frame = new Frame(global_scope, -1, 0, "global");
        this.events.on_frame_push?.(this.current_frame);
      } else {
        const global_scope = this.get_global_scope();
        this.current_frame = new Frame(global_scope, -1, 0, "global");
        this.events.on_frame_push?.(this.current_frame);
      }
    } catch (e) {
      const loc = e.location ? [e.location.start.offset, e.location.end.offset] : null;
      console.error(e.message, loc);
      throw e;
    }
  }
  resume_with_input(val) {
    if (this.is_waiting_for_input) {
      this.pop();
      this.push(val);
      this.is_waiting_for_input = false;
    }
  }
  get_call_stack_names() {
    const frames = [...this.call_stack, this.current_frame];
    return frames.map((f) => {
      const argsStr = f.args.length > 0 ? f.args.join(", ") : "";
      return `${f.name}(${argsStr})`;
    });
  }
  get_frames() {
    return [...this.call_stack, this.current_frame];
  }
  get_scope_variables(start_scope) {
    const res = {};
    let s = start_scope;
    while (s) {
      if (s.parent === null && s !== start_scope) break;
      for (const [k, v] of s.values.entries()) {
        if (!(k in res)) {
          res[k] = {
            value: v,
            range: s.definitions.get(k) || null
          };
        }
      }
      s = s.parent;
    }
    return res;
  }
  get_current_scope_values() {
    return this.get_scope_variables(this.current_frame.scope);
  }
  get_global_scope() {
    if (this.call_stack.length > 0) {
      let s2 = this.call_stack[0].scope;
      while (s2.parent) s2 = s2.parent;
      return s2;
    }
    let s = this.current_frame.scope;
    while (s.parent) s = s.parent;
    return s;
  }
  set_events(events) {
    this.events = events;
  }
  load_code(code) {
    this.code = code;
    this.reset_state();
  }
  register_foreign(name, func) {
    this.foreign_funcs.set(name, func);
  }
  get_foreign_funcs() {
    return this.foreign_funcs;
  }
  *run() {
    let last_src_start = -1;
    let last_src_end = -1;
    let ops_count = 0;
    while (this.ip >= 0 && this.ip < this.code.length) {
      const op = this.code[this.ip];
      if (this.in_debug_mode) {
        this.events.on_node_eval?.([op.src_start, op.src_end]);
        this.setDebugStore("activeRange", [op.src_start, op.src_end]);
      }
      try {
        switch (op.type) {
          case "push":
            this.push(op.imm);
            break;
          case "pop":
            const p_val = this.pop();
            if (p_val instanceof perc_err) {
              this.return_error(p_val);
              continue;
            }
            break;
          case "dup":
            const d = this.pop();
            this.push(d);
            this.push(d);
            break;
          case "swap":
            const a = this.pop();
            const b = this.pop();
            this.push(a);
            this.push(b);
            break;
          case "init":
            let init_val = this.pop();
            if (init_val instanceof perc_err && !op.catch) {
              this.return_error(init_val);
              continue;
            }
            if (init_val instanceof perc_list || init_val instanceof perc_map) {
              init_val = init_val.clone();
            }
            this.current_frame.scope.define(op.name, init_val, [op.src_start, op.src_end]);
            if (this.in_debug_mode) {
              this.events.on_var_update?.(op.name, this.current_frame.scope.lookup(op.name), [op.src_start, op.src_end]);
              this.updateDebugStoreVariables(op.name, this.current_frame.scope.lookup(op.name), [op.src_start, op.src_end]);
            }
            break;
          case "load":
            const val = this.current_frame.scope.lookup(op.name);
            if (!val) throw new Error(`Undefined variable: ${op.name}`);
            this.push(val);
            break;
          case "store":
            const s_val = this.pop();
            if (s_val instanceof perc_err && !op.catch) {
              this.return_error(s_val);
              continue;
            }
            if (!this.current_frame.scope.assign(op.name, s_val, [op.src_start, op.src_end])) {
              this.return_error(new perc_err(`Cannot assign to uninitialized variable: ${op.name}`, [op.src_start, op.src_end]));
              continue;
            }
            if (this.in_debug_mode) {
              this.events.on_var_update?.(op.name, s_val, [op.src_start, op.src_end]);
              this.updateDebugStoreVariables(op.name, s_val, [op.src_start, op.src_end]);
            }
            break;
          case "ref":
            const ref_val = this.pop();
            if (ref_val instanceof perc_err && !op.catch) {
              this.return_error(ref_val);
              continue;
            }
            if (!(ref_val instanceof perc_list || ref_val instanceof perc_map)) {
              this.return_error(new perc_err(`Cannot ref a non-reference type: ${ref_val.type}`, [op.src_start, op.src_end]));
              continue;
            }
            this.current_frame.scope.define(op.name, ref_val, [op.src_start, op.src_end]);
            if (this.in_debug_mode) {
              this.events.on_var_update?.(op.name, this.current_frame.scope.lookup(op.name), [op.src_start, op.src_end]);
              this.updateDebugStoreVariables(op.name, this.current_frame.scope.lookup(op.name), [op.src_start, op.src_end]);
            }
            break;
          case "binary_op":
            const right = this.pop();
            const left = this.pop();
            this.push(this.apply_binary(left, right, op.op));
            break;
          case "unary_op":
            const u = this.pop();
            this.push(this.apply_unary(u, op.op));
            break;
          case "typeof":
            const t_val = this.pop();
            let type_str = t_val.type;
            if (["i8", "u8", "i16", "u16", "i32", "u32"].includes(type_str)) type_str = "int";
            if (["f32", "f64"].includes(type_str)) type_str = "float";
            this.push(new perc_string(type_str));
            break;
          case "jump":
            this.ip = op.addr;
            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
              last_src_start = op.src_start;
              last_src_end = op.src_end;
              yield;
            }
            continue;
          case "jump_if_false":
            const jf_cond = this.pop();
            if (jf_cond instanceof perc_err) {
              this.return_error(jf_cond);
              continue;
            }
            if (!jf_cond.is_truthy()) {
              this.ip = op.addr;
              if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                last_src_start = op.src_start;
                last_src_end = op.src_end;
                yield;
              }
              continue;
            }
            break;
          case "jump_if_true":
            const jt_cond = this.pop();
            if (jt_cond instanceof perc_err) {
              this.return_error(jt_cond);
              continue;
            }
            if (jt_cond.is_truthy()) {
              this.ip = op.addr;
              if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                last_src_start = op.src_start;
                last_src_end = op.src_end;
                yield;
              }
              continue;
            }
            break;
          case "get_iter":
            const iter_obj = this.pop();
            if (iter_obj instanceof perc_err) {
              this.return_error(iter_obj);
              continue;
            }
            const iterator = iter_obj.get_iterator();
            if (iterator instanceof perc_err) {
              this.return_error(iterator);
              continue;
            }
            this.iterators.push(iterator);
            break;
          case "iter_next":
            const iter = this.iterators[this.iterators.length - 1];
            const { value, done } = iter.next();
            if (!done) {
              this.push(value);
              this.push(new perc_bool(true));
            } else {
              this.iterators.pop();
              this.push(new perc_bool(false));
            }
            break;
          case "call":
            if (this.stack.length < op.nargs + 1) {
              this.return_error(new perc_err("Stack underflow in call"));
              continue;
            }
            const func_idx = this.stack.length - 1 - op.nargs;
            const func = this.stack[func_idx];
            if (func instanceof perc_err) {
              this.return_error(func);
              continue;
            }
            if (func instanceof perc_native_method) {
              const native_args = [];
              for (let i = 0; i < op.nargs; i++) {
                native_args.push(this.pop());
              }
              this.pop();
              const res2 = func.handler(...native_args.reverse());
              this.push(res2);
              break;
            }
            if (!(func instanceof perc_closure)) {
              this.return_error(new perc_err("Object is not callable", [op.src_start, op.src_end]));
              continue;
            }
            this.stack.splice(func_idx, 1);
            const call_args = [];
            const arg_count = op.nargs;
            for (let i = 0; i < arg_count; i++) {
              const val2 = this.stack[this.stack.length - arg_count + i];
              if (val2) call_args.push(val2.to_string());
            }
            const call_scope = new Scope(func.captured);
            const new_frame = new Frame(call_scope, this.ip + 1, this.stack.length, func.name, call_args);
            this.call_stack.push(this.current_frame);
            this.current_frame = new_frame;
            this.ip = func.addr;
            if (this.in_debug_mode) {
              this.events.on_frame_push?.(new_frame);
              this.pushDebugStoreFrame(new_frame);
            }
            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
              last_src_start = op.src_start;
              last_src_end = op.src_end;
              yield;
            }
            continue;
          case "ret":
            const ret_val = this.pop();
            const finishing_frame = this.current_frame;
            if (this.call_stack.length === 0) {
              this.ip = -1;
              break;
            }
            this.current_frame = this.call_stack.pop();
            this.ip = finishing_frame.ret_addr;
            this.push(ret_val);
            if (this.in_debug_mode) {
              this.events.on_frame_pop?.();
              this.popDebugStoreFrame();
            }
            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
              last_src_start = op.src_start;
              last_src_end = op.src_end;
              yield;
            }
            continue;
          case "make_closure":
            this.push(new perc_closure(op.addr, this.current_frame.scope, op.name));
            break;
          case "call_foreign":
            const for_args = [];
            for (let i = 0; i < op.nargs; i++) for_args.push(this.pop());
            const foreign = this.foreign_funcs.get(op.name);
            if (!foreign) {
              this.return_error(new perc_err(`Foreign function not found: ${op.name}`, [op.src_start, op.src_end]));
              continue;
            }
            const res = foreign(...for_args.reverse());
            this.push(res);
            break;
          case "new_array":
            const arr_els = [];
            let arr_err = null;
            for (let i = 0; i < op.size; i++) {
              const val2 = this.pop();
              arr_els.push(val2);
              if (val2 instanceof perc_err && !arr_err) arr_err = val2;
            }
            if (arr_err) {
              this.return_error(arr_err);
              continue;
            }
            this.push(new perc_list(arr_els.reverse()));
            break;
          case "new_map":
            const m = new perc_map();
            let map_err = null;
            for (let i = 0; i < op.size; i++) {
              const val2 = this.pop();
              const key2 = this.pop();
              if (val2 instanceof perc_err && !map_err) map_err = val2;
              if (key2 instanceof perc_err && !map_err) map_err = key2;
              m.set(key2, val2);
            }
            if (map_err) {
              this.return_error(map_err);
              continue;
            }
            this.push(m);
            break;
          case "new_tuple":
            const tup_els = [];
            let tup_err = null;
            for (let i = 0; i < op.size; i++) {
              const val2 = this.pop();
              tup_els.push(val2);
              if (val2 instanceof perc_err && !tup_err) tup_err = val2;
            }
            if (tup_err) {
              this.return_error(tup_err);
              continue;
            }
            this.push(new perc_tuple(tup_els.reverse()));
            break;
          case "index_load":
            const idx = this.pop();
            const obj = this.pop();
            if (idx instanceof perc_err) {
              this.return_error(idx);
              continue;
            }
            if (obj instanceof perc_err) {
              this.return_error(obj);
              continue;
            }
            this.push(obj.get(idx));
            break;
          case "index_store":
            const st_val = this.pop();
            const st_idx = this.pop();
            const st_obj = this.pop();
            if (st_val instanceof perc_err && !op.catch) {
              this.return_error(st_val);
              continue;
            }
            if (st_idx instanceof perc_err) {
              this.return_error(st_idx);
              continue;
            }
            if (st_obj instanceof perc_err) {
              this.return_error(st_obj);
              continue;
            }
            const st_res = st_obj.set(st_idx, st_val);
            if (st_res instanceof perc_err && !op.catch) {
              this.return_error(st_res);
              continue;
            }
            this.push(st_res);
            break;
          case "member_load":
            const m_obj = this.pop();
            if (m_obj instanceof perc_err) {
              this.return_error(m_obj);
              continue;
            }
            this.push(m_obj.get(new perc_string(op.name)));
            break;
          case "member_store":
            const ms_val = this.pop();
            const ms_obj = this.pop();
            if (ms_val instanceof perc_err && !op.catch) {
              this.return_error(ms_val);
              continue;
            }
            if (ms_obj instanceof perc_err) {
              this.return_error(ms_obj);
              continue;
            }
            const ms_res = ms_obj.set(new perc_string(op.name), ms_val);
            if (ms_res instanceof perc_err && !op.catch) {
              this.return_error(ms_res);
              continue;
            }
            this.push(ms_res);
            break;
          case "debugger":
            this.in_debug_mode = true;
            this.events.on_node_eval?.([op.src_start, op.src_end]);
            this.events.on_debugger?.();
            this.events.on_state_dump?.();
            this.setDebugStore("status", "Paused (Debugger)");
            yield;
            last_src_start = op.src_start;
            last_src_end = op.src_end;
            break;
          case "enter_scope":
            this.current_frame.scope = new Scope(this.current_frame.scope);
            break;
          case "exit_scope":
            if (this.current_frame.scope.parent) {
              this.current_frame.scope = this.current_frame.scope.parent;
            } else {
              throw new Error("Cannot exit global scope");
            }
            break;
        }
      } catch (e) {
        console.error(e.message);
        this.events.on_error?.(e.message, null);
        this.setDebugStore("status", "Error");
        return;
      }
      this.ip++;
      ops_count++;
      if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end) || ops_count > 2e3) {
        last_src_start = op.src_start;
        last_src_end = op.src_end;
        ops_count = 0;
        yield;
      }
    }
  }
  should_yield(curr_start, curr_end, last_start, last_end) {
    if (this.in_debug_mode) {
      return curr_start !== last_start || curr_end !== last_end;
    }
    return curr_start !== last_start || curr_end !== last_end;
  }
  apply_binary(left, right, op) {
    switch (op) {
      case "+":
        return left.add(right);
      case "-":
        return left.sub(right);
      case "*":
        return left.mul(right);
      case "/":
        return left.div(right);
      case "%":
        return left.mod(right);
      case "==":
        return left.eq(right);
      case "is":
        return new perc_bool(left === right);
      case "!=":
        return left.ne(right);
      case "<":
        return left.lt(right);
      case "<=":
        return left.le(right);
      case ">":
        return left.gt(right);
      case ">=":
        return left.ge(right);
      case "&&":
      case "and":
        return new perc_bool(left.is_truthy() && right.is_truthy());
      case "||":
      case "or":
        return new perc_bool(left.is_truthy() || right.is_truthy());
      case "**":
        return left.pow(right);
      case "&":
        return left.bitwise_and(right);
      case "|":
        return left.bitwise_or(right);
      case "^":
        return left.bitwise_xor(right);
      case "<<":
        return left.shl(right);
      case ">>":
        return left.shr(right);
      default:
        return new perc_err(`Unknown operator: ${op}`);
    }
  }
  apply_unary(u, op) {
    switch (op) {
      case "-":
        return new perc_number(0).sub(u);
      case "!":
      case "not":
        return u.not();
      default:
        return new perc_err(`Unknown unary operator: ${op}`);
    }
  }
  return_error(err) {
    if (this.call_stack.length === 0) {
      this.ip = -1;
      console.error(err.value);
      let loc = null;
      if (err.location) {
        if (Array.isArray(err.location)) loc = err.location;
        else loc = [err.location.start.offset, err.location.end.offset];
      }
      this.events.on_error?.(err.value, loc);
      return;
    }
    const finishing_frame = this.current_frame;
    this.current_frame = this.call_stack.pop();
    this.ip = finishing_frame.ret_addr;
    this.push(err);
    if (this.in_debug_mode) {
      this.events.on_frame_pop?.();
    }
  }
  push(val) {
    this.stack.push(val);
    if (this.in_debug_mode) {
      this.events.on_stack_push?.(val);
      this.events.on_stack_top_update?.(val);
      this.setDebugStore("currentExpression", {
        value: val,
        type: val.type
      });
    }
  }
  pop() {
    if (this.stack.length === 0) throw new Error("Stack underflow");
    const v = this.stack.pop();
    if (this.in_debug_mode) {
      if (this.stack.length > 0) {
        const top = this.stack[this.stack.length - 1];
        this.events.on_stack_top_update?.(top);
        this.setDebugStore("currentExpression", {
          value: top,
          type: top.type
        });
      } else {
        this.events.on_stack_top_update?.(null);
        this.setDebugStore("currentExpression", {
          value: null,
          type: null
        });
      }
    }
    return v;
  }
  updateDebugStoreVariables(name, value, range) {
    if (!this.in_debug_mode) return;
    this.setDebugStore("callStack", 0, "variables", (vars) => ({
      ...vars,
      [name]: { value, range }
    }));
  }
  pushDebugStoreFrame(frame) {
    if (!this.in_debug_mode) return;
    const variables = this.get_scope_variables(frame.scope);
    this.setDebugStore("callStack", (stack) => [
      {
        id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: frame.name === "global" ? frame.name : `${frame.name}(${frame.args.join(", ")})`,
        args: frame.args,
        variables,
        open: true
      },
      ...stack
    ]);
  }
  popDebugStoreFrame() {
    if (!this.in_debug_mode) return;
    this.setDebugStore("callStack", (stack) => stack.slice(1));
  }
  syncDebugStore() {
    if (!this.in_debug_mode) return;
    const frames = this.get_frames();
    const debugFrames = frames.reverse().map((f) => ({
      id: `frame-${Math.random().toString(36).substr(2, 9)}`,
      name: f.name === "global" ? f.name : `${f.name}(${f.args.join(", ")})`,
      args: f.args,
      variables: this.get_scope_variables(f.scope),
      open: true
    }));
    this.setDebugStore("callStack", debugFrames);
  }
}
class GUIManager {
  subwindow = null;
  inputState = {};
  hasShownPopupWarning = false;
  clickBuffer = /* @__PURE__ */ new Set();
  hasOpenedIntentional = false;
  constructor() {
    window.addEventListener("message", (event) => {
      if (event.source !== this.subwindow) return;
      if (event.data && event.data.type === "input_update") {
        this.inputState = event.data.state;
      } else if (event.data && event.data.type === "gui_event") {
        this.clickBuffer.add(event.data.id);
      }
    });
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
  }
  openWindow(width = 640, height = 480) {
    if (this.subwindow && !this.subwindow.closed) {
      this.subwindow.focus();
      this.subwindow.postMessage({ type: "resize_window", width, height }, "*");
      return true;
    }
    if (this.hasOpenedIntentional) {
      return false;
    }
    this.subwindow = window.open("gui.html", "PerC_GUI", `width=${width},height=${height}`);
    if (this.subwindow) {
      this.hasOpenedIntentional = true;
    } else if (!this.hasShownPopupWarning) {
      alert("Please allow popups to use the GUI system.");
      this.hasShownPopupWarning = true;
    }
    setTimeout(() => {
      if (this.subwindow && !this.subwindow.closed) {
        this.subwindow.postMessage({ type: "resize_window", width, height }, "*");
      }
    }, 500);
    return !!this.subwindow;
  }
  resetIntentional() {
    this.hasOpenedIntentional = false;
    this.clickBuffer.clear();
  }
  lastUpdate = 0;
  pendingUpdate = null;
  updateTimer = null;
  sendWindowUpdate(group) {
    if (!this.subwindow || this.subwindow.closed) return;
    const now = Date.now();
    const timeSinceLast = now - this.lastUpdate;
    const TARGET_FPS = 60;
    const INTERVAL = 1e3 / TARGET_FPS;
    if (timeSinceLast >= INTERVAL) {
      this.subwindow.postMessage({ type: "render_batch", batch: group }, "*");
      this.lastUpdate = now;
      this.pendingUpdate = null;
    } else {
      this.pendingUpdate = group;
      if (!this.updateTimer) {
        this.updateTimer = setTimeout(() => {
          if (this.pendingUpdate) {
            this.subwindow?.postMessage({ type: "render_batch", batch: this.pendingUpdate }, "*");
            this.lastUpdate = Date.now();
            this.pendingUpdate = null;
          }
          this.updateTimer = null;
        }, INTERVAL - timeSinceLast);
      }
    }
  }
  getInput(id) {
    return this.inputState[id];
  }
  setInput(id, val) {
    this.inputState[id] = val;
  }
  getAllInputs() {
    return this.inputState;
  }
  isClicked(id) {
    if (this.clickBuffer.has(id)) {
      this.clickBuffer.delete(id);
      return true;
    }
    return !!this.inputState[id + "_clicked"];
  }
  cleanup() {
    if (this.subwindow && !this.subwindow.closed) {
      this.subwindow.close();
      this.subwindow = null;
    }
  }
}
const highlighting = styleTags({
  "function init change ref if then else while for in return break continue debugger new true false nil not is and or": tags.keyword,
  Identifier: tags.variableName,
  StringLiteral: tags.string,
  IntegerLiteral: tags.number,
  FloatLiteral: tags.number,
  BooleanLiteral: tags.bool,
  NilLiteral: tags.null,
  LineComment: tags.lineComment,
  BlockComment: tags.blockComment,
  "(": tags.paren,
  ")": tags.paren,
  "[": tags.squareBracket,
  "]": tags.squareBracket,
  "{": tags.brace,
  "}": tags.brace,
  ", ; : .": tags.punctuation,
  "PlusOp MinusOp MultOp DivOp ModOp PowerOp AssignOp CatchAssignOp EqOp NeqOp LtOp GtOp LteOp GteOp CompareOp BitAndOp BitOrOp BitXorOp ShiftLeftOp ShiftRightOp LogicAndOp LogicOrOp LogicNotOp": tags.operator,
  "init": tags.definitionKeyword,
  "change": tags.definitionKeyword,
  "ref": tags.definitionKeyword,
  // Builtins
  "load store print println input clone rgb rgba hsl hsla int float": tags.function(tags.variableName),
  "window end_window button fill stroke rect circle line text slider checkbox radio textbox image sprite polygon translate scale rotate group end_group z_index": tags.function(tags.variableName),
  "len keys string": tags.function(tags.variableName)
});
const spec_Identifier = { __proto__: null, function: 14, init: 32, is: 74, and: 86, or: 92, not: 98, true: 116, false: 118, nil: 122, new: 130, change: 160, ref: 164, return: 168, break: 172, continue: 176, debugger: 180, if: 184, then: 186, else: 188, while: 192, for: 196, in: 198 };
const parser = LRParser.deserialize({
  version: 14,
  states: "5YQ]QPOOO#SQPO'#ChO$tQPO'#EdO&mQPO'#D]OOQO'#Dc'#DcO&mQPO'#DlO'nQPO'#DvOOQO'#Db'#DbO'xQPO'#CoOOQO'#Da'#DaOOQO'#Co'#CoOOQO'#C`'#C`OOQO'#Ef'#EfQ]QPOOO+mQPO'#DmOOQO'#D^'#D^OOQO'#Dg'#DgOOQO'#Dj'#DjO+uQPO'#DnO+}QPO'#CkO,tQPO'#D}O,{QPO'#EPO-QQPO'#EROOQO'#ET'#ETOOQO'#EV'#EVOOQO'#EX'#EXO.QQPO'#EZO.VQPO'#E_O.[QPO'#EaOOQO,59S,59SO.aQPO,59SO&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[O&mQPO,59[OOQO'#DQ'#DQOOQO'#DW'#DWOOQO'#DZ'#DZO.hQPO,59wO+pQPO'#DmO2VQPO,5:WO2^QPO,5:bOOQO,5:b,5:bO2hQPO,5:bO2mQPO,5:eO&mQPO,5:eO2rQPO'#D|OOQO,5:g,5:gOOQO-E8d-E8dO2yQPO'#CdO+pQPO,58{O3RQPO,5:XO3WQPO'#DpO3bQPO'#DsOOQO,5:Y,5:YO3lQQO,59VO3tQQO,5:iO4VQPO'#DyO4bQQO,5:iO4sQQO,5:kO4{QPO,5:mO&mQPO,5:uO&mQPO,5:yO6tQPO,5:{OOQO1G.n1G.nO:_QPO1G.vO:lQPO1G.vO>bQPO1G.vO>lQPO1G.vOBbQPO1G.vOBiQPO1G.vOF[QPO1G.vOFcQPO1G.vOG}QPO1G.vOOQO1G/r1G/rOJ]QPO1G/|OJdQPO1G/|OOQO1G/|1G/|OOQO1G0P1G0POJlQPO1G0POJsQPO,5:hOOQO,5:h,5:hOOQO,59O,59OOJ}QPO,59OO3RQPO1G.gOOQO1G/s1G/sOKVQPO,5:[OOQO,5:[,5:[OKaQPO,5:[OKfQPO'#DtOOQO,5:_,5:_OKmQPO,5:_OKrQPO,5:_O&mQPO1G.qO&mQPO1G0TO&mQPO1G0VOKzQPO1G0aOLRQPO1G0eOLYQPO1G0gOL_QPO,5;SOOQO7+%h7+%hOLoQPO7+%hOOQO-E8f-E8fOOQO7+%k7+%kO&mQPO'#EhOLvQPO1G0SOOQO1G0S1G0SOMOQPO'#EgOMTQPO1G.jOOQO1G.j1G.jOOQO7+$R7+$ROM]QPO1G/vOMdQPO1G/vOOQO1G/v1G/vO&mQPO,5:`OOQO1G/y1G/yOMlQPO1G/yOMsQPO1G/yOM{QPO7+$]O! tQPO7+%oO!#mQPO7+%qO!%fQPO7+%{O!%kQPO7+&PO!%pQPO7+&ROOQO<<IS<<ISOOQO7+%n7+%nOOQO,5;R,5;ROOQO-E8e-E8eOOQO7+$U7+$UOOQO7+%b7+%bO!%uQPO7+%bO!%|QPO1G/zOOQO,5;T,5;TOOQO7+%e7+%eO!&WQPO7+%eOOQO-E8g-E8gO3RQPO<<IgO3RQPO<<IkO&mQPO<<ImOOQO<<H|<<H|OOQO<<IP<<IPP&mQPO'#EiO!&_QPOAN?ROOQOAN?VAN?VO!(_QPOAN?XO!(fQPOG24mO!(nQPOG24sOOQOLD*XLD*XO3RQPOLD*_OOQO!$'My!$'My",
  stateData: "!(|~O#`OSPOSQOS~OUVOV^OXTO]PO`cOiROjRO!R_O!SRO!WSO!XSO!YSO![`O!]`O!_aO!cbO!kUO!rdO!teO!vfO!xgO!zhO!|iO#OjO#SkO#UlO#X[O~O^mO~P]OeoOfoOgoOhoOipOjpOkqOlqOmrOnrOorOprOqrOrrOsrOuxOvsOwtOxuOyvO{yO|wO!OzO~OU#WXV#WXX#WX]#WX`#WX!R#WX!S#WX!W#WX!X#WX!Y#WX![#WX!]#WX!_#WX!c#WX!k#WX!r#WX!t#WX!v#WX!x#WX!z#WX!|#WX#O#WX#S#WX#U#WX#X#WX#^#WX^#WX~P#ZOUVOV|OXTOiROjRO!R_O!SRO!WSO!XSO!YSO![`O!]`O!_aO!cbO!kUO~OY!QO!l!PO~P&mOX!TO!e!SO!n!ROUcXVcX]cX`cXecXfcXgcXhcXicXjcXkcXlcXmcXncXocXpcXqcXrcXscXucXvcXwcXxcXycX{cX|cX!OcX!RcX!ScX!WcX!XcX!YcX![cX!]cX!_cX!ccX!kcX!rcX!tcX!vcX!xcX!zcX!|cX#OcX#ScX#UcX#XcX#^cX^cXZcXYcX!lcX!fcX!icX~OU!XOX!WO~O]![O!e!ZO~OU!^O~OV|OXTO!WSO!XSO!YSO![`O!]`O!_aO!cbO!kUO~OU!_O~P,SOU!bO~O]!uX`!uX!r!uX!t!uX!v!uX!x!uX!z!uX!|!uX#O!uX#S!uX#U!uX#X!uX#^!uX^!uX~P&mOX!dO~OX!eO~OX!fO~O^!gO~P]OeoOU!PaV!PaX!Pa]!Pa`!Paf!Pag!Pah!Pai!Paj!Pak!Pal!Pam!Pan!Pao!Pap!Paq!Par!Pas!Pau!Pav!Paw!Pax!Pay!Pa{!Pa|!Pa!O!Pa!R!Pa!S!Pa!W!Pa!X!Pa!Y!Pa![!Pa!]!Pa!_!Pa!c!Pa!k!Pa!r!Pa!t!Pa!v!Pa!x!Pa!z!Pa!|!Pa#O!Pa#S!Pa#U!Pa#X!Pa#^!Pa^!PaZ!PaY!Pa!l!Pa!f!Pa!i!Pa~OZ!qO~P#ZOY!rO!l!tO~P#ZO!l!tO~OU!uO~OZ!xO~P&mOU!zOZ!yO~O]PO~OY#PO!f#OO~P&mOY#SO^#RO~P&mOa#UOb#UO~Oa#VOb#VOX!UX!e!UX!n!UX~OX!TO!e!SO!n!RO~Oa#VOb#VOX!TX!e!TX!n!TX~Oa#WOb#WO~OU!uaV!uaX!ua]!ua`!ua!R!ua!S!ua!W!ua!X!ua!Y!ua![!ua!]!ua!_!ua!c!ua!k!ua!r!ua!t!ua!v!ua!x!ua!z!ua!|!ua#O!ua#S!ua#U!ua#X!ua#^!ua^!ua~P#ZO`#ZO~OeoOUdiVdiXdi]di`diidijdikdildimdindiodipdiqdirdisdiudivdiwdixdiydi{di|di!Odi!Rdi!Sdi!Wdi!Xdi!Ydi![di!]di!_di!cdi!kdi!rdi!tdi!vdi!xdi!zdi!|di#Odi#Sdi#Udi#Xdi#^di^diZdiYdi!ldi!fdi!idi~Ofdigdihdi~P6yOfoOgoOhoO~P6yOeoOfoOgoOhoOipOjpOUdiVdiXdi]di`dimdindiodipdiqdirdisdiudivdiwdixdiydi{di|di!Odi!Rdi!Sdi!Wdi!Xdi!Ydi![di!]di!_di!cdi!kdi!rdi!tdi!vdi!xdi!zdi!|di#Odi#Sdi#Udi#Xdi#^di^diZdiYdi!ldi!fdi!idi~Okdildi~P:yOkqOlqO~P:yOeoOfoOgoOhoOipOjpOkqOlqOmrOnrOorOprOqrOrrOsrOuxOUdiVdiXdi]di`diwdixdiydi{di|di!Odi!Rdi!Sdi!Wdi!Xdi!Ydi![di!]di!_di!cdi!kdi!rdi!tdi!vdi!xdi!zdi!|di#Odi#Sdi#Udi#Xdi#^di^diZdiYdi!ldi!fdi!idi~Ovdi~P>vOvsO~P>vOeoOfoOgoOhoOipOjpOkqOlqOmrOnrOorOprOqrOrrOsrOuxOvsOwtOUdiVdiXdi]di`diydi{di|di!Odi!Rdi!Sdi!Wdi!Xdi!Ydi![di!]di!_di!cdi!kdi!rdi!tdi!vdi!xdi!zdi!|di#Odi#Sdi#Udi#Xdi#^di^diZdiYdi!ldi!fdi!idi~Oxdi~PBpOxuO~PBpOeoOfoOgoOhoOipOjpOkqOlqOmrOnrOorOprOqrOrrOsrOuxOvsOwtOxuOyvO{yO~OUdiVdiXdi]di`di|di!Odi!Rdi!Sdi!Wdi!Xdi!Ydi![di!]di!_di!cdi!kdi!rdi!tdi!vdi!xdi!zdi!|di#Odi#Sdi#Udi#Xdi#^di^diZdiYdi!ldi!fdi!idi~PFjO!l#]O~P&mOY#^O!l#]O~O!f#`O~P#ZOY#aOZ#cO~P#ZOY#dOZ#fO~OY#hO!f#jO~P#ZO!f#jO~O!i#kO~P#ZO^#lO~OY#mO^#lO~OZ#rO~P#ZOZ#sO~P#ZOU#tO~OY#[a!l#[aZ#[a!f#[a~P#ZO!l#uO~P&mOY#aOZ#vO~OU#wO~OY#dOZ#yO~O!f#zO~P&mOY#{O!f#zO~O^$OO~P&mOY$PO^$OO~OU_qV_qX_q]_q`_q!R_q!S_q!W_q!X_q!Y_q![_q!]_q!__q!c_q!k_q!r_q!t_q!v_q!x_q!z_q!|_q#O_q#S_q#U_q#X_q#^_q^_q~P#ZOU!qqV!qqX!qq]!qq`!qq!R!qq!S!qq!W!qq!X!qq!Y!qq![!qq!]!qq!_!qq!c!qq!k!qq!r!qq!t!qq!v!qq!x!qq!z!qq!|!qq#O!qq#S!qq#U!qq#X!qq#^!qq^!qq~P#ZOU!sqV!sqX!sq]!sq`!sq!R!sq!S!sq!W!sq!X!sq!Y!sq![!sq!]!sq!_!sq!c!sq!k!sq!r!sq!t!sq!v!sq!x!sq!z!sq!|!sq#O!sq#S!sq#U!sq#X!sq#^!sq^!sq~P#ZO#P$RO~O#P$SO~O#V$TO~O!f$UO~P&mOY!hi^!hi~P#ZO^$VO~P&mO#Q$[OU!}!RV!}!RX!}!R]!}!R`!}!Ri!}!Rj!}!R!R!}!R!S!}!R!W!}!R!X!}!R!Y!}!R![!}!R!]!}!R!_!}!R!c!}!R!k!}!R!r!}!R!t!}!R!v!}!R!x!}!R!z!}!R!|!}!R#O!}!R#S!}!R#U!}!R#X!}!R#^!}!R^!}!R~OZ$]O~P#ZO]PO#OjO~O#P$_O~OQPg!X!WU!X!n~",
  goto: ".s#^PPPP#_#ePP#kPPP#rPP#ePPP$[&WPPPPPPPPPPPPPPP'OPPPPP'gPP'zP&W(^PP)U*P*xPPP+qPP+qP*x*x*xP,jPP,j,mP*xPP,uP*P-p#eP#eP#eP#eP#eP#eP-tPPP#eP#ePP#eP-}.X._.mX[OP]nXZOP]nS!Y^|R!{!XWZOP]nQ!|!YQ#g!{Q$X$RQ$Y$SQ$^$[R$`$_WQOP]nQ{RQ}TQ!OUQ!cfQ!hoQ!ipQ!jqQ!krQ!lsQ!mtQ!nuQ!ovQ!pwQ!v!SQ!w!TQ!}!ZW#Q![#m$P$WQ#X!dQ#Y!eY#[!r#^#a#h#{Q#o#UQ#p#VQ#q#WQ#|#kR$Z$T!kYOPRTU]fnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$W{rQ}!O!c!l!m!n!o!p!v!w!}#Q#X#Y#[#o#p#q#|$ZsvQ}!O!c!p!v!w!}#Q#X#Y#[#o#p#q#|$ZqwQ}!O!c!v!w!}#Q#X#Y#[#o#p#q#|$Z!kROPRTU]fnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$W!jWOPRTU]fnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$WR!`d!mXOPRTU]dfnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$W!mVOPRTU]dfnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$W!mSOPRTU]dfnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$WR!]bQ#T![V#}#m$P$W!jXOPRTU]fnopqrstuvw!S!T!Z![!d!e!r#U#V#W#^#a#h#k#m#{$P$T$WR!adT!UW!`WZOP]nR$^$[Q]OQnPT!V]nQ#e!zR#x#eQ!s!OU#_!s#b#iQ#b!wR#i!}Q#n#TR$Q#n",
  nodeNames: "⚠ LineComment BlockComment SourceFile Statement FunctionDeclaration Identifier function ParameterList ( , ) Block { } VarInit init AssignOp CatchAssignOp Expression BinaryExpression PowerOp MultOp DivOp ModOp PlusOp MinusOp ShiftLeftOp ShiftRightOp EqOp NeqOp LtOp GtOp LteOp GteOp CompareOp IsOp is BitAndOp BitXorOp BitOrOp LogicAndOp AndOp and LogicOrOp OrOp or UnaryExpression NotOp not LogicNotOp PostfixExpression PrimaryExpression Literal IntegerLiteral FloatLiteral StringLiteral BooleanLiteral true false NilLiteral nil ParenthesizedExpression FunctionLiteral InstantiationExpression new ArrayLiteral [ ] MapLiteral Pair : TupleLiteral (| |) MemberExpression . CallExpression ArgumentList VarChange change VarRef ref ReturnStatement return BreakStatement break ContinueStatement continue DebuggerStatement debugger IfStatement if then else WhileStatement while ForInStatement for in ExpressionStatement ;",
  maxTerm: 108,
  propSources: [highlighting],
  skippedNodes: [0, 1, 2],
  repeatNodeCount: 4,
  tokenData: "0q~RvX^#ipq#iqr$^rs$kuv&Xvw&^xy&kyz&xz{&}{|'[|}'a}!O'f!O!P'k!P!Q(s!Q!R*h!R![+e![!]-k!]!^-p!^!_-u!_!`.d!`!a.y!c!}/`!}#O/q#P#Q/v#Q#R/{#R#S/`#T#o/`#o#p0Q#p#q0V#q#r0l#y#z#i$f$g#i#BY#BZ#i$IS$I_#i$I|$JO#i$JT$JU#i$KV$KW#i&FU&FV#i~#nY#`~X^#ipq#i#y#z#i$f$g#i#BY#BZ#i$IS$I_#i$I|$JO#i$JT$JU#i$KV$KW#i&FU&FV#i~$cP!S~!_!`$f~$kOn~~$nVOr$krs%Ts#O$k#O#P%Y#P;'S$k;'S;=`&R<%lO$k~%YO!Y~~%]RO;'S$k;'S;=`%f;=`O$k~%iWOr$krs%Ts#O$k#O#P%Y#P;'S$k;'S;=`&R;=`<%l$k<%lO$k~&UP;=`<%l$k~&^Oh~~&cPv~vw&f~&kOy~~&pPX~#p#q&s~&xO!k~~&}OZ~~'SPf~z{'V~'[Oe~~'aOi~~'fOY~~'kOj~~'pP!n~!Q!['s~'xS!X~!Q!['s!g!h(U#R#S's#X#Y(U~(XR{|(b}!O(b!Q![(h~(eP!Q![(h~(mQ!X~!Q![(h#R#S(h~(xQg~z{)O!P!Q*P~)RTOz)Oz{)b{;'S)O;'S;=`)y<%lO)O~)eTO!P)O!P!Q)t!Q;'S)O;'S;=`)y<%lO)O~)yOQ~~)|P;=`<%l)O~*USP~OY*PZ;'S*P;'S;=`*b<%lO*P~*eP;=`<%l*P~*mW!W~!O!P+V!Q![+e!g!h(U#R#S+e#U#V+y#X#Y(U#c#d,e#l#m,y~+[R!X~!Q!['s!g!h(U#X#Y(U~+jT!W~!O!P+V!Q![+e!g!h(U#R#S+e#X#Y(U~+|R!Q!R,V!R!S,V#R#S,V~,[R!W~!Q!R,V!R!S,V#R#S,V~,hQ!Q!Y,n#R#S,n~,sQ!W~!Q!Y,n#R#S,n~,|S!Q![-Y!c!i-Y#R#S-Y#T#Z-Y~-_S!W~!Q![-Y!c!i-Y#R#S-Y#T#Z-Y~-pO!i~~-uO#X~~-zQo~!^!_.Q!_!`.V~.VOk~~.[Pq~!`!a._~.dOs~~.iQaQ!_!`.o!a!b.tP.tOmP~.yOb~~/OQp~!_!`/U!`!a/Z~/ZOr~~/`Ol~~/eSU~!Q![/`!c!}/`#R#S/`#T#o/`~/vO!e~~/{O!f~~0QOw~~0VO]~~0[Qx~yz0b#p#q0g~0gO!l~~0lO|~~0qO^~",
  tokenizers: [0, 1],
  topRules: { "SourceFile": [0, 3] },
  specialized: [{ term: 6, get: (value) => spec_Identifier[value] || -1 }],
  tokenPrec: 2473
});
const createConsoleBuiltins = (appConsole, onRequestInput) => {
  return {
    "print": (...args) => {
      const msg = args.map((a) => a.to_string()).join(" ");
      appConsole.print(msg);
      return new perc_nil();
    },
    "println": (...args) => {
      const msg = args.map((a) => a.to_string()).join(" ");
      appConsole.println(msg);
      return new perc_nil();
    },
    "text_color": (color) => {
      if (!(color instanceof perc_map)) {
        return new perc_err(`text_color: argument must be a color map (from rgb() or hsl()), got ${color.type}`);
      }
      const r = color.get(new perc_string("r"));
      const g = color.get(new perc_string("g"));
      const b = color.get(new perc_string("b"));
      if (!(r instanceof perc_number) || !(g instanceof perc_number) || !(b instanceof perc_number)) {
        return new perc_err("text_color: invalid color map components");
      }
      const rVal = Math.max(0, Math.min(255, Math.floor(r.buffer[0])));
      const gVal = Math.max(0, Math.min(255, Math.floor(g.buffer[0])));
      const bVal = Math.max(0, Math.min(255, Math.floor(b.buffer[0])));
      appConsole.setTextColor(`rgb(${rVal}, ${gVal}, ${bVal})`);
      return new perc_nil();
    },
    // onInput callback to notify the VM/UI
    "input": (prompt2) => {
      const promptStr = prompt2 instanceof perc_string ? prompt2.value : "";
      onRequestInput(promptStr);
      return new perc_nil();
    }
  };
};
function percColorToColor(color) {
  console.assert(color instanceof perc_map);
  const r = color.get(new perc_string("r"));
  const g = color.get(new perc_string("g"));
  const b = color.get(new perc_string("b"));
  const a = color.get(new perc_string("a"));
  return { r: r.buffer[0], g: g.buffer[0], b: b.buffer[0], a: a.buffer[0] };
}
const createGuiBuiltins = (gui) => {
  const spriteConversionCache = /* @__PURE__ */ new WeakMap();
  let commandList = [];
  function pushCmd(cmd) {
    commandList.push(cmd);
  }
  function validateGUIArgs(funcName, args, expected) {
    for (let i = 0; i < expected.length; i++) {
      const exp = expected[i];
      const isOptional = exp.endsWith("?");
      const baseType = isOptional ? exp.slice(0, -1) : exp;
      const arg = args[i];
      if (arg === void 0 || arg instanceof perc_nil) {
        if (isOptional) continue;
        return new perc_err(`${funcName}() expects at least ${expected.filter((e) => !e.endsWith("?")).length} arguments, but argument ${i + 1} is missing`);
      }
      if (baseType === "number" && !(arg instanceof perc_number)) {
        return new perc_err(`${funcName}() argument ${i + 1} must be a number, got ${arg.type || arg.constructor.name}`);
      } else if (baseType === "string" && !(arg instanceof perc_string)) {
        return new perc_err(`${funcName}() argument ${i + 1} must be a string, got ${arg.type || arg.constructor.name}`);
      } else if (baseType === "color" && !(arg instanceof perc_map)) {
        return new perc_err(`${funcName}() argument ${i + 1} must be a color (rgb/hsl), got ${arg.type || arg.constructor.name}`);
      } else if (baseType === "array" && !(arg instanceof perc_list)) {
        return new perc_err(`${funcName}() argument ${i + 1} must be an array, got ${arg.type || arg.constructor.name}`);
      }
    }
    return void 0;
  }
  return {
    "window": (width, height) => {
      const err = validateGUIArgs("window", [width, height], ["number?", "number?"]);
      if (err) return err;
      commandList = [];
      const w = width instanceof perc_number ? width.buffer[0] : 640;
      const h = height instanceof perc_number ? height.buffer[0] : 480;
      const success = gui.openWindow(w, h);
      if (!success) {
        return new perc_err("Window was closed");
      }
      return new perc_nil();
    },
    "end_window": () => {
      gui.sendWindowUpdate(commandList);
      return new perc_nil();
    },
    "button": (text, x, y) => {
      const err = validateGUIArgs("button", [text, x, y], ["string", "number", "number"]);
      if (err) return err;
      const textStr = text.to_string();
      const xVal = x.buffer[0];
      const yVal = y.buffer[0];
      const id = `btn_${textStr}_${xVal}_${yVal}`;
      pushCmd({
        type: "button",
        id,
        text: textStr,
        pos: { x: xVal, y: yVal }
      });
      return new perc_bool(gui.isClicked(id));
    },
    "fill": (color) => {
      const err = validateGUIArgs("fill", [color], ["color"]);
      if (err) return err;
      pushCmd({
        type: "fill",
        fill: percColorToColor(color)
      });
      return new perc_nil();
    },
    "stroke": (color, width) => {
      const err = validateGUIArgs("stroke", [color, width], ["color", "number?"]);
      if (err) return err;
      const cmd = {
        type: "stroke",
        stroke: percColorToColor(color)
      };
      if (width) {
        cmd.strokeWidth = width.buffer[0];
      }
      pushCmd(cmd);
      return new perc_nil();
    },
    "rect": (x, y, w, h) => {
      const err = validateGUIArgs("rect", [x, y, w, h], ["number", "number", "number", "number"]);
      if (err) return err;
      pushCmd({
        type: "rect",
        pos: { x: x.buffer[0], y: y.buffer[0] },
        width: w.buffer[0],
        height: h.buffer[0]
      });
      return new perc_nil();
    },
    "circle": (x, y, r) => {
      const err = validateGUIArgs("circle", [x, y, r], ["number", "number", "number"]);
      if (err) return err;
      pushCmd({
        type: "circle",
        pos: { x: x.buffer[0], y: y.buffer[0] },
        radius: r.buffer[0]
      });
      return new perc_nil();
    },
    "line": (x1, y1, x2, y2) => {
      const err = validateGUIArgs("line", [x1, y1, x2, y2], ["number", "number", "number", "number"]);
      if (err) return err;
      pushCmd({
        type: "line",
        p1: { x: x1.buffer[0], y: y1.buffer[0] },
        p2: { x: x2.buffer[0], y: y2.buffer[0] }
      });
      return new perc_nil();
    },
    "text": (text, x, y, align) => {
      const err = validateGUIArgs("text", [text, x, y, align], ["string", "number", "number", "string?"]);
      if (err) return err;
      pushCmd({
        type: "text",
        text: text.to_string(),
        pos: { x: x.buffer[0], y: y.buffer[0] },
        align: align instanceof perc_string ? align.to_string() : "left"
      });
      return new perc_nil();
    },
    "slider": (x, y, label) => {
      const err = validateGUIArgs("slider", [x, y, label], ["number", "number", "string?"]);
      if (err) return err;
      const xVal = x.buffer[0];
      const yVal = y.buffer[0];
      const labelStr = label instanceof perc_string ? label.to_string() : void 0;
      const id = `slider_${xVal}_${yVal}`;
      const currentVal = gui.getInput(id + "_val") || 0;
      pushCmd({
        type: "slider",
        id,
        pos: { x: xVal, y: yVal },
        width: 200,
        height: 20,
        label: labelStr,
        val: currentVal
      });
      return new perc_number(currentVal);
    },
    "translate": (x, y) => {
      const err = validateGUIArgs("translate", [x, y], ["number", "number"]);
      if (err) return err;
      const tx = x.buffer[0];
      const ty = y.buffer[0];
      const mat = [
        1,
        0,
        tx,
        0,
        1,
        ty,
        0,
        0,
        1
      ];
      pushCmd({
        type: "transform",
        transform: mat
      });
      return new perc_nil();
    },
    "scale": (x, y) => {
      const err = validateGUIArgs("scale", [x, y], ["number", "number"]);
      if (err) return err;
      const sx = x.buffer[0];
      const sy = y.buffer[0];
      const mat = [
        sx,
        0,
        0,
        0,
        sy,
        0,
        0,
        0,
        1
      ];
      pushCmd({
        type: "transform",
        transform: mat
      });
      return new perc_nil();
    },
    "rotate": (angle) => {
      const err = validateGUIArgs("rotate", [angle], ["number"]);
      if (err) return err;
      const a = angle.buffer[0];
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const mat = [
        cos,
        -sin,
        0,
        sin,
        cos,
        0,
        0,
        0,
        1
      ];
      pushCmd({
        type: "transform",
        transform: mat
      });
      return new perc_nil();
    },
    "group": () => {
      pushCmd({ type: "group" });
      return new perc_nil();
    },
    "end_group": () => {
      pushCmd({ type: "end_group" });
      return new perc_nil();
    },
    "image": (x, y, w, h, url) => {
      const err = validateGUIArgs("image", [x, y, w, h, url], ["number", "number", "number", "number", "string"]);
      if (err) return err;
      pushCmd({
        type: "image",
        pos: { x: x.buffer[0], y: y.buffer[0] },
        width: w.buffer[0],
        height: h.buffer[0],
        src: url.to_string()
      });
      return new perc_nil();
    },
    "sprite": (x, y, w, h, data) => {
      const err = validateGUIArgs("sprite", [x, y, w, h, data], ["number", "number", "number", "number", "array"]);
      if (err) return err;
      let pixels = [];
      if (data instanceof perc_list) {
        const cached = spriteConversionCache.get(data);
        if (cached) {
          pixels = cached;
        } else {
          for (const pixel of data.elements) {
            if (!(pixel instanceof perc_map)) {
              return new perc_err(`sprite: pixel data contains non-color value`);
            }
            const rVal = pixel.get(new perc_string("r"));
            const gVal = pixel.get(new perc_string("g"));
            const bVal = pixel.get(new perc_string("b"));
            const aVal = pixel.get(new perc_string("a"));
            pixels.push({
              r: rVal instanceof perc_number ? rVal.buffer[0] : 0,
              g: gVal instanceof perc_number ? gVal.buffer[0] : 0,
              b: bVal instanceof perc_number ? bVal.buffer[0] : 0,
              a: aVal instanceof perc_number ? aVal.buffer[0] : 1
            });
          }
          spriteConversionCache.set(data, pixels);
        }
      }
      pushCmd({
        type: "sprite",
        pos: { x: x.buffer[0], y: y.buffer[0] },
        width: w.buffer[0],
        height: h.buffer[0],
        data: pixels
      });
      return new perc_nil();
    },
    "polygon": (x, y, points) => {
      const err = validateGUIArgs("polygon", [x, y, points], ["number", "number", "array"]);
      if (err) return err;
      const pts = [];
      if (points instanceof perc_list) {
        for (const p of points.elements) {
          if (p instanceof perc_map) {
            pts.push({
              x: p.get(new perc_string("x")).buffer[0],
              y: p.get(new perc_string("y")).buffer[0]
            });
          }
        }
      }
      const originX = x.buffer[0];
      const originY = y.buffer[0];
      const adjustedPts = pts.map((p) => ({ x: p.x + originX, y: p.y + originY }));
      pushCmd({
        type: "polygon",
        pos: adjustedPts
      });
      return new perc_nil();
    },
    "textbox": (x, y, prompt2) => {
      const err = validateGUIArgs("textbox", [x, y, prompt2], ["number", "number", "string?"]);
      if (err) return err;
      const xVal = x.buffer[0];
      const yVal = y.buffer[0];
      const promptStr = prompt2 instanceof perc_string ? prompt2.to_string() : "";
      const id = `textbox_${xVal}_${yVal}`;
      const val = gui.getInput(id + "_val") || "";
      pushCmd({
        type: "textbox",
        id,
        pos: { x: xVal, y: yVal },
        width: 150,
        height: 25,
        prompt: promptStr,
        val
      });
      return new perc_string(val);
    },
    "checkbox": (x, y, label) => {
      const err = validateGUIArgs("checkbox", [x, y, label], ["number", "number", "string?"]);
      if (err) return err;
      const xVal = x.buffer[0];
      const yVal = y.buffer[0];
      const labelStr = label instanceof perc_string ? label.to_string() : void 0;
      const id = `chk_${xVal}_${yVal}`;
      const val = gui.getInput(id + "_val") || false;
      pushCmd({
        type: "checkbox",
        id,
        pos: { x: xVal, y: yVal },
        label: labelStr,
        val
      });
      return new perc_bool(val);
    },
    "radio": (group, x, y, label) => {
      const err = validateGUIArgs("radio", [group, x, y, label], ["string", "number", "number", "string?"]);
      if (err) return err;
      const groupName = group.to_string();
      const xVal = x.buffer[0];
      const yVal = y.buffer[0];
      const labelStr = label instanceof perc_string ? label.to_string() : void 0;
      const id = `rad_${groupName}_${xVal}_${yVal}`;
      const val = gui.getInput(id + "_val") || false;
      if (gui.isClicked(id)) {
        const allInputs = gui.getAllInputs();
        for (const key2 in allInputs) {
          if (key2.startsWith(`rad_${groupName}_`) && key2.endsWith("_val") && key2 !== id + "_val") {
            gui.setInput(key2, false);
          }
        }
      }
      pushCmd({
        type: "radio",
        id,
        group: groupName,
        pos: { x: xVal, y: yVal },
        label: labelStr,
        val
      });
      return new perc_bool(val);
    }
  };
};
function createAppStore() {
  const [store, setStore] = createStore({
    layout: {
      editorSplit: 0.5,
      dcSplit: 0.5
    },
    vm: {
      state: "idle"
    }
  });
  const actions = {
    get layout() {
      return store.layout;
    },
    get vm() {
      return store.vm;
    },
    updateSize: (divider, ratio) => {
      if (divider === "editor_dc") {
        setStore("layout", "editorSplit", ratio);
      } else if (divider === "dc") {
        setStore("layout", "dcSplit", ratio);
      }
    },
    setVM: (state) => {
      setStore("vm", "state", state);
    },
    resetLayout: () => {
      setStore("layout", "editorSplit", 0.5);
      setStore("layout", "dcSplit", 0.5);
    }
  };
  return actions;
}
const appStore = createAppStore();
const menuBar = "_menuBar_axp7g_1";
const logo = "_logo_axp7g_29";
const menuActions = "_menuActions_axp7g_47";
const menuSpacer = "_menuSpacer_axp7g_57";
const menuOptions = "_menuOptions_axp7g_65";
const menuBtn = "_menuBtn_axp7g_75";
const runBtn = "_runBtn_axp7g_129";
const stopBtn = "_stopBtn_axp7g_147";
const styles$6 = {
  menuBar,
  logo,
  menuActions,
  menuSpacer,
  menuOptions,
  menuBtn,
  runBtn,
  stopBtn
};
var _tmpl$$6 = /* @__PURE__ */ template(`<button aria-label="Run Code"><span aria-hidden=true>▶</span> Run`), _tmpl$2$3 = /* @__PURE__ */ template(`<button aria-label="Build Project"><span aria-hidden=true>🔨</span> Build`), _tmpl$3$2 = /* @__PURE__ */ template(`<button aria-label="Stop Execution"><span aria-hidden=true>🛑</span> Stop`), _tmpl$4$2 = /* @__PURE__ */ template(`<button aria-label="Stop Debugging"><span aria-hidden=true>🛑</span> Stop`), _tmpl$5$2 = /* @__PURE__ */ template(`<button aria-label="Step Into"><span aria-hidden=true>⏯</span> Step`), _tmpl$6$2 = /* @__PURE__ */ template(`<button aria-label="Continue Execution"><span aria-hidden=true>⏩</span> Continue`), _tmpl$7$2 = /* @__PURE__ */ template(`<header><nav aria-label="Main Toolbar"><div aria-hidden=true>PerC IDE</div><div></div><div></div><div><button>Restore Layout</button><button>Theme: <span aria-hidden=true></span></button><button>Wrap: `);
const MenuBar = (props) => {
  const [theme, setTheme] = createSignal("dark");
  function toggleTheme() {
    const current = theme();
    let next;
    if (current === "light") next = "dark";
    else if (current === "dark") next = "contrast";
    else next = "light";
    setTheme(next);
    props.onTheme(next);
  }
  const [wrap, setWrap] = createSignal("on");
  function toggleWrap() {
    const newWrap = wrap() === "on" ? "off" : "on";
    setWrap(newWrap);
    props.onWrap(newWrap);
  }
  return (() => {
    var _el$ = _tmpl$7$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$1 = _el$4.nextSibling, _el$10 = _el$1.nextSibling, _el$11 = _el$10.firstChild, _el$12 = _el$11.nextSibling, _el$13 = _el$12.firstChild, _el$14 = _el$13.nextSibling, _el$15 = _el$12.nextSibling;
    _el$15.firstChild;
    insert(_el$4, createComponent(Switch, {
      get children() {
        return [createComponent(Match, {
          get when() {
            return props.menuState === "idle";
          },
          get children() {
            return [(() => {
              var _el$5 = _tmpl$$6();
              addEventListener(_el$5, "click", props.onRun);
              createRenderEffect(() => className(_el$5, `${styles$6.menuBtn} ${styles$6.runBtn}`));
              return _el$5;
            })(), (() => {
              var _el$6 = _tmpl$2$3();
              addEventListener(_el$6, "click", props.onBuild);
              createRenderEffect(() => className(_el$6, styles$6.menuBtn));
              return _el$6;
            })()];
          }
        }), createComponent(Match, {
          get when() {
            return props.menuState === "running";
          },
          get children() {
            var _el$7 = _tmpl$3$2();
            addEventListener(_el$7, "click", props.onStop);
            createRenderEffect(() => className(_el$7, `${styles$6.menuBtn} ${styles$6.stopBtn}`));
            return _el$7;
          }
        }), createComponent(Match, {
          get when() {
            return props.menuState === "debugging";
          },
          get children() {
            return [(() => {
              var _el$8 = _tmpl$4$2();
              addEventListener(_el$8, "click", props.onStop);
              createRenderEffect(() => className(_el$8, `${styles$6.menuBtn} ${styles$6.stopBtn}`));
              return _el$8;
            })(), (() => {
              var _el$9 = _tmpl$5$2();
              addEventListener(_el$9, "click", props.onStep);
              createRenderEffect(() => className(_el$9, styles$6.menuBtn));
              return _el$9;
            })(), (() => {
              var _el$0 = _tmpl$6$2();
              addEventListener(_el$0, "click", props.onContinue);
              createRenderEffect(() => className(_el$0, styles$6.menuBtn));
              return _el$0;
            })()];
          }
        })];
      }
    }));
    _el$11.$$click = () => appStore.resetLayout();
    _el$12.$$click = toggleTheme;
    insert(_el$14, (() => {
      var _c$ = memo(() => theme() === "light");
      return () => _c$() ? "☀️" : theme() === "dark" ? "🌙" : "👁️";
    })());
    _el$15.$$click = toggleWrap;
    insert(_el$15, () => wrap() === "on" ? "On" : "Off", null);
    createRenderEffect((_p$) => {
      var _v$ = `${styles$6.menuBar} menu-bar`, _v$2 = styles$6.menuBar, _v$3 = styles$6.logo, _v$4 = styles$6.menuActions, _v$5 = styles$6.menuSpacer, _v$6 = styles$6.menuOptions, _v$7 = styles$6.menuBtn, _v$8 = styles$6.menuBtn, _v$9 = `Switch to next theme (current: ${theme()})`, _v$0 = styles$6.menuBtn, _v$1 = `Turn word wrap ${wrap() === "on" ? "off" : "on"}`;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$3, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$4, _p$.o = _v$4);
      _v$5 !== _p$.i && className(_el$1, _p$.i = _v$5);
      _v$6 !== _p$.n && className(_el$10, _p$.n = _v$6);
      _v$7 !== _p$.s && className(_el$11, _p$.s = _v$7);
      _v$8 !== _p$.h && className(_el$12, _p$.h = _v$8);
      _v$9 !== _p$.r && setAttribute(_el$12, "aria-label", _p$.r = _v$9);
      _v$0 !== _p$.d && className(_el$15, _p$.d = _v$0);
      _v$1 !== _p$.l && setAttribute(_el$15, "aria-label", _p$.l = _v$1);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0
    });
    return _el$;
  })();
};
delegateEvents(["click"]);
const zoomControl = "_zoomControl_1w7pf_1";
const zoomBtn = "_zoomBtn_1w7pf_33";
const zoomSlider = "_zoomSlider_1w7pf_77";
const zoomReset = "_zoomReset_1w7pf_133";
const styles$5 = {
  zoomControl,
  zoomBtn,
  zoomSlider,
  zoomReset
};
var _tmpl$$5 = /* @__PURE__ */ template(`<div role=group aria-label="Zoom Controls"><button title="Zoom Out"aria-label="Zoom Out">-</button><label for=zoom-slider class=sr-only>Zoom Level</label><input id=zoom-slider type=range><button title="Zoom In"aria-label="Zoom In">+</button><button title="Reset to 100%"aria-label="Reset Zoom to 100%">%`);
const ZoomControl = (props) => {
  const min = props.minZoomPct ?? 50;
  const max = props.maxZoomPct ?? 500;
  const initial = props.initialZoom ?? 100;
  const [zoom, setZoom] = createSignal(initial);
  const updateZoom = (val) => {
    const newVal = Math.max(min, Math.min(max, val));
    setZoom(newVal);
    props.onZoom(newVal);
  };
  return (() => {
    var _el$ = _tmpl$$5(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling, _el$7 = _el$6.firstChild;
    _el$2.$$click = () => updateZoom(zoom() - 10);
    _el$4.$$input = (e) => updateZoom(parseInt(e.currentTarget.value));
    setAttribute(_el$4, "min", min);
    setAttribute(_el$4, "max", max);
    setAttribute(_el$4, "aria-valuemin", min);
    setAttribute(_el$4, "aria-valuemax", max);
    _el$5.$$click = () => updateZoom(zoom() + 10);
    _el$6.$$click = () => updateZoom(100);
    insert(_el$6, zoom, _el$7);
    createRenderEffect((_p$) => {
      var _v$ = styles$5.zoomControl, _v$2 = styles$5.zoomBtn, _v$3 = styles$5.zoomSlider, _v$4 = zoom(), _v$5 = styles$5.zoomBtn, _v$6 = styles$5.zoomReset;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$4, _p$.a = _v$3);
      _v$4 !== _p$.o && setAttribute(_el$4, "aria-valuenow", _p$.o = _v$4);
      _v$5 !== _p$.i && className(_el$5, _p$.i = _v$5);
      _v$6 !== _p$.n && className(_el$6, _p$.n = _v$6);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    createRenderEffect(() => _el$4.value = zoom());
    return _el$;
  })();
};
delegateEvents(["click", "input"]);
const editorPane = "_editorPane_us4ay_1";
const header$2 = "_header_us4ay_29";
const titleArea$2 = "_titleArea_us4ay_63";
const controls$2 = "_controls_us4ay_75";
const content$2 = "_content_us4ay_87";
const vertical$2 = "_vertical_us4ay_109";
const styles$4 = {
  editorPane,
  header: header$2,
  titleArea: titleArea$2,
  controls: controls$2,
  content: content$2,
  vertical: vertical$2
};
const keywords = "init change function if then else while for in return break continue debugger new true false nil not is and or clone typeof".split(" ");
const percLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Block: delimitedIndent({ closing: "}" }),
        MapLiteral: delimitedIndent({ closing: "}" }),
        ArrayLiteral: delimitedIndent({ closing: "]" }),
        TupleLiteral: delimitedIndent({ closing: "|)" })
        // delimitedIndent expects a string for close token.
      }),
      foldNodeProp.add({
        Block: foldInside,
        MapLiteral: foldInside,
        ArrayLiteral: foldInside
      })
    ]
  }),
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(\}|\]|\)|else|then)$/,
    closeBrackets: { brackets: ["(", "[", "{", "'", '"'] }
  }
});
function percAutocomplete(builtins = [], variableProvider = () => []) {
  return (context) => {
    let word = context.matchBefore(/\w*/);
    if (!word || word.from == word.to && !context.explicit) return null;
    if (/^\d/.test(word.text)) return null;
    const generatedVars = /* @__PURE__ */ new Set();
    const content2 = context.state.doc.toString();
    const initRegex = /\binit\s+([a-zA-Z_]\w*)/g;
    let match;
    while ((match = initRegex.exec(content2)) !== null) {
      generatedVars.add(match[1]);
    }
    variableProvider().forEach((v) => generatedVars.add(v));
    keywords.forEach((k) => generatedVars.delete(k));
    const options = [
      ...keywords.map((w) => ({ label: w, type: "keyword", boost: 1 })),
      ...builtins.map((w) => ({ label: w, type: "function", boost: 2 })),
      ...Array.from(generatedVars).map((w) => ({ label: w, type: "variable", boost: 3 }))
    ];
    const anyWord = completeAnyWord(context);
    if (anyWord && !(anyWord instanceof Promise) && anyWord.options) {
      anyWord.options.forEach((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        if (!keywords.includes(label) && !builtins.includes(label) && !generatedVars.has(label)) {
          options.push({ label, type: "text", boost: 0 });
        }
      });
    }
    return {
      from: word.from,
      options,
      validFor: /^\w*$/
    };
  };
}
function perc(builtins = [], variableProvider = () => []) {
  return new LanguageSupport(percLanguage, [
    percLanguage.data.of({
      autocomplete: percAutocomplete(builtins, variableProvider)
    })
  ]);
}
const debugEffect = StateEffect.define();
const errorEffect = StateEffect.define();
const varDefEffect = StateEffect.define();
const createHighlightField = (effect, className2) => {
  return StateField.define({
    create() {
      return Decoration.none;
    },
    update(highlights, tr) {
      highlights = highlights.map(tr.changes);
      for (let e of tr.effects) {
        if (e.is(effect)) {
          if (e.value === null) {
            highlights = Decoration.none;
          } else if (e.value) {
            highlights = Decoration.set([
              Decoration.mark({ class: className2 }).range(e.value.from, e.value.to)
            ]);
          }
        }
      }
      return highlights;
    },
    provide: (f) => EditorView.decorations.from(f)
  });
};
const debugHighlightField = createHighlightField(debugEffect, "eval-marker");
const errorHighlightField = createHighlightField(errorEffect, "error-marker");
const varDefHighlightField = createHighlightField(varDefEffect, "variable-def-highlight");
class Editor {
  view;
  container;
  variableProvider = () => [];
  builtins = ["print", "println"];
  readOnly = false;
  fontSize = 14;
  theme = "dark";
  wordWrap = true;
  fontSizeCompartment = new Compartment();
  constructor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;
    this.view = new EditorView({
      state: this.createState(
        `// PerC GUI Kitchen Sink
init x = 100;
init y = 100;
init msg = "Click me!";
init val = 50;

while(true) then {
    window(800, 600);
    
    fill(rgb(255, 255, 255));
    rect(0, 0, 800, 600);
    
    fill(rgb(0, 0, 0));
    text("Welcome to PerC GUI!", 320, 30, "center");
    
    if (button(msg, 10, 50)) then {
        change msg = "Clicked!";
        change x = x + 10;
    }
    
    fill(rgb(200, 100, 100));
    circle(x, 150, 50);
    
    stroke(rgb(100, 200, 100), 5);
    line(10, 250, 300, 250);
    
    text("Slider Value: " + val, 10, 280, "left");
    change val = slider(10, 300);
    
    fill(rgb(100, 100, 255));
    polygon(400, 100, new [new {"x": 0, "y": 0}, new {"x": 50, "y": 0}, new {"x": 25, "y": 50}]);
    
    // Grouped transformations - will be reset after end_group
    group();
    translate(500, 300);
    rotate(0.1);
    fill(rgb(255, 255, 0));
    rect(0, 0, 100, 50);
    end_group();
    
    // Draw a smiley face using sprite (8x8 pixels) - scaled up 10x
    init yellow = rgb(255, 255, 0);
    init black = rgb(0, 0, 0);
    init faceData = new [
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, black, yellow, yellow, yellow, yellow, black, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, black, black, yellow, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow
    ];
    group();
    translate(600, 50);
    scale(10, 10);
    sprite(0, 0, 8, 8, faceData);
    end_group();
    
    // Textbox widget
    fill(rgb(0, 0, 0));
    text("Enter text:", 10, 350, "left");
    init userText = textbox(10, 370);
    text("You typed: " + userText, 10, 410, "left");
    
    // Checkbox widget (green check on black border)
    fill(rgb(0, 255, 0));
    stroke(rgb(0, 0, 0));
    init isChecked = checkbox(10, 430);
    text("Checkbox: " + isChecked, 40, 440, "left");
    
    // Radio button group "Colors"
    fill(rgb(128, 0, 128));
    stroke(rgb(0, 0, 255));
    init isRed = radio("Colors", 10, 460);
    text("Red: " + isRed, 40, 470, "left");
    
    init isBlue = radio("Colors", 30, 460);
    text("Blue: " + isBlue, 40, 500, "left");
    
    // Transparency demonstration (drawing blue on top of red)
    fill(rgba(0, 0, 255, 0.5));
    rect(400, 400, 100, 100);
    
    fill(rgba(255, 0, 0, 0.5));
    rect(350, 350, 100, 100);
    
    end_window();
            }`
      ),
      parent: container
    });
  }
  createState(content2) {
    return EditorState.create({
      doc: content2,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        indentUnit.of("    "),
        autocompletion({ activateOnTyping: true }),
        perc(this.builtins, this.variableProvider),
        this.theme === "dark" ? githubDark : this.theme === "contrast" ? monokai : githubLight,
        EditorState.readOnly.of(this.readOnly),
        this.wordWrap ? EditorView.lineWrapping : [],
        debugHighlightField,
        errorHighlightField,
        varDefHighlightField,
        this.fontSizeCompartment.of(EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content, .cm-gutters": { minHeight: "100%" },
          ".cm-content": { fontSize: `${this.fontSize}px` },
          ".cm-gutters": { fontSize: `${this.fontSize}px` }
        }))
      ]
    });
  }
  updateExtensions() {
    this.view.setState(this.createState(this.view.state.doc.toString()));
  }
  setVariableProvider(provider) {
    this.variableProvider = provider;
    this.updateExtensions();
  }
  setBuiltins(builtins) {
    this.builtins = builtins;
    this.updateExtensions();
  }
  setValue(content2) {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content2 },
      selection: { anchor: 0 }
    });
  }
  getValue() {
    return this.view.state.doc.toString();
  }
  setFontSize(pct) {
    this.fontSize = Math.round(pct * 14 / 100);
    this.view.dispatch({
      effects: this.fontSizeCompartment.reconfigure(EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" },
        ".cm-content, .cm-gutters": { minHeight: "100%" },
        ".cm-content": { fontSize: `${this.fontSize}px` },
        ".cm-gutters": { fontSize: `${this.fontSize}px` }
      }))
    });
  }
  setTheme(theme) {
    this.theme = theme;
    this.updateExtensions();
  }
  setWordWrap(wrap) {
    this.wordWrap = wrap;
    this.updateExtensions();
  }
  setReadOnly(readOnly) {
    this.readOnly = readOnly;
    this.updateExtensions();
  }
  highlightAndScroll(loc, type = "info") {
    let from, to;
    try {
      if ("line" in loc && !("start" in loc)) {
        const line = this.view.state.doc.line(loc.line);
        from = line.from + loc.column - 1;
        to = Math.min(from + 1, line.to);
      } else {
        const sloc = loc;
        if (sloc.start && typeof sloc.start === "object" && "offset" in sloc.start) {
          from = sloc.start.offset;
          to = sloc.end.offset;
        } else if ("start" in loc && typeof loc.start === "number") {
          from = loc.start;
          to = loc.end;
        } else {
          from = 0;
          to = 0;
        }
      }
      if (from === void 0 || to === void 0) return;
      if (from > to) [from, to] = [to, from];
      const docLength = this.view.state.doc.length;
      from = Math.max(0, Math.min(from, docLength));
      to = Math.max(0, Math.min(to, docLength));
      if (from === to) {
        if (to < docLength) {
          to++;
        } else if (from > 0) {
          from--;
        }
      }
      if (from === to) return;
      const effect = type === "error" ? errorEffect : debugEffect;
      this.view.dispatch({
        effects: [
          effect.of({ from, to }),
          EditorView.scrollIntoView(from, { y: "center" })
        ]
      });
    } catch (e) {
      console.error("Failed to highlight:", e, loc);
    }
  }
  highlightRange(start, end) {
    this.highlightAndScroll({ start, end }, "debug");
  }
  highlightError(line, column) {
    this.highlightAndScroll({ line, column }, "error");
  }
  clearHighlight() {
    this.view.dispatch({ effects: debugEffect.of(null) });
  }
  clearErrorHighlight() {
    this.view.dispatch({ effects: errorEffect.of(null) });
  }
  enter_run_mode() {
    this.setReadOnly(true);
    this.clearErrorHighlight();
    this.container.classList.add("running-mode");
  }
  enter_debug_mode() {
    this.container.classList.add("debug-mode");
  }
  enter_idle_mode() {
    this.setReadOnly(false);
    this.clearHighlight();
    this.clearErrorHighlight();
    this.container.classList.remove("running-mode");
    this.container.classList.remove("debug-mode");
  }
  highlightVariableDefinition(start, end) {
    const from = Math.max(0, start);
    const to = Math.min(end, this.view.state.doc.length);
    this.view.dispatch({
      effects: [
        varDefEffect.of({ from, to }),
        EditorView.scrollIntoView(from, { y: "center" })
      ]
    });
  }
  clearVariableDefinitionHighlight() {
    this.view.dispatch({ effects: varDefEffect.of(null) });
  }
}
function createEditorStore() {
  const [editor, setEditor] = createSignal(null);
  return {
    setInstance: (instance) => setEditor(instance),
    getValue: () => editor()?.getValue() || "",
    setValue: (content2) => editor()?.setValue(content2),
    highlightRange: (start, end) => editor()?.highlightRange(start, end),
    highlightError: (line, column) => editor()?.highlightError(line, column),
    clearHighlight: () => editor()?.clearHighlight(),
    clearErrorHighlight: () => editor()?.clearErrorHighlight(),
    highlightVariableDefinition: (start, end) => editor()?.highlightVariableDefinition(start, end),
    clearVariableDefinitionHighlight: () => editor()?.clearVariableDefinitionHighlight(),
    enter_run_mode: () => editor()?.enter_run_mode(),
    enter_debug_mode: () => editor()?.enter_debug_mode(),
    enter_idle_mode: () => editor()?.enter_idle_mode(),
    setTheme: (theme) => editor()?.setTheme(theme),
    setFontSize: (size) => editor()?.setFontSize(size),
    setWordWrap: (wrap) => editor()?.setWordWrap(wrap),
    setVariableProvider: (provider) => editor()?.setVariableProvider(provider),
    setBuiltins: (builtins) => editor()?.setBuiltins(builtins),
    highlightAndScroll: (loc, type = "info") => editor()?.highlightAndScroll(loc, type)
  };
}
const editorStore = createRoot(createEditorStore);
var _tmpl$$4 = /* @__PURE__ */ template(`<section id=editor-pane aria-labelledby=editor-title><div><div><h2 id=editor-title>Source Code</h2></div><div></div></div><div><div id=editor class=pane-content role=textbox aria-multiline=true aria-label="Source Code Editor">`);
const EditorPane = (props) => {
  onMount(() => {
    const editor = new Editor("editor");
    editorStore.setInstance(editor);
  });
  onCleanup(() => {
    editorStore.setInstance(null);
  });
  return (() => {
    var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling, _el$6 = _el$2.nextSibling;
    insert(_el$5, createComponent(ZoomControl, {
      get onZoom() {
        return props.onZoom;
      },
      minZoomPct: 25,
      maxZoomPct: 500
    }));
    createRenderEffect((_p$) => {
      var _v$ = `${styles$4.editorPane} ${props.orientation === "vertical" ? styles$4.vertical : ""}`, _v$2 = props.style, _v$3 = styles$4.header, _v$4 = styles$4.titleArea, _v$5 = `${styles$4.title} ${props.orientation === "vertical" ? "vertical-header-text" : ""}`, _v$6 = styles$4.controls, _v$7 = styles$4.content;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _p$.t = style(_el$, _v$2, _p$.t);
      _v$3 !== _p$.a && className(_el$2, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      _v$5 !== _p$.i && className(_el$4, _p$.i = _v$5);
      _v$6 !== _p$.n && className(_el$5, _p$.n = _v$6);
      _v$7 !== _p$.s && className(_el$6, _p$.s = _v$7);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0
    });
    return _el$;
  })();
};
const debuggerPane = "_debuggerPane_pgid0_1";
const header$1 = "_header_pgid0_27";
const titleArea$1 = "_titleArea_pgid0_61";
const controls$1 = "_controls_pgid0_73";
const content$1 = "_content_pgid0_85";
const vertical$1 = "_vertical_pgid0_101";
const debugSection = "_debugSection_pgid0_163";
const debugTable = "_debugTable_pgid0_191";
const colResizer = "_colResizer_pgid0_253";
const colName = "_colName_pgid0_285";
const colValue = "_colValue_pgid0_295";
const debugVarName = "_debugVarName_pgid0_305";
const stackContent = "_stackContent_pgid0_325";
const flashUpdate = "_flashUpdate_pgid0_381";
const styles$3 = {
  debuggerPane,
  header: header$1,
  titleArea: titleArea$1,
  controls: controls$1,
  content: content$1,
  vertical: vertical$1,
  debugSection,
  debugTable,
  colResizer,
  colName,
  colValue,
  debugVarName,
  stackContent,
  flashUpdate
};
const root = "_root_1j6de_1";
const number = "_number_1j6de_19";
const string = "_string_1j6de_27";
const bool = "_bool_1j6de_35";
const nil = "_nil_1j6de_43";
const interactive = "_interactive_1j6de_53";
const hover = "_hover_1j6de_65";
const tooltip = "_tooltip_1j6de_75";
const typeName = "_typeName_1j6de_101";
const collapsedObject = "_collapsedObject_1j6de_117";
const expandedObject = "_expandedObject_1j6de_131";
const objectHeader = "_objectHeader_1j6de_143";
const objectBody = "_objectBody_1j6de_159";
const expandButton = "_expandButton_1j6de_175";
const key = "_key_1j6de_213";
const nestedEntry = "_nestedEntry_1j6de_227";
const preview = "_preview_1j6de_239";
const styles$2 = {
  root,
  number,
  string,
  bool,
  nil,
  interactive,
  hover,
  tooltip,
  typeName,
  collapsedObject,
  expandedObject,
  objectHeader,
  objectBody,
  expandButton,
  key,
  nestedEntry,
  preview
};
var _tmpl$$3 = /* @__PURE__ */ template(`<div><span>: `), _tmpl$2$2 = /* @__PURE__ */ template(`<span><button aria-expanded=false aria-label="Expand list">▶</button><span>[<!>@<!>]</span> <span>Length: `), _tmpl$3$1 = /* @__PURE__ */ template(`<div><div><button aria-expanded=true aria-label="Collapse list"style=transform:rotate(90deg)>▶</button><span>[<!>@<!>]</span></div><div>`), _tmpl$4$1 = /* @__PURE__ */ template(`<span><button aria-expanded=false aria-label="Expand map">▶</button><span>[<!>@<!>]</span> <span>Size: `), _tmpl$5$1 = /* @__PURE__ */ template(`<div><div><button aria-expanded=true aria-label="Collapse map"style=transform:rotate(90deg)>▶</button><span>[<!>@<!>]</span></div><div>`), _tmpl$6$1 = /* @__PURE__ */ template(`<span>[<!>]`), _tmpl$7$1 = /* @__PURE__ */ template(`<span class=val>`), _tmpl$8$1 = /* @__PURE__ */ template(`<span>[string]`), _tmpl$9$1 = /* @__PURE__ */ template(`<span>"<!>"`), _tmpl$0 = /* @__PURE__ */ template(`<span>`), _tmpl$1 = /* @__PURE__ */ template(`<div role=tooltip style=position:fixed;z-index:1000>`), _tmpl$10 = /* @__PURE__ */ template(`<div>`), _tmpl$11 = /* @__PURE__ */ template(`<br>`), _tmpl$12 = /* @__PURE__ */ template(`<td>`);
const PercValue = (props) => {
  const [showTooltip, setShowTooltip] = createSignal(false);
  const [tooltipPos, setTooltipPos] = createSignal({
    top: 0,
    left: 0
  });
  const [isExpanded, setIsExpanded] = createSignal(false);
  const handleShowTooltip = (e) => {
    const value = props.value;
    if (value instanceof perc_number && isInteger(value.type)) {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 5,
        left: rect.left
      });
      setShowTooltip(true);
    }
  };
  const handleHideTooltip = () => {
    setShowTooltip(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowTooltip(false);
    }
  };
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded());
  };
  const isInteger = (type) => {
    return ["i8", "u8", "i16", "u16", "i32", "u32"].includes(type);
  };
  const getHexBin = (value) => {
    const rawVal = value.buffer[0];
    const typeStr = value.type;
    let unsignedVal = rawVal;
    if (rawVal < 0) {
      if (typeStr === "i8") unsignedVal = rawVal >>> 0 & 255;
      else if (typeStr === "i16") unsignedVal = rawVal >>> 0 & 65535;
      else unsignedVal = rawVal >>> 0;
    }
    return {
      hex: "0x" + unsignedVal.toString(16).toUpperCase(),
      bin: "0b" + unsignedVal.toString(2)
    };
  };
  const renderMapEntry = (key2, value) => (() => {
    var _el$ = _tmpl$$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    insert(_el$2, key2, _el$3);
    insert(_el$, createComponent(PercValue, {
      value,
      isRow: true
    }), null);
    createRenderEffect((_p$) => {
      var _v$ = styles$2.nestedEntry, _v$2 = styles$2.key;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
  const renderList = (val) => {
    const elements = val.elements;
    if (!isExpanded()) {
      return (() => {
        var _el$4 = _tmpl$2$2(), _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling, _el$7 = _el$6.firstChild, _el$0 = _el$7.nextSibling, _el$8 = _el$0.nextSibling, _el$1 = _el$8.nextSibling;
        _el$1.nextSibling;
        var _el$10 = _el$6.nextSibling, _el$11 = _el$10.nextSibling;
        _el$11.firstChild;
        _el$5.$$click = toggleExpand;
        insert(_el$6, () => val.type, _el$0);
        insert(_el$6, () => val.pseudoAddress, _el$1);
        insert(_el$11, () => elements.length, null);
        createRenderEffect((_p$) => {
          var _v$3 = styles$2.collapsedObject, _v$4 = styles$2.expandButton, _v$5 = styles$2.typeName, _v$6 = styles$2.preview;
          _v$3 !== _p$.e && className(_el$4, _p$.e = _v$3);
          _v$4 !== _p$.t && className(_el$5, _p$.t = _v$4);
          _v$5 !== _p$.a && className(_el$6, _p$.a = _v$5);
          _v$6 !== _p$.o && className(_el$11, _p$.o = _v$6);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0
        });
        return _el$4;
      })();
    }
    return (() => {
      var _el$13 = _tmpl$3$1(), _el$14 = _el$13.firstChild, _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling, _el$17 = _el$16.firstChild, _el$20 = _el$17.nextSibling, _el$18 = _el$20.nextSibling, _el$21 = _el$18.nextSibling;
      _el$21.nextSibling;
      var _el$22 = _el$14.nextSibling;
      _el$15.$$click = toggleExpand;
      insert(_el$16, () => val.type, _el$20);
      insert(_el$16, () => val.pseudoAddress, _el$21);
      insert(_el$22, createComponent(For, {
        each: elements,
        children: (item, index) => renderMapEntry(index() + 1, item)
      }));
      createRenderEffect((_p$) => {
        var _v$7 = styles$2.expandedObject, _v$8 = styles$2.objectHeader, _v$9 = styles$2.expandButton, _v$0 = styles$2.typeName, _v$1 = styles$2.objectBody;
        _v$7 !== _p$.e && className(_el$13, _p$.e = _v$7);
        _v$8 !== _p$.t && className(_el$14, _p$.t = _v$8);
        _v$9 !== _p$.a && className(_el$15, _p$.a = _v$9);
        _v$0 !== _p$.o && className(_el$16, _p$.o = _v$0);
        _v$1 !== _p$.i && className(_el$22, _p$.i = _v$1);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      });
      return _el$13;
    })();
  };
  const renderMap = (val) => {
    const entries = Array.from(val.data.entries());
    if (!isExpanded()) {
      return (() => {
        var _el$23 = _tmpl$4$1(), _el$24 = _el$23.firstChild, _el$25 = _el$24.nextSibling, _el$26 = _el$25.firstChild, _el$29 = _el$26.nextSibling, _el$27 = _el$29.nextSibling, _el$30 = _el$27.nextSibling;
        _el$30.nextSibling;
        var _el$31 = _el$25.nextSibling, _el$32 = _el$31.nextSibling;
        _el$32.firstChild;
        _el$24.$$click = toggleExpand;
        insert(_el$25, () => val.type, _el$29);
        insert(_el$25, () => val.pseudoAddress, _el$30);
        insert(_el$32, () => entries.length, null);
        createRenderEffect((_p$) => {
          var _v$10 = styles$2.collapsedObject, _v$11 = styles$2.expandButton, _v$12 = styles$2.typeName, _v$13 = styles$2.preview;
          _v$10 !== _p$.e && className(_el$23, _p$.e = _v$10);
          _v$11 !== _p$.t && className(_el$24, _p$.t = _v$11);
          _v$12 !== _p$.a && className(_el$25, _p$.a = _v$12);
          _v$13 !== _p$.o && className(_el$32, _p$.o = _v$13);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0
        });
        return _el$23;
      })();
    }
    return (() => {
      var _el$34 = _tmpl$5$1(), _el$35 = _el$34.firstChild, _el$36 = _el$35.firstChild, _el$37 = _el$36.nextSibling, _el$38 = _el$37.firstChild, _el$41 = _el$38.nextSibling, _el$39 = _el$41.nextSibling, _el$42 = _el$39.nextSibling;
      _el$42.nextSibling;
      var _el$43 = _el$35.nextSibling;
      _el$36.$$click = toggleExpand;
      insert(_el$37, () => val.type, _el$41);
      insert(_el$37, () => val.pseudoAddress, _el$42);
      insert(_el$43, createComponent(For, {
        each: entries,
        children: ([key2, value]) => renderMapEntry(key2, value)
      }));
      createRenderEffect((_p$) => {
        var _v$14 = styles$2.expandedObject, _v$15 = styles$2.objectHeader, _v$16 = styles$2.expandButton, _v$17 = styles$2.typeName, _v$18 = styles$2.objectBody;
        _v$14 !== _p$.e && className(_el$34, _p$.e = _v$14);
        _v$15 !== _p$.t && className(_el$35, _p$.t = _v$15);
        _v$16 !== _p$.a && className(_el$36, _p$.a = _v$16);
        _v$17 !== _p$.o && className(_el$37, _p$.o = _v$17);
        _v$18 !== _p$.i && className(_el$43, _p$.i = _v$18);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      });
      return _el$34;
    })();
  };
  const renderContent = () => {
    const value = props.value;
    if (value instanceof perc_number) {
      return [(() => {
        var _el$44 = _tmpl$6$1(), _el$45 = _el$44.firstChild, _el$47 = _el$45.nextSibling;
        _el$47.nextSibling;
        insert(_el$44, () => value.type, _el$47);
        createRenderEffect(() => className(_el$44, styles$2.typeName));
        return _el$44;
      })(), (() => {
        var _el$48 = _tmpl$7$1();
        insert(_el$48, () => value.to_string());
        return _el$48;
      })()];
    }
    if (value instanceof perc_list) {
      return renderList(value);
    }
    if (value instanceof perc_map) {
      return renderMap(value);
    }
    if (value.type === "string") {
      return [(() => {
        var _el$49 = _tmpl$8$1();
        createRenderEffect(() => className(_el$49, styles$2.typeName));
        return _el$49;
      })(), (() => {
        var _el$50 = _tmpl$9$1(), _el$51 = _el$50.firstChild, _el$53 = _el$51.nextSibling;
        _el$53.nextSibling;
        insert(_el$50, () => value.to_string(), _el$53);
        return _el$50;
      })()];
    }
    return [(() => {
      var _el$54 = _tmpl$6$1(), _el$55 = _el$54.firstChild, _el$57 = _el$55.nextSibling;
      _el$57.nextSibling;
      insert(_el$54, () => value.type, _el$57);
      createRenderEffect(() => className(_el$54, styles$2.typeName));
      return _el$54;
    })(), (() => {
      var _el$58 = _tmpl$0();
      insert(_el$58, () => value.to_string());
      return _el$58;
    })()];
  };
  const classNames = () => {
    const parts = [];
    parts.push(styles$2.content);
    if (!props.isRow) parts.push(styles$2.root);
    const value = props.value;
    if (value instanceof perc_number) {
      parts.push(styles$2.number);
    } else if (value.type === "string") {
      parts.push(styles$2.string);
    } else if (value.type === "bool") {
      parts.push(styles$2.bool);
    } else if (value.type === "nil") {
      parts.push(styles$2.nil);
    }
    if (value instanceof perc_number && isInteger(value.type)) {
      parts.push(styles$2.interactive);
    }
    if (showTooltip()) {
      parts.push(styles$2.hover);
    }
    return parts.join(" ");
  };
  const content2 = (() => {
    var _el$59 = _tmpl$10();
    _el$59.$$touchstart = (e) => {
      e.preventDefault();
      handleShowTooltip(e);
    };
    _el$59.$$keydown = handleKeyDown;
    _el$59.addEventListener("blur", handleHideTooltip);
    _el$59.addEventListener("focus", handleShowTooltip);
    _el$59.addEventListener("mouseleave", handleHideTooltip);
    _el$59.addEventListener("mouseenter", handleShowTooltip);
    insert(_el$59, renderContent, null);
    insert(_el$59, createComponent(Show, {
      get when() {
        return showTooltip();
      },
      get children() {
        var _el$60 = _tmpl$1();
        insert(_el$60, () => {
          const {
            hex,
            bin
          } = getHexBin(props.value);
          return ["Hex: ", hex, _tmpl$11(), "Bin: ", bin];
        });
        createRenderEffect((_p$) => {
          var _v$19 = styles$2.tooltip, _v$20 = `${tooltipPos().top}px`, _v$21 = `${tooltipPos().left}px`;
          _v$19 !== _p$.e && className(_el$60, _p$.e = _v$19);
          _v$20 !== _p$.t && setStyleProperty(_el$60, "top", _p$.t = _v$20);
          _v$21 !== _p$.a && setStyleProperty(_el$60, "left", _p$.a = _v$21);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$60;
      }
    }), null);
    createRenderEffect((_p$) => {
      var _v$22 = classNames(), _v$23 = props.value instanceof perc_number && isInteger(props.value.type) ? 0 : void 0;
      _v$22 !== _p$.e && className(_el$59, _p$.e = _v$22);
      _v$23 !== _p$.t && setAttribute(_el$59, "tabindex", _p$.t = _v$23);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$59;
  })();
  if (props.isRow) {
    return content2;
  }
  return (() => {
    var _el$62 = _tmpl$12();
    insert(_el$62, content2);
    createRenderEffect(() => className(_el$62, classNames()));
    return _el$62;
  })();
};
delegateEvents(["click", "keydown", "touchstart"]);
var _tmpl$$2 = /* @__PURE__ */ template(`<table><colgroup></colgroup><thead class=sr-only><tr></tr></thead><tbody>`), _tmpl$2$1 = /* @__PURE__ */ template(`<col>`), _tmpl$3 = /* @__PURE__ */ template(`<th scope=col>`), _tmpl$4 = /* @__PURE__ */ template(`<tr>`), _tmpl$5 = /* @__PURE__ */ template(`<div role=separator aria-label="Column resizer"tabindex=0>`), _tmpl$6 = /* @__PURE__ */ template(`<td>`), _tmpl$7 = /* @__PURE__ */ template(`<section id=debugger-pane aria-labelledby=debugger-title><div><div><h2 id=debugger-title>Debugger</h2></div><div></div></div><div><div id=debugger-content class=pane-content role=region aria-live=polite aria-label="Debugger State"><div id=vm-state><h4>Status</h4><div class=state-content></div></div><div id=current-expression><h4>Current Expression</h4><div class=expr-content></div></div><div id=call-stack><h4>Call Stack</h4><div>`), _tmpl$8 = /* @__PURE__ */ template(`<details><summary>`), _tmpl$9 = /* @__PURE__ */ template(`<span>`);
const DebuggerPane = (props) => {
  const [colWidths, setColWidths] = createSignal([50, 50]);
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartWidths = [];
  let resizeIndex = -1;
  const startResize = (e, index) => {
    e.preventDefault();
    isResizing = true;
    resizeStartX = e.pageX;
    resizeIndex = index;
    resizeStartWidths = [...colWidths()];
    document.body.style.cursor = "col-resize";
    document.body.classList.add("no-select");
  };
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const deltaX = e.pageX - resizeStartX;
    const containerWidth = document.getElementById("debugger-content")?.clientWidth || 1;
    const deltaPercent = deltaX / containerWidth * 100;
    const newWidths = [...resizeStartWidths];
    const leftIdx = resizeIndex;
    const rightIdx = resizeIndex + 1;
    if (leftIdx >= 0 && rightIdx < newWidths.length) {
      const nextLeft = Math.max(10, resizeStartWidths[leftIdx] + deltaPercent);
      const totalWidth = resizeStartWidths[leftIdx] + resizeStartWidths[rightIdx];
      const nextRight = Math.max(10, totalWidth - nextLeft);
      if (nextRight > 10) {
        newWidths[leftIdx] = nextLeft;
        newWidths[rightIdx] = nextRight;
        setColWidths(newWidths);
      }
    }
  };
  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.classList.remove("no-select");
    }
  };
  onMount(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  });
  onCleanup(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  });
  const DebugTable = (tableProps) => {
    return (() => {
      var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling;
      insert(_el$2, createComponent(For, {
        get each() {
          return colWidths();
        },
        children: (w) => (() => {
          var _el$6 = _tmpl$2$1();
          setStyleProperty(_el$6, "width", `${w}%`);
          return _el$6;
        })()
      }));
      insert(_el$4, createComponent(For, {
        get each() {
          return tableProps.headers;
        },
        children: (h) => (() => {
          var _el$7 = _tmpl$3();
          insert(_el$7, h);
          return _el$7;
        })()
      }));
      insert(_el$5, () => tableProps.children);
      createRenderEffect((_p$) => {
        var _v$ = styles$3.debugTable, _v$2 = tableProps.headers.length;
        _v$ !== _p$.e && className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && setAttribute(_el$, "data-cols", _p$.t = _v$2);
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$;
    })();
  };
  const DebugRow = (rowProps) => {
    return (() => {
      var _el$8 = _tmpl$4();
      insert(_el$8, createComponent(For, {
        get each() {
          return rowProps.cells;
        },
        children: (cell, i) => (() => {
          var _el$9 = _tmpl$6();
          insert(_el$9, cell, null);
          insert(_el$9, createComponent(Show, {
            get when() {
              return i() < rowProps.cells.length - 1;
            },
            get children() {
              var _el$0 = _tmpl$5();
              _el$0.$$mousedown = (e) => startResize(e, i());
              createRenderEffect(() => className(_el$0, styles$3.colResizer));
              return _el$0;
            }
          }), null);
          createRenderEffect(() => className(_el$9, i() === 0 ? styles$3.colName : styles$3.colValue));
          return _el$9;
        })()
      }));
      createRenderEffect(() => className(_el$8, props.vm.debugStore.lastUpdatedVar === rowProps.varName ? styles$3.flashUpdate : ""));
      return _el$8;
    })();
  };
  return (() => {
    var _el$1 = _tmpl$7(), _el$10 = _el$1.firstChild, _el$11 = _el$10.firstChild, _el$12 = _el$11.firstChild, _el$13 = _el$11.nextSibling, _el$14 = _el$10.nextSibling, _el$15 = _el$14.firstChild, _el$16 = _el$15.firstChild, _el$17 = _el$16.firstChild, _el$18 = _el$17.nextSibling, _el$19 = _el$16.nextSibling, _el$20 = _el$19.firstChild, _el$21 = _el$20.nextSibling, _el$22 = _el$19.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$23.nextSibling;
    insert(_el$13, createComponent(ZoomControl, {
      get onZoom() {
        return props.onZoom;
      },
      minZoomPct: 25,
      maxZoomPct: 500
    }));
    insert(_el$18, () => props.vm.debugStore.status);
    insert(_el$21, createComponent(DebugTable, {
      headers: ["Value"],
      get children() {
        return createComponent(Show, {
          get when() {
            return props.vm.debugStore.currentExpression.value;
          },
          get fallback() {
            return createComponent(DebugRow, {
              cells: ["nil"]
            });
          },
          get children() {
            return createComponent(DebugRow, {
              get cells() {
                return [createComponent(PercValue, {
                  get value() {
                    return props.vm.debugStore.currentExpression.value;
                  },
                  isRow: true
                })];
              }
            });
          }
        });
      }
    }));
    insert(_el$24, createComponent(Show, {
      get when() {
        return props.vm.debugStore.callStack.length > 0;
      },
      fallback: "Empty",
      get children() {
        return createComponent(For, {
          get each() {
            return props.vm.debugStore.callStack;
          },
          children: (frame) => (() => {
            var _el$25 = _tmpl$8(), _el$26 = _el$25.firstChild;
            insert(_el$26, () => frame.name);
            insert(_el$25, createComponent(DebugTable, {
              headers: ["Name", "Value"],
              get children() {
                return createComponent(For, {
                  get each() {
                    return Object.entries(frame.variables);
                  },
                  children: ([name, data]) => createComponent(DebugRow, {
                    varName: name,
                    get cells() {
                      return [(() => {
                        var _el$27 = _tmpl$9();
                        _el$27.addEventListener("mouseleave", () => editorStore.clearVariableDefinitionHighlight());
                        _el$27.addEventListener("mouseenter", () => data.range && editorStore.highlightVariableDefinition(data.range[0], data.range[1]));
                        insert(_el$27, name);
                        createRenderEffect(() => className(_el$27, styles$3.debugVarName));
                        return _el$27;
                      })(), createComponent(PercValue, {
                        get value() {
                          return data.value;
                        },
                        isRow: true
                      })];
                    }
                  })
                });
              }
            }), null);
            createRenderEffect(() => _el$25.open = frame.open);
            return _el$25;
          })()
        });
      }
    }));
    createRenderEffect((_p$) => {
      var _v$3 = `${styles$3.debuggerPane} ${props.orientation === "vertical" ? styles$3.vertical : ""}`, _v$4 = props.style, _v$5 = styles$3.header, _v$6 = styles$3.titleArea, _v$7 = `${styles$3.title} ${props.orientation === "vertical" ? "vertical-header-text" : ""}`, _v$8 = styles$3.controls, _v$9 = styles$3.content, _v$0 = styles$3.debugSection, _v$1 = styles$3.debugSection, _v$10 = styles$3.debugSection, _v$11 = styles$3.stackContent;
      _v$3 !== _p$.e && className(_el$1, _p$.e = _v$3);
      _p$.t = style(_el$1, _v$4, _p$.t);
      _v$5 !== _p$.a && className(_el$10, _p$.a = _v$5);
      _v$6 !== _p$.o && className(_el$11, _p$.o = _v$6);
      _v$7 !== _p$.i && className(_el$12, _p$.i = _v$7);
      _v$8 !== _p$.n && className(_el$13, _p$.n = _v$8);
      _v$9 !== _p$.s && className(_el$14, _p$.s = _v$9);
      _v$0 !== _p$.h && className(_el$16, _p$.h = _v$0);
      _v$1 !== _p$.r && className(_el$19, _p$.r = _v$1);
      _v$10 !== _p$.d && className(_el$22, _p$.d = _v$10);
      _v$11 !== _p$.l && className(_el$24, _p$.l = _v$11);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0
    });
    return _el$1;
  })();
};
delegateEvents(["mousedown"]);
const consolePane = "_consolePane_ij0j6_1";
const header = "_header_ij0j6_27";
const titleArea = "_titleArea_ij0j6_61";
const controls = "_controls_ij0j6_73";
const content = "_content_ij0j6_85";
const logArea = "_logArea_ij0j6_103";
const vertical = "_vertical_ij0j6_145";
const consoleInputContainer = "_consoleInputContainer_ij0j6_197";
const prompt = "_prompt_ij0j6_223";
const replInput = "_replInput_ij0j6_235";
const styles$1 = {
  consolePane,
  header,
  titleArea,
  controls,
  content,
  logArea,
  vertical,
  consoleInputContainer,
  prompt,
  replInput
};
var _tmpl$$1 = /* @__PURE__ */ template(`<section id=console-pane aria-labelledby=console-title><div><div><h2 id=console-title>Console / REPL</h2></div><div><button class=icon-btn title="Clear Console"aria-label="Clear Console Output">⊘</button></div></div><div><div id=console-output role=log aria-live=polite aria-label="Console Output"></div><div><label for=repl-input aria-hidden=true>></label><input type=text id=repl-input aria-label="REPL Input"placeholder="Enter code here...">`), _tmpl$2 = /* @__PURE__ */ template(`<div>`);
const ConsolePane = (props) => {
  let outputRef;
  let inputRef;
  createEffect(() => {
    if (props.state.entries.length > 0 && outputRef) {
      outputRef.scrollTop = outputRef.scrollHeight;
    }
  });
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const val = inputRef?.value || "";
      props.onInput(val);
      if (inputRef) inputRef.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const cmd = props.onNavigateHistory("up", inputRef?.value || "");
      if (cmd !== null && inputRef) inputRef.value = cmd;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const cmd = props.onNavigateHistory("down", inputRef?.value || "");
      if (cmd !== null && inputRef) inputRef.value = cmd;
    }
  };
  return (() => {
    var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling, _el$6 = _el$5.firstChild, _el$7 = _el$2.nextSibling, _el$8 = _el$7.firstChild, _el$9 = _el$8.nextSibling, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling;
    insert(_el$5, createComponent(ZoomControl, {
      get onZoom() {
        return props.onZoom;
      },
      minZoomPct: 25,
      maxZoomPct: 500
    }), _el$6);
    addEventListener(_el$6, "click", props.onClear);
    var _ref$ = outputRef;
    typeof _ref$ === "function" ? use(_ref$, _el$8) : outputRef = _el$8;
    insert(_el$8, createComponent(For, {
      get each() {
        return props.state.entries;
      },
      children: (entry) => (() => {
        var _el$10 = _tmpl$2();
        _el$10.$$click = () => entry.location && editorStore.highlightAndScroll({
          start: entry.location[0],
          end: entry.location[1]
        }, "error");
        insert(_el$10, () => entry.msg);
        createRenderEffect((_p$) => {
          var _v$10 = `console-entry ${entry.type} ${entry.location ? "console-error-link" : ""}`, _v$11 = entry.location ? "Click to show error location" : "", _v$12 = entry.location ? "pointer" : "default", _v$13 = entry.color;
          _v$10 !== _p$.e && className(_el$10, _p$.e = _v$10);
          _v$11 !== _p$.t && setAttribute(_el$10, "title", _p$.t = _v$11);
          _v$12 !== _p$.a && setStyleProperty(_el$10, "cursor", _p$.a = _v$12);
          _v$13 !== _p$.o && setStyleProperty(_el$10, "color", _p$.o = _v$13);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0
        });
        return _el$10;
      })()
    }));
    _el$1.$$keydown = handleKeyDown;
    var _ref$2 = inputRef;
    typeof _ref$2 === "function" ? use(_ref$2, _el$1) : inputRef = _el$1;
    createRenderEffect((_p$) => {
      var _v$ = `${styles$1.consolePane} ${props.orientation === "vertical" ? styles$1.vertical : ""}`, _v$2 = props.style, _v$3 = styles$1.header, _v$4 = styles$1.titleArea, _v$5 = `${styles$1.title} ${props.orientation === "vertical" ? "vertical-header-text" : ""}`, _v$6 = styles$1.controls, _v$7 = styles$1.content, _v$8 = `${styles$1.logArea} pane-content`, _v$9 = styles$1.consoleInputContainer, _v$0 = styles$1.prompt, _v$1 = styles$1.replInput;
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _p$.t = style(_el$, _v$2, _p$.t);
      _v$3 !== _p$.a && className(_el$2, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      _v$5 !== _p$.i && className(_el$4, _p$.i = _v$5);
      _v$6 !== _p$.n && className(_el$5, _p$.n = _v$6);
      _v$7 !== _p$.s && className(_el$7, _p$.s = _v$7);
      _v$8 !== _p$.h && className(_el$8, _p$.h = _v$8);
      _v$9 !== _p$.r && className(_el$9, _p$.r = _v$9);
      _v$0 !== _p$.d && className(_el$0, _p$.d = _v$0);
      _v$1 !== _p$.l && className(_el$1, _p$.l = _v$1);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0
    });
    return _el$;
  })();
};
delegateEvents(["click", "keydown"]);
const app = "_app_pgqts_1";
const mainLayout = "_mainLayout_pgqts_21";
const verticalContainer = "_verticalContainer_pgqts_39";
const isDragging = "_isDragging_pgqts_57";
const splitter = "_splitter_pgqts_65";
const vSplit = "_vSplit_pgqts_87";
const hSplit = "_hSplit_pgqts_99";
const noSelect = "_noSelect_pgqts_111";
const skipLink = "_skipLink_pgqts_141";
const styles = {
  app,
  mainLayout,
  verticalContainer,
  isDragging,
  splitter,
  vSplit,
  hSplit,
  noSelect,
  skipLink
};
var _tmpl$ = /* @__PURE__ */ template(`<div id=app-root><a href=#editor>Skip to Editor</a><main id=main-layout><div role=separator aria-orientation=vertical aria-label="Editor and side panel resizer"tabindex=0></div><div id=vertical-container><div role=separator aria-orientation=horizontal aria-label="Debugger and console resizer"tabindex=0>`);
const App = (props) => {
  let mainLayoutRef;
  let verticalContainerRef;
  const [isDragging2, setIsDragging] = createSignal(false);
  let isDraggingV = false;
  let isDraggingH = false;
  const startDraggingV = (e) => {
    isDraggingV = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.classList.add(styles.noSelect);
    e.preventDefault();
  };
  const startDraggingH = (e) => {
    isDraggingH = true;
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
    document.body.classList.add(styles.noSelect);
    e.preventDefault();
  };
  const handleMouseMove = (e) => {
    if (isDraggingV && mainLayoutRef) {
      const rect = mainLayoutRef.getBoundingClientRect();
      const minRatio = 32 / rect.width;
      const ratio = (e.clientX - rect.left) / rect.width;
      appStore.updateSize("editor_dc", Math.max(minRatio, Math.min(1 - minRatio, ratio)));
    }
    if (isDraggingH && verticalContainerRef) {
      const rect = verticalContainerRef.getBoundingClientRect();
      const minRatio = 32 / rect.height;
      const ratio = (e.clientY - rect.top) / rect.height;
      appStore.updateSize("dc", Math.max(minRatio, Math.min(1 - minRatio, ratio)));
    }
  };
  const handleMouseUp = () => {
    if (isDraggingV || isDraggingH) {
      isDraggingV = false;
      isDraggingH = false;
      setIsDragging(false);
      document.body.style.cursor = "default";
      document.body.classList.remove(styles.noSelect);
    }
  };
  createEffect(() => {
    appStore.layout.editorSplit;
    appStore.layout.dcSplit;
  });
  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  });
  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });
  const editorOrientation = createMemo(() => appStore.layout.editorSplit < 0.1 ? "vertical" : "horizontal");
  const dcOrientation = createMemo(() => 1 - appStore.layout.editorSplit < 0.1 ? "vertical" : "horizontal");
  const debugOrientation = dcOrientation;
  const consoleOrientation = dcOrientation;
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$5.firstChild;
    insert(_el$, createComponent(MenuBar, {
      get menuState() {
        return appStore.vm.state;
      },
      get onRun() {
        return props.onRun;
      },
      get onStop() {
        return props.onStop;
      },
      get onStep() {
        return props.onStep;
      },
      get onContinue() {
        return props.onContinue;
      },
      get onBuild() {
        return props.onBuild;
      },
      get onTheme() {
        return props.onTheme;
      },
      get onWrap() {
        return props.onWrap;
      }
    }), _el$3);
    var _ref$ = mainLayoutRef;
    typeof _ref$ === "function" ? use(_ref$, _el$3) : mainLayoutRef = _el$3;
    insert(_el$3, createComponent(EditorPane, {
      get onZoom() {
        return props.onEditorZoom;
      },
      get orientation() {
        return editorOrientation();
      },
      get style() {
        return {
          flex: `${appStore.layout.editorSplit} 1 0px`
        };
      }
    }), _el$4);
    _el$4.$$mousedown = startDraggingV;
    var _ref$2 = verticalContainerRef;
    typeof _ref$2 === "function" ? use(_ref$2, _el$5) : verticalContainerRef = _el$5;
    insert(_el$5, createComponent(DebuggerPane, {
      get vm() {
        return props.vm;
      },
      get onZoom() {
        return props.onDebuggerZoom;
      },
      get orientation() {
        return debugOrientation();
      },
      get style() {
        return {
          flex: `${appStore.layout.dcSplit} 1 0px`
        };
      }
    }), _el$6);
    _el$6.$$mousedown = startDraggingH;
    insert(_el$5, createComponent(ConsolePane, {
      get state() {
        return props.console.state;
      },
      get onZoom() {
        return props.onConsoleZoom;
      },
      get onClear() {
        return props.console.actions.clear;
      },
      get onInput() {
        return props.onConsoleInput;
      },
      get onNavigateHistory() {
        return props.console.actions.navigateHistory;
      },
      get orientation() {
        return consoleOrientation();
      },
      get style() {
        return {
          flex: `${1 - appStore.layout.dcSplit} 1 0px`
        };
      }
    }), null);
    createRenderEffect((_p$) => {
      var _v$ = `${styles.app} ${isDragging2() ? styles.isDragging : ""}`, _v$2 = isDragging2() ? "0s" : "0.4s", _v$3 = styles.skipLink, _v$4 = styles.mainLayout, _v$5 = `${styles.splitter} ${styles.vSplit}`, _v$6 = Math.round(appStore.layout.editorSplit * 100), _v$7 = styles.verticalContainer, _v$8 = `${1 - appStore.layout.editorSplit} 1 0px`, _v$9 = isDragging2() ? "0s" : "0.4s", _v$0 = `${styles.splitter} ${styles.hSplit}`, _v$1 = Math.round(appStore.layout.dcSplit * 100);
      _v$ !== _p$.e && className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "--pane-transition-dur", _p$.t = _v$2);
      _v$3 !== _p$.a && className(_el$2, _p$.a = _v$3);
      _v$4 !== _p$.o && className(_el$3, _p$.o = _v$4);
      _v$5 !== _p$.i && className(_el$4, _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$4, "aria-valuenow", _p$.n = _v$6);
      _v$7 !== _p$.s && className(_el$5, _p$.s = _v$7);
      _v$8 !== _p$.h && setStyleProperty(_el$5, "flex", _p$.h = _v$8);
      _v$9 !== _p$.r && setStyleProperty(_el$5, "--pane-transition-dur", _p$.r = _v$9);
      _v$0 !== _p$.d && className(_el$6, _p$.d = _v$0);
      _v$1 !== _p$.l && setAttribute(_el$6, "aria-valuenow", _p$.l = _v$1);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0
    });
    return _el$;
  })();
};
delegateEvents(["mousedown"]);
function createConsoleStore() {
  const [state, setState] = createStore({
    entries: [],
    history: [],
    historyIndex: -1,
    tempInput: "",
    textColor: "var(--fg-color)"
  });
  const actions = {
    addEntry: (msg, type, location) => {
      setState("entries", (e) => [...e, {
        msg,
        type,
        location,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        color: type === "log" ? state.textColor : void 0
      }]);
    },
    setTextColor: (color) => {
      setState("textColor", color);
    },
    clear: () => {
      setState("entries", []);
    },
    pushHistory: (cmd) => {
      if (!cmd.trim()) return;
      setState((s) => {
        const newHistory = [...s.history];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1] === cmd) {
          return { historyIndex: newHistory.length, tempInput: "" };
        }
        newHistory.push(cmd);
        if (newHistory.length > 20) newHistory.shift();
        return { history: newHistory, historyIndex: newHistory.length, tempInput: "" };
      });
    },
    navigateHistory: (direction, currentInput) => {
      let result = null;
      setState((s) => {
        let idx = s.historyIndex;
        let temp = s.tempInput;
        if (idx === s.history.length) {
          temp = currentInput;
        }
        if (direction === "up") {
          if (idx > 0) {
            idx--;
            result = s.history[idx];
          }
        } else {
          if (idx < s.history.length) {
            idx++;
            if (idx === s.history.length) {
              result = temp;
            } else {
              result = s.history[idx];
            }
          }
        }
        return { historyIndex: idx, tempInput: temp };
      });
      return result;
    },
    reset: () => {
      setState({
        entries: [],
        history: [],
        historyIndex: -1,
        tempInput: "",
        textColor: "var(--fg-color)"
      });
    }
  };
  return { state, actions };
}
const consoleStore = createConsoleStore();
console.log("PerC IDE initializing...");
const initApp = () => {
  document.body.classList.add("dark-theme");
  const vm = new VM();
  const gui = new GUIManager();
  let isPaused = false;
  let isWaitingForInput = false;
  let executionInterval = null;
  let currentRunner = null;
  const BATCH_SIZE = 100;
  const updateToolbarState = (state) => {
    let menuState = state;
    if (state === "paused") menuState = "debugging";
    appStore.setVM(menuState);
  };
  const stopVM = () => {
    isPaused = false;
    isWaitingForInput = false;
    if (executionInterval) clearInterval(executionInterval);
    executionInterval = null;
    currentRunner = null;
    editorStore.enter_idle_mode();
    updateToolbarState("idle");
    vm.reset_state();
  };
  const runVM = async () => {
    if (!currentRunner) return;
    isPaused = false;
    updateToolbarState("running");
    editorStore.enter_run_mode();
    return new Promise((resolve) => {
      executionInterval = setInterval(() => {
        for (let i = 0; i < BATCH_SIZE; i++) {
          const result = currentRunner.next();
          if (vm.in_debug_mode && isPaused) {
            updateToolbarState("paused");
            clearInterval(executionInterval);
            executionInterval = null;
            resolve();
            return;
          }
          if (result.done) {
            consoleStore.actions.addEntry("Execution stopped.", "status");
            stopVM();
            resolve();
            return;
          }
          if (vm.is_waiting_for_input) {
            isWaitingForInput = true;
            clearInterval(executionInterval);
            executionInterval = null;
            updateToolbarState("input");
            resolve();
            return;
          }
        }
      }, 0);
    });
  };
  const handleStep = () => {
    if (!currentRunner) return;
    const result = currentRunner.next();
    if (result.done) {
      stopVM();
    } else {
      updateToolbarState("paused");
    }
  };
  const handleContinue = () => {
    if (isPaused && currentRunner) {
      runVM();
    }
  };
  const handleRun = () => {
    if (isPaused) {
      runVM();
      return;
    }
    stopVM();
    consoleStore.actions.addEntry("Run: Starting execution...", "status");
    const code = editorStore.getValue();
    try {
      const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
      const tree = parser.parse(code);
      const result = compiler.compile(code, tree);
      if (result.errors.length > 0) {
        const firstErr = result.errors[0];
        throw firstErr;
      }
      vm.load_code(result.opcodes);
      currentRunner = vm.run();
      runVM();
    } catch (e) {
      console.error(e);
      if (e instanceof PercCompileError && e.location) {
        consoleStore.actions.addEntry(`Build Error: ${e.message} (at ${e.location.start.line}:${e.location.start.column})`, "error", [e.location.start.offset, e.location.end.offset]);
        editorStore.highlightAndScroll(e.location, "error");
      } else {
        consoleStore.actions.addEntry(`Build Error: ${e.message}`, "error");
      }
      stopVM();
    }
  };
  const handleStop = () => {
    consoleStore.actions.addEntry("Stop: Execution halted.", "status");
    stopVM();
  };
  const handleBuild = () => {
    consoleStore.actions.addEntry("Build: Compiling...", "status");
    editorStore.clearErrorHighlight();
    const code = editorStore.getValue();
    try {
      const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
      const tree = parser.parse(code);
      const result = compiler.compile(code, tree);
      if (result.errors.length > 0) {
        const firstErr = result.errors[0];
        throw firstErr;
      }
      consoleStore.actions.addEntry("Build: No errors found.", "status");
    } catch (e) {
      if (e instanceof PercCompileError && e.location) {
        const msg = e.message;
        consoleStore.actions.addEntry(`Build Error: ${msg} (at ${e.location.start.line}:${e.location.start.column})`, "error", [e.location.start.offset, e.location.end.offset]);
        editorStore.highlightAndScroll(e.location, "error");
      } else if (e.location && e.location.start) {
        const loc = e.location.start;
        const msg = e.message.replace(/^Error:\s*/, "");
        consoleStore.actions.addEntry(`Build Error: ${msg} (at ${loc.line}:${loc.column})`, "error", e.location.end ? [e.location.start.offset, e.location.end.offset] : void 0);
        editorStore.highlightError(loc.line, loc.column);
      } else {
        consoleStore.actions.addEntry(`Build Error: ${e.message}`, "error");
      }
    }
  };
  const handleConsoleInput = async (input) => {
    consoleStore.actions.addEntry(`> ${input}`, "input");
    if (input.trim()) {
      consoleStore.actions.pushHistory(input);
    }
    if (isWaitingForInput && currentRunner) {
      vm.resume_with_input(new perc_string(input));
      isWaitingForInput = false;
      runVM();
      return;
    }
    if (input.trim()) {
      try {
        vm.execute_repl(input, parser);
        currentRunner = vm.run();
        await runVM();
        if (vm.stack.length > 0) {
          const result = vm.stack.pop();
          if (result) {
            consoleStore.actions.addEntry(result.to_string(), "log");
          }
        }
      } catch (err) {
        if (err instanceof PercCompileError && err.location) {
          consoleStore.actions.addEntry(`Build Error: ${err.message} (at ${err.location.start.line}:${err.location.start.column})`, "error", [err.location.start.offset, err.location.end.offset]);
        } else if (err.location) {
          consoleStore.actions.addEntry(`Error: ${err.message}`, "error", [err.location.start.offset, err.location.end.offset]);
        } else {
          consoleStore.actions.addEntry(`Error: ${err.message}`, "error");
        }
      }
    }
  };
  const appRoot = document.getElementById("app");
  if (appRoot) {
    render(() => {
      onMount(() => {
        const getLineCol2 = (offset) => {
          const code = editorStore.getValue();
          let line = 1;
          let col = 1;
          for (let i = 0; i < offset && i < code.length; i++) {
            if (code[i] === "\n") {
              line++;
              col = 1;
            } else {
              col++;
            }
          }
          return {
            line,
            col
          };
        };
        vm.set_events({
          on_error: (msg, location) => {
            const cleanMsg = msg.replace(/^(Javascript Error|Syntax Error|Error):\s*/i, "");
            let fmtMsg = `Runtime Error: ${cleanMsg}`;
            if (location && location[0] !== void 0) {
              const {
                line,
                col
              } = getLineCol2(location[0]);
              fmtMsg += ` (at ${line}:${col})`;
            }
            consoleStore.actions.addEntry(fmtMsg, "error", location || void 0);
            stopVM();
          },
          on_input_request: (prompt2) => {
            isWaitingForInput = true;
            consoleStore.actions.addEntry(prompt2 || "Input required:", "log");
            consoleStore.actions.addEntry("Type input below and press Enter...", "status");
            updateToolbarState("input");
          },
          on_node_eval: (range) => {
            editorStore.highlightRange(range[0], range[1]);
          },
          on_debugger: () => {
            isPaused = true;
            updateToolbarState("paused");
            if (appStore.layout.dcSplit < 0.1) {
              appStore.updateSize("dc", 0.5);
            }
            editorStore.enter_debug_mode();
          },
          on_state_dump: () => {
            vm.syncDebugStore();
          }
        });
        vm.register_builtins(standardBuiltins);
        const legacyConsole = {
          print: (msg) => consoleStore.actions.addEntry(msg, "log"),
          println: (msg) => consoleStore.actions.addEntry(msg, "log"),
          error: (msg, loc) => consoleStore.actions.addEntry(msg, "error", loc),
          status: (msg) => consoleStore.actions.addEntry(msg, "status"),
          input: (msg) => consoleStore.actions.addEntry(msg, "input"),
          setTextColor: (color) => consoleStore.actions.setTextColor(color),
          clear: () => consoleStore.actions.clear()
        };
        vm.register_builtins(createConsoleBuiltins(legacyConsole, (prompt2) => {
          vm.is_waiting_for_input = true;
          vm.is_waiting_for_input = true;
          consoleStore.actions.addEntry(prompt2 || "Input required:", "status");
          updateToolbarState("input");
        }));
        vm.register_builtins(createGuiBuiltins(gui));
        editorStore.setVariableProvider(() => {
          return Array.from(vm.get_global_scope().values.keys());
        });
        editorStore.setBuiltins(Array.from(vm.get_foreign_funcs().keys()));
        consoleStore.actions.addEntry("Welcome to PerC IDE v0.1", "status");
      });
      return createComponent(App, {
        vm,
        console: consoleStore,
        onConsoleInput: handleConsoleInput,
        onRun: handleRun,
        onStop: handleStop,
        onStep: handleStep,
        onContinue: handleContinue,
        onBuild: handleBuild,
        onTheme: (t) => {
          document.body.classList.remove("dark-theme", "light-theme", "contrast-theme");
          document.body.classList.add(`${t}-theme`);
          editorStore.setTheme(t);
        },
        onWrap: (w) => editorStore.setWordWrap(w === "on"),
        onEditorZoom: (size) => editorStore.setFontSize(size),
        onDebuggerZoom: (size) => {
          const el = document.getElementById("debugger-content");
          if (el) el.style.fontSize = size * 14 / 100 + "px";
        },
        onConsoleZoom: (size) => {
          const el = document.getElementById("console-output");
          if (el) el.style.fontSize = size * 14 / 100 + "px";
        }
      });
    }, appRoot);
  }
};
initApp();
