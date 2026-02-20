import { c as createStore, v as createContext, w as useContext, q as createMemo, b as createComponent, i as insert, F as For, f as createRenderEffect, l as setStyleProperty, t as template, s as setAttribute, n as Show, d as delegateEvents, a as createSignal, M as Match, S as Switch, x as reconcile, r as render } from "./solid-BjSJ4mY_.js";
const colorCache = /* @__PURE__ */ new Map();
function toCSSColor(c) {
  if (!c) return "transparent";
  const a = c.a !== void 0 ? c.a : 1;
  const key = `${c.r},${c.g},${c.b},${a}`;
  let css = colorCache.get(key);
  if (!css) {
    css = `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    if (colorCache.size < 1e3) colorCache.set(key, css);
  }
  return css;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2) return q2;
      if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function getHoverColor(c, percent) {
  const { r, g, b, a = 1 } = c;
  const [h, s, l] = rgbToHsl(r, g, b);
  const newL = l > 50 ? Math.max(0, l - percent) : Math.min(100, l + percent);
  const [nr, ng, nb] = hslToRgb(h, s, newL);
  return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
}
function toCSSMatrix(m) {
  if (!m) return "matrix(1, 0, 0, 1, 0, 0)";
  return `matrix(${m[0]}, ${m[3]}, ${m[1]}, ${m[4]}, ${m[2]}, ${m[5]})`;
}
function multiplyMatrices(m1, m2) {
  const result = new Array(9).fill(0);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += m1[row * 3 + k] * m2[k * 3 + col];
      }
      result[row * 3 + col] = sum;
    }
  }
  return result;
}
function getAccessibilityLabel(type, props, style) {
  const color = style.fill?.() !== "transparent" ? style.fill?.() : style.stroke?.();
  const pos = props.pos || props.p1;
  let label = `${type} @ (${pos?.x}, ${pos?.y})`;
  if (type === "circle") {
    label = `circle @ (${props.pos.x}, ${props.pos.y}) radius ${props.radius} color ${color}`;
  } else if (type === "rect") {
    label = `rectangle @ (${props.pos.x}, ${props.pos.y}) ${props.width}x${props.height} color ${color}`;
  } else if (type === "line") {
    label = `line from (${props.p1.x}, ${props.p1.y}) to (${props.p2.x}, ${props.p2.y}) color ${style.stroke()}`;
  } else if (type === "polygon") {
    label = `polygon with ${props.pos.length} points color ${color}`;
  } else if (type === "text") {
    label = `text "${props.text}" @ (${props.pos.x}, ${props.pos.y}) color ${color}`;
  }
  return label;
}
function buildRenderTree(commands) {
  const defaultTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const defaultGroup = {
    type: "group",
    transform: [...defaultTransform],
    fill: { r: 128, g: 128, b: 128, a: 1 },
    stroke: { r: 0, g: 0, b: 0, a: 1 },
    strokeWidth: 1,
    elements: []
  };
  const stack = [defaultGroup];
  const current = () => stack[stack.length - 1];
  for (const cmd of commands) {
    switch (cmd.type) {
      case "group":
        const newGroup = {
          type: "group",
          transform: [...defaultTransform],
          fill: current().fill,
          stroke: current().stroke,
          strokeWidth: current().strokeWidth,
          elements: []
        };
        current().elements.push(newGroup);
        stack.push(newGroup);
        break;
      case "end_group":
        if (stack.length > 1) stack.pop();
        break;
      case "transform":
        if (cmd.transform) {
          current().transform = multiplyMatrices(current().transform, cmd.transform);
        }
        break;
      case "fill":
        current().fill = cmd.fill;
        break;
      case "stroke":
        current().stroke = cmd.stroke;
        if (cmd.strokeWidth !== void 0) current().strokeWidth = cmd.strokeWidth;
        break;
      case "rect":
      case "circle":
      case "line":
      case "text":
      case "image":
      case "sprite":
      case "polygon":
      case "button":
      case "slider":
      case "checkbox":
      case "radio":
      case "textbox":
        const element = {
          ...cmd,
          fill: current().fill,
          stroke: current().stroke,
          strokeWidth: current().strokeWidth
        };
        current().elements.push(element);
        break;
    }
  }
  return stack[0];
}
const inputState = {};
const [guiState, setGuiState] = createStore({
  root: null,
  width: 640,
  height: 480,
  mouseX: 0,
  mouseY: 0,
  showCoords: false
});
function syncInput(extra) {
  if (window.opener) {
    if (extra) {
      window.opener.postMessage(extra, "*");
    }
    window.opener.postMessage(
      { type: "input_update", state: inputState },
      "*"
    );
  }
}
const StyleContext = createContext({
  fill: "gray",
  stroke: "black",
  strokeWidth: 1
});
function useResolvedStyle(props) {
  const context = useContext(StyleContext);
  const fill = createMemo(() => props.fill ? toCSSColor(props.fill) : context.fill);
  const stroke = createMemo(() => props.stroke ? toCSSColor(props.stroke) : context.stroke);
  const strokeWidth = createMemo(() => props.strokeWidth !== void 0 ? props.strokeWidth : context.strokeWidth);
  return {
    fill,
    stroke,
    strokeWidth
  };
}
var _tmpl$$d = /* @__PURE__ */ template(`<div style="position:absolute;top:0px;left:0px;width:0px;height:0px;overflow:visible;transform-origin:top left">`);
const GroupComponent = (props) => {
  const parentStyle = useContext(StyleContext);
  const style = () => ({
    fill: props.group.fill ? toCSSColor(props.group.fill) : parentStyle.fill,
    stroke: props.group.stroke ? toCSSColor(props.group.stroke) : parentStyle.stroke,
    strokeWidth: props.group.strokeWidth !== void 0 ? props.group.strokeWidth : parentStyle.strokeWidth
  });
  return createComponent(StyleContext.Provider, {
    get value() {
      return style();
    },
    get children() {
      var _el$ = _tmpl$$d();
      insert(_el$, createComponent(For, {
        get each() {
          return props.group.elements;
        },
        children: (el) => createComponent(ElementRenderer, {
          element: el
        })
      }));
      createRenderEffect((_p$) => {
        var _v$ = toCSSMatrix(props.group.transform), _v$2 = style().fill;
        _v$ !== _p$.e && setStyleProperty(_el$, "transform", _p$.e = _v$);
        _v$2 !== _p$.t && setStyleProperty(_el$, "color", _p$.t = _v$2);
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$;
    }
  });
};
var _tmpl$$c = /* @__PURE__ */ template(`<div style=position:absolute><svg width=100% height=100% style=overflow:visible;pointer-events:none><rect x=0 y=0>`);
const RectComponent = (props) => {
  const style = useResolvedStyle(props.rect);
  return (() => {
    var _el$ = _tmpl$$c(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("rect", props.rect, style), _v$2 = `${props.rect.pos.x}px`, _v$3 = `${props.rect.pos.y}px`, _v$4 = `${props.rect.width}px`, _v$5 = `${props.rect.height}px`, _v$6 = props.rect.width, _v$7 = props.rect.height, _v$8 = style.fill(), _v$9 = style.stroke(), _v$0 = style.strokeWidth();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$3, "width", _p$.n = _v$6);
      _v$7 !== _p$.s && setAttribute(_el$3, "height", _p$.s = _v$7);
      _v$8 !== _p$.h && setAttribute(_el$3, "fill", _p$.h = _v$8);
      _v$9 !== _p$.r && setAttribute(_el$3, "stroke", _p$.r = _v$9);
      _v$0 !== _p$.d && setAttribute(_el$3, "stroke-width", _p$.d = _v$0);
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
      d: void 0
    });
    return _el$;
  })();
};
var _tmpl$$b = /* @__PURE__ */ template(`<div style=position:absolute><svg width=100% height=100% style=overflow:visible;pointer-events:none><circle cx=50% cy=50%>`);
const CircleComponent = (props) => {
  const style = useResolvedStyle(props.circle);
  return (() => {
    var _el$ = _tmpl$$b(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("circle", props.circle, style), _v$2 = `${props.circle.pos.x - props.circle.radius}px`, _v$3 = `${props.circle.pos.y - props.circle.radius}px`, _v$4 = `${props.circle.radius * 2}px`, _v$5 = `${props.circle.radius * 2}px`, _v$6 = props.circle.radius, _v$7 = style.fill(), _v$8 = style.stroke(), _v$9 = style.strokeWidth();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$3, "r", _p$.n = _v$6);
      _v$7 !== _p$.s && setAttribute(_el$3, "fill", _p$.s = _v$7);
      _v$8 !== _p$.h && setAttribute(_el$3, "stroke", _p$.h = _v$8);
      _v$9 !== _p$.r && setAttribute(_el$3, "stroke-width", _p$.r = _v$9);
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
      r: void 0
    });
    return _el$;
  })();
};
var _tmpl$$a = /* @__PURE__ */ template(`<div style=position:absolute><svg width=100% height=100% style=overflow:visible;pointer-events:none><line stroke-linecap=round>`);
const LineComponent = (props) => {
  const style = useResolvedStyle(props.line);
  const minXForSvg = Math.min(props.line.p1.x, props.line.p2.x) - style.strokeWidth();
  const minYForSvg = Math.min(props.line.p1.y, props.line.p2.y) - style.strokeWidth();
  return (() => {
    var _el$ = _tmpl$$a(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("line", props.line, style), _v$2 = `${Math.min(props.line.p1.x, props.line.p2.x)}px`, _v$3 = `${Math.min(props.line.p1.y, props.line.p2.y)}px`, _v$4 = `${Math.abs(props.line.p1.x - props.line.p2.x)}px`, _v$5 = `${Math.abs(props.line.p1.y - props.line.p2.y)}px`, _v$6 = props.line.p1.x - minXForSvg, _v$7 = props.line.p1.y - minYForSvg, _v$8 = props.line.p2.x - minXForSvg, _v$9 = props.line.p2.y - minYForSvg, _v$0 = style.stroke(), _v$1 = style.strokeWidth();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$3, "x1", _p$.n = _v$6);
      _v$7 !== _p$.s && setAttribute(_el$3, "y1", _p$.s = _v$7);
      _v$8 !== _p$.h && setAttribute(_el$3, "x2", _p$.h = _v$8);
      _v$9 !== _p$.r && setAttribute(_el$3, "y2", _p$.r = _v$9);
      _v$0 !== _p$.d && setAttribute(_el$3, "stroke", _p$.d = _v$0);
      _v$1 !== _p$.l && setAttribute(_el$3, "stroke-width", _p$.l = _v$1);
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
var _tmpl$$9 = /* @__PURE__ */ template(`<div style="position:absolute;font:14px sans-serif;white-space:pre">`);
const TextComponent = (props) => {
  const style = useResolvedStyle(props.text);
  const align = props.text.align || "left";
  return (() => {
    var _el$ = _tmpl$$9();
    setStyleProperty(_el$, "text-align", align);
    setStyleProperty(_el$, "transform", `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, 0)`);
    insert(_el$, () => props.text.text);
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("text", props.text, style), _v$2 = `${props.text.pos.x}px`, _v$3 = `${props.text.pos.y}px`, _v$4 = style.fill();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "color", _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$;
  })();
};
var _tmpl$$8 = /* @__PURE__ */ template(`<div style=position:absolute><img style=width:100%;height:100%;image-rendering:pixelated>`);
const ImageComponent = (props) => {
  const style = useResolvedStyle(props.image);
  return (() => {
    var _el$ = _tmpl$$8(), _el$2 = _el$.firstChild;
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("image", props.image, style), _v$2 = `${props.image.pos.x}px`, _v$3 = `${props.image.pos.y}px`, _v$4 = `${props.image.width}px`, _v$5 = `${props.image.height}px`, _v$6 = props.image.src;
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$2, "src", _p$.n = _v$6);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
};
var _tmpl$$7 = /* @__PURE__ */ template(`<div style=position:absolute><img style=image-rendering:pixelated>`);
const spriteCache = /* @__PURE__ */ new Map();
function generateSpriteDataUrl(pixels, w, h) {
  const key = `${w}x${h}:${JSON.stringify(pixels)}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(w, h);
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    const idx = i * 4;
    imgData.data[idx] = p.r;
    imgData.data[idx + 1] = p.g;
    imgData.data[idx + 2] = p.b;
    imgData.data[idx + 3] = (p.a !== void 0 ? p.a : 1) * 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const url = canvas.toDataURL();
  if (spriteCache.size >= 50) {
    spriteCache.delete(spriteCache.keys().next().value);
  }
  spriteCache.set(key, url);
  return url;
}
const SpriteComponent = (props) => {
  const url = createMemo(() => generateSpriteDataUrl(props.sprite.data, props.sprite.width, props.sprite.height));
  return (() => {
    var _el$ = _tmpl$$7(), _el$2 = _el$.firstChild;
    createRenderEffect((_p$) => {
      var _v$ = getAccessibilityLabel("sprite", props.sprite, {}), _v$2 = `${props.sprite.pos.x}px`, _v$3 = `${props.sprite.pos.y}px`, _v$4 = `${props.sprite.width}px`, _v$5 = `${props.sprite.height}px`, _v$6 = url();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$2, "src", _p$.n = _v$6);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
};
var _tmpl$$6 = /* @__PURE__ */ template(`<div style=position:absolute><svg width=100% height=100% style=overflow:visible;pointer-events:none><polygon>`);
const PolygonComponent = (props) => {
  const style = useResolvedStyle(props.polygon);
  const bounds = createMemo(() => {
    if (!props.polygon.pos || props.polygon.pos.length === 0) return null;
    const xs = props.polygon.pos.map((p) => p.x);
    const ys = props.polygon.pos.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pointsStr = props.polygon.pos.map((p) => `${p.x - minX},${p.y - minY}`).join(" ");
    return {
      minX,
      minY,
      w: maxX - minX,
      h: maxY - minY,
      pointsStr
    };
  });
  return createComponent(Show, {
    get when() {
      return bounds();
    },
    get children() {
      var _el$ = _tmpl$$6(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
      createRenderEffect((_p$) => {
        var _v$ = getAccessibilityLabel("polygon", props.polygon, style), _v$2 = `${bounds().minX}px`, _v$3 = `${bounds().minY}px`, _v$4 = `${bounds().w}px`, _v$5 = `${bounds().h}px`, _v$6 = bounds().pointsStr, _v$7 = style.fill(), _v$8 = style.stroke(), _v$9 = style.strokeWidth();
        _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
        _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
        _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
        _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
        _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
        _v$6 !== _p$.n && setAttribute(_el$3, "points", _p$.n = _v$6);
        _v$7 !== _p$.s && setAttribute(_el$3, "fill", _p$.s = _v$7);
        _v$8 !== _p$.h && setAttribute(_el$3, "stroke", _p$.h = _v$8);
        _v$9 !== _p$.r && setAttribute(_el$3, "stroke-width", _p$.r = _v$9);
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
        r: void 0
      });
      return _el$;
    }
  });
};
var _tmpl$$5 = /* @__PURE__ */ template(`<button style="position:absolute;width:100px;height:30px;font-weight:bold;border-radius:4px;cursor:pointer;box-shadow:2px 2px 0px rgba(0,0,0,0.2);transition:background-color 0.2s">`);
const ButtonComponent = (props) => {
  const style = useResolvedStyle(props.button);
  const hoverFill = () => {
    if (props.button.fill) {
      return getHoverColor(props.button.fill, 15);
    }
    return style.fill();
  };
  const [hover, setHover] = createSignal(false);
  return (() => {
    var _el$ = _tmpl$$5();
    _el$.$$click = () => {
      syncInput({
        type: "gui_event",
        id: props.button.id
      });
    };
    _el$.addEventListener("mouseleave", () => setHover(false));
    _el$.addEventListener("mouseenter", () => setHover(true));
    insert(_el$, () => props.button.text);
    createRenderEffect((_p$) => {
      var _v$ = `${props.button.pos.x}px`, _v$2 = `${props.button.pos.y}px`, _v$3 = `2px solid ${style.stroke()}`, _v$4 = style.stroke(), _v$5 = hover() ? hoverFill() : style.fill(), _v$6 = props.button.text;
      _v$ !== _p$.e && setStyleProperty(_el$, "left", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "top", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "border", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "color", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "background-color", _p$.i = _v$5);
      _v$6 !== _p$.n && setAttribute(_el$, "aria-label", _p$.n = _v$6);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
};
delegateEvents(["click"]);
var _tmpl$$4 = /* @__PURE__ */ template(`<input type=range min=0 max=100 style=position:absolute;margin:0>`);
const SliderComponent = (props) => {
  const style = useResolvedStyle(props.slider);
  return (() => {
    var _el$ = _tmpl$$4();
    _el$.$$input = (e) => {
      inputState[props.slider.id + "_val"] = parseFloat(e.currentTarget.value);
      syncInput();
    };
    createRenderEffect((_p$) => {
      var _v$ = props.slider.label || "Slider", _v$2 = `${props.slider.pos.x}px`, _v$3 = `${props.slider.pos.y}px`, _v$4 = `${props.slider.width}px`, _v$5 = style.fill();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "accent-color", _p$.i = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    });
    createRenderEffect(() => _el$.value = props.slider.val || 0);
    return _el$;
  })();
};
delegateEvents(["input"]);
var _tmpl$$3 = /* @__PURE__ */ template(`<input type=checkbox style=position:absolute;width:20px;height:20px;margin:0>`);
const CheckboxComponent = (props) => {
  const style = useResolvedStyle(props.checkbox);
  return (() => {
    var _el$ = _tmpl$$3();
    _el$.addEventListener("change", (e) => {
      inputState[props.checkbox.id + "_val"] = e.currentTarget.checked;
      syncInput();
    });
    createRenderEffect((_p$) => {
      var _v$ = props.checkbox.label || "Checkbox", _v$2 = `${props.checkbox.pos.x}px`, _v$3 = `${props.checkbox.pos.y}px`, _v$4 = style.fill();
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "accent-color", _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    createRenderEffect(() => _el$.checked = props.checkbox.val || false);
    return _el$;
  })();
};
var _tmpl$$2 = /* @__PURE__ */ template(`<input type=radio style=position:absolute;margin:0>`);
const RadioComponent = (props) => {
  const style = useResolvedStyle(props.radio);
  return (() => {
    var _el$ = _tmpl$$2();
    _el$.addEventListener("change", (e) => {
      if (e.currentTarget.checked) {
        const prefix = `rad_${props.radio.group}_`;
        for (const key in inputState) {
          if (key.startsWith(prefix) && key.endsWith("_val")) {
            inputState[key] = false;
          }
        }
        inputState[props.radio.id + "_val"] = true;
        syncInput({
          type: "gui_event",
          id: props.radio.id
        });
      }
    });
    createRenderEffect((_p$) => {
      var _v$ = props.radio.group, _v$2 = props.radio.label || "Radio button", _v$3 = `${props.radio.pos.x}px`, _v$4 = `${props.radio.pos.y}px`, _v$5 = style.fill();
      _v$ !== _p$.e && setAttribute(_el$, "name", _p$.e = _v$);
      _v$2 !== _p$.t && setAttribute(_el$, "aria-label", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "left", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "top", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "accent-color", _p$.i = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0
    });
    createRenderEffect(() => _el$.checked = props.radio.val || false);
    return _el$;
  })();
};
var _tmpl$$1 = /* @__PURE__ */ template(`<input type=text style=position:absolute;background-color:white;border-radius:4px>`);
const TextboxComponent = (props) => {
  const style = useResolvedStyle(props.textbox);
  return (() => {
    var _el$ = _tmpl$$1();
    _el$.addEventListener("blur", () => {
      if (inputState["focused_textbox"] === props.textbox.id) {
        inputState["focused_textbox"] = null;
        syncInput();
      }
    });
    _el$.addEventListener("focus", () => {
      inputState["focused_textbox"] = props.textbox.id;
      syncInput();
    });
    _el$.$$input = (e) => {
      inputState[props.textbox.id + "_val"] = e.currentTarget.value;
      syncInput();
    };
    createRenderEffect((_p$) => {
      var _v$ = props.textbox.prompt || "Input", _v$2 = `${props.textbox.pos.x}px`, _v$3 = `${props.textbox.pos.y}px`, _v$4 = `${props.textbox.width}px`, _v$5 = `${props.textbox.height}px`, _v$6 = `2px solid ${style.stroke()}`, _v$7 = style.stroke(), _v$8 = inputState["focused_textbox"] === props.textbox.id ? `2px solid ${style.stroke()}` : "none";
      _v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
      _v$3 !== _p$.a && setStyleProperty(_el$, "top", _p$.a = _v$3);
      _v$4 !== _p$.o && setStyleProperty(_el$, "width", _p$.o = _v$4);
      _v$5 !== _p$.i && setStyleProperty(_el$, "height", _p$.i = _v$5);
      _v$6 !== _p$.n && setStyleProperty(_el$, "border", _p$.n = _v$6);
      _v$7 !== _p$.s && setStyleProperty(_el$, "color", _p$.s = _v$7);
      _v$8 !== _p$.h && setStyleProperty(_el$, "outline", _p$.h = _v$8);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0
    });
    createRenderEffect(() => _el$.value = inputState[props.textbox.id + "_val"] || "");
    return _el$;
  })();
};
delegateEvents(["input"]);
const ElementRenderer = (props) => {
  return createComponent(Switch, {
    get children() {
      return [createComponent(Match, {
        get when() {
          return props.element.type === "group";
        },
        get children() {
          return createComponent(GroupComponent, {
            get group() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "rect";
        },
        get children() {
          return createComponent(RectComponent, {
            get rect() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "circle";
        },
        get children() {
          return createComponent(CircleComponent, {
            get circle() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "line";
        },
        get children() {
          return createComponent(LineComponent, {
            get line() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "text";
        },
        get children() {
          return createComponent(TextComponent, {
            get text() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "image";
        },
        get children() {
          return createComponent(ImageComponent, {
            get image() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "sprite";
        },
        get children() {
          return createComponent(SpriteComponent, {
            get sprite() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "polygon";
        },
        get children() {
          return createComponent(PolygonComponent, {
            get polygon() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "button";
        },
        get children() {
          return createComponent(ButtonComponent, {
            get button() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "slider";
        },
        get children() {
          return createComponent(SliderComponent, {
            get slider() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "checkbox";
        },
        get children() {
          return createComponent(CheckboxComponent, {
            get checkbox() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "radio";
        },
        get children() {
          return createComponent(RadioComponent, {
            get radio() {
              return props.element;
            }
          });
        }
      }), createComponent(Match, {
        get when() {
          return props.element.type === "textbox";
        },
        get children() {
          return createComponent(TextboxComponent, {
            get textbox() {
              return props.element;
            }
          });
        }
      })];
    }
  });
};
var _tmpl$ = /* @__PURE__ */ template(`<div style="position:absolute;background:rgba(0,0,0,0.75);color:white;padding:2px 6px;border-radius:3px;font-size:11px;font-family:monospace;pointer-events:none;z-index:10000;white-space:nowrap;box-shadow:2px 2px 4px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2)">, `), _tmpl$2 = /* @__PURE__ */ template(`<div id=gui-window role=application aria-label="PerC GUI Application"style="position:relative;margin:auto;margin-top:auto;margin-bottom:10px;background:white;box-shadow:0 0 40px rgba(0,0,0,0.8);flex-shrink:0">`), _tmpl$3 = /* @__PURE__ */ template(`<div style=color:#888;font-size:12px;margin-bottom:auto;padding-bottom:20px;text-align:center;max-width:80%;font-style:italic>Screen not updating? Try minimizing this window so that both the IDE window and this window are visible.`);
window.addEventListener("mousemove", (e) => {
  const root = document.getElementById("gui-window");
  if (root) {
    const rect = root.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    inputState["mouse_x"] = x;
    inputState["mouse_y"] = y;
    const target = e.target;
    const isInteractive = target.closest('button, input, [data-interactive="true"]');
    const isInside = x >= 0 && x <= guiState.width && y >= 0 && y <= guiState.height;
    setGuiState({
      mouseX: x,
      mouseY: y,
      showCoords: isInside && !isInteractive
    });
    syncInput();
  }
});
window.addEventListener("mousedown", () => {
  inputState["mouse_down"] = true;
  syncInput();
});
window.addEventListener("mouseup", () => {
  inputState["mouse_down"] = false;
  syncInput();
});
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "render_batch") {
    const root = buildRenderTree(event.data.batch);
    setGuiState("root", reconcile(root));
  } else if (event.data && event.data.type === "resize_window") {
    setGuiState("width", event.data.width);
    setGuiState("height", event.data.height);
    const chromeWidth = window.outerWidth - window.innerWidth;
    const chromeHeight = window.outerHeight - window.innerHeight;
    window.resizeTo(event.data.width + chromeWidth, event.data.height + chromeHeight + 40);
  }
});
const App = () => {
  return [(() => {
    var _el$ = _tmpl$2();
    insert(_el$, createComponent(Show, {
      get when() {
        return guiState.root;
      },
      get children() {
        return createComponent(ElementRenderer, {
          get element() {
            return guiState.root;
          }
        });
      }
    }), null);
    insert(_el$, createComponent(Show, {
      get when() {
        return guiState.showCoords;
      },
      get children() {
        var _el$2 = _tmpl$(), _el$3 = _el$2.firstChild;
        insert(_el$2, () => guiState.mouseX, _el$3);
        insert(_el$2, () => guiState.mouseY, null);
        createRenderEffect((_p$) => {
          var _v$ = `${guiState.mouseX + 12}px`, _v$2 = `${guiState.mouseY + 12}px`;
          _v$ !== _p$.e && setStyleProperty(_el$2, "left", _p$.e = _v$);
          _v$2 !== _p$.t && setStyleProperty(_el$2, "top", _p$.t = _v$2);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$2;
      }
    }), null);
    createRenderEffect((_p$) => {
      var _v$3 = `${guiState.width}px`, _v$4 = `${guiState.height}px`, _v$5 = guiState.showCoords ? "crosshair" : "default";
      _v$3 !== _p$.e && setStyleProperty(_el$, "width", _p$.e = _v$3);
      _v$4 !== _p$.t && setStyleProperty(_el$, "height", _p$.t = _v$4);
      _v$5 !== _p$.a && setStyleProperty(_el$, "cursor", _p$.a = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })(), _tmpl$3()];
};
render(() => createComponent(App, {}), document.getElementById("gui-root"));
