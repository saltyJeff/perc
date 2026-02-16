import { createStore, reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import { For, Switch, Match, Show, createContext, useContext, createSignal, createMemo } from "solid-js";
import type { GUICommand, Group, Rect, Circle, Line, Text, Image, Sprite, Button, Slider, Checkbox, Radio, Textbox, Position, Color } from "./gui_cmds";
import { toCSSColor, getHoverColor, toCSSMatrix, multiplyMatrices } from "./gui_window_utils";

interface RenderGroup {
    type: 'group';
    transform: number[];
    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
    elements: RenderElement[];
}

type RenderElement = (Exclude<GUICommand, Group | { type: 'end_group' } | { type: 'transform' } | { type: 'fill' } | { type: 'stroke' }> | RenderGroup) & {
    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
};



function buildRenderTree(commands: GUICommand[]): RenderGroup {
    const defaultTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const defaultGroup: RenderGroup = {
        type: 'group',
        transform: [...defaultTransform],
        fill: { r: 128, g: 128, b: 128, a: 1 },
        stroke: { r: 0, g: 0, b: 0, a: 1 },
        strokeWidth: 1,
        elements: []
    };

    const stack: RenderGroup[] = [defaultGroup];

    const current = () => stack[stack.length - 1];

    for (const cmd of commands) {
        switch (cmd.type) {
            case 'group':
                const newGroup: RenderGroup = {
                    type: 'group',
                    transform: [...defaultTransform],
                    fill: current().fill,
                    stroke: current().stroke,
                    strokeWidth: current().strokeWidth,
                    elements: []
                };
                current().elements.push(newGroup);
                stack.push(newGroup);
                break;
            case 'end_group':
                if (stack.length > 1) stack.pop();
                break;
            case 'transform':
                if (cmd.transform) {
                    current().transform = multiplyMatrices(current().transform, cmd.transform);
                }
                break;
            case 'fill':
                current().fill = cmd.fill;
                break;
            case 'stroke':
                current().stroke = cmd.stroke;
                if (cmd.strokeWidth !== undefined) current().strokeWidth = cmd.strokeWidth;
                break;
            case 'rect':
            case 'circle':
            case 'line':
            case 'text':
            case 'image':
            case 'sprite':
            case 'polygon':
            case 'button':
            case 'slider':
            case 'checkbox':
            case 'radio':
            case 'textbox':
                const element: RenderElement = {
                    ...cmd,
                    fill: current().fill,
                    stroke: current().stroke,
                    strokeWidth: current().strokeWidth
                } as RenderElement;
                current().elements.push(element);
                break;
            default:
                break;
        }
    }

    return stack[0];
}


const [guiState, setGuiState] = createStore<{
    root: RenderGroup | null,
    width: number,
    height: number,
    mouseX: number,
    mouseY: number,
    showCoords: boolean
}>({
    root: null,
    width: 640,
    height: 480,
    mouseX: 0,
    mouseY: 0,
    showCoords: false
});
const inputState: Record<string, any> = {};

window.addEventListener("mousemove", (e) => {
    const root = document.getElementById("gui-window");
    if (root) {
        const rect = root.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        inputState["mouse_x"] = x;
        inputState["mouse_y"] = y;

        // Check if hovering over an interactive element (button, input, etc)
        const target = e.target as HTMLElement;
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

function syncInput(extra?: any) {
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


window.addEventListener("message", (event) => {
    if (event.data && event.data.type === 'render_batch') {
        const root = buildRenderTree(event.data.batch);
        setGuiState("root", reconcile(root));
    } else if (event.data && event.data.type === 'resize_window') {
        setGuiState("width", event.data.width);
        setGuiState("height", event.data.height);

        // Attempt to resize the browser window to fit the logical canvas + some padding for window chrome
        // Note: Browsers may block this if not triggered by user interaction, but we'll try.
        const chromeWidth = window.outerWidth - window.innerWidth;
        const chromeHeight = window.outerHeight - window.innerHeight;
        window.resizeTo(event.data.width + chromeWidth, event.data.height + chromeHeight + 40); // 40px extra for the warning text
    }
});

interface StyleContextValue {
    fill: string;
    stroke: string;
    strokeWidth: number;
}

const StyleContext = createContext<StyleContextValue>({ fill: "gray", stroke: "black", strokeWidth: 1 });

function useResolvedStyle(props: { fill?: Color, stroke?: Color, strokeWidth?: number }) {
    const context = useContext(StyleContext);

    const fill = createMemo(() => props.fill ? toCSSColor(props.fill) : context.fill);
    const stroke = createMemo(() => props.stroke ? toCSSColor(props.stroke) : context.stroke);
    const strokeWidth = createMemo(() => props.strokeWidth !== undefined ? props.strokeWidth : context.strokeWidth);

    return { fill, stroke, strokeWidth };
}
type StyleProps = { fill?: Color, stroke?: Color, strokeWidth?: number }
const ElementRenderer = (props: { element: RenderElement }) => {
    return (
        <Switch>
            <Match when={props.element.type === 'group'}>
                <GroupComponent group={props.element as RenderGroup} />
            </Match>
            <Match when={props.element.type === 'rect'}>
                <RectComponent rect={props.element as Rect & StyleProps} />
            </Match>
            <Match when={props.element.type === 'circle'}>
                <CircleComponent circle={props.element as Circle & StyleProps} />
            </Match>
            <Match when={props.element.type === 'line'}>
                <LineComponent line={props.element as Line & StyleProps} />
            </Match>
            <Match when={props.element.type === 'text'}>
                <TextComponent text={props.element as Text & StyleProps} />
            </Match>
            <Match when={props.element.type === 'image'}>
                <ImageComponent image={props.element as Image & StyleProps} />
            </Match>
            <Match when={props.element.type === 'sprite'}>
                <SpriteComponent sprite={props.element as Sprite & StyleProps} />
            </Match>
            <Match when={props.element.type === 'polygon'}>
                <PolygonComponent polygon={props.element as any} />
            </Match>

            <Match when={props.element.type === 'button'}>
                <ButtonComponent button={props.element as Button & StyleProps} />
            </Match>
            <Match when={props.element.type === 'slider'}>
                <SliderComponent slider={props.element as Slider & StyleProps} />
            </Match>
            <Match when={props.element.type === 'checkbox'}>
                <CheckboxComponent checkbox={props.element as Checkbox & StyleProps} />
            </Match>
            <Match when={props.element.type === 'radio'}>
                <RadioComponent radio={props.element as Radio & StyleProps} />
            </Match>
            <Match when={props.element.type === 'textbox'}>
                <TextboxComponent textbox={props.element as Textbox & StyleProps} />
            </Match>
        </Switch>
    );
};

const GroupComponent = (props: { group: RenderGroup }) => {
    const parentStyle = useContext(StyleContext);

    const style = () => ({
        fill: props.group.fill ? toCSSColor(props.group.fill) : parentStyle.fill,
        stroke: props.group.stroke ? toCSSColor(props.group.stroke) : parentStyle.stroke,
        strokeWidth: props.group.strokeWidth !== undefined ? props.group.strokeWidth : parentStyle.strokeWidth
    });

    return (
        <StyleContext.Provider value={style()}>
            <div style={{
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "0px",
                height: "0px",
                overflow: "visible",
                transform: toCSSMatrix(props.group.transform),
                "transform-origin": "top left",
                color: style().fill
            }}>
                <For each={props.group.elements}>
                    {(el) => <ElementRenderer element={el} />}
                </For>
            </div>
        </StyleContext.Provider>
    );
};


const RectComponent = (props: { rect: Rect & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.rect);

    return (
        <div style={{
            position: "absolute",
            left: `${props.rect.pos.x}px`,
            top: `${props.rect.pos.y}px`,
            width: `${props.rect.width}px`,
            height: `${props.rect.height}px`
        }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <rect x="0" y="0" width={props.rect.width} height={props.rect.height}
                    fill={style.fill()}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                />
            </svg>
        </div>
    );
};

const CircleComponent = (props: { circle: Circle & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.circle);

    return (
        <div style={{
            position: "absolute",
            left: `${props.circle.pos.x - props.circle.radius}px`,
            top: `${props.circle.pos.y - props.circle.radius}px`,
            width: `${props.circle.radius * 2}px`,
            height: `${props.circle.radius * 2}px`
        }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <circle cx="50%" cy="50%" r={props.circle.radius}
                    fill={style.fill()}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                />
            </svg>
        </div>
    );
}

const LineComponent = (props: { line: Line & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.line);

    const minX = Math.min(props.line.p1.x, props.line.p2.x) - style.strokeWidth();
    const minY = Math.min(props.line.p1.y, props.line.p2.y) - style.strokeWidth();
    const maxX = Math.max(props.line.p1.x, props.line.p2.x) + style.strokeWidth();
    const maxY = Math.max(props.line.p1.y, props.line.p2.y) + style.strokeWidth();
    const w = maxX - minX;
    const h = maxY - minY;

    return (
        <div style={{
            position: "absolute",
            left: `${minX}px`,
            top: `${minY}px`,
            width: `${w}px`,
            height: `${h}px`
        }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <line x1={props.line.p1.x - minX} y1={props.line.p1.y - minY}
                    x2={props.line.p2.x - minX} y2={props.line.p2.y - minY}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                    stroke-linecap="round"
                />
            </svg>
        </div>
    );
}

const TextComponent = (props: { text: Text & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.text);
    const align = props.text.align || 'left';
    return (
        <div style={{
            position: "absolute",
            left: `${props.text.pos.x}px`,
            top: `${props.text.pos.y}px`,
            font: "14px sans-serif",
            "white-space": "pre",
            color: style.fill(),
            "text-align": align as CanvasTextAlign,
            transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, 0)`
        }}>
            {props.text.text}
        </div>
    );
}

const ImageComponent = (props: { image: Image & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    return (
        <img src={props.image.src} style={{
            position: "absolute",
            left: `${props.image.pos.x}px`,
            top: `${props.image.pos.y}px`,
            width: `${props.image.width}px`,
            height: `${props.image.height}px`,
            "image-rendering": "pixelated"
        }} />
    )
}

const PolygonComponent = (props: { polygon: { fill?: Color, stroke?: Color, strokeWidth?: number, pos: Position[] } }) => {
    const style = useResolvedStyle(props.polygon);

    const bounds = createMemo(() => {
        if (!props.polygon.pos || props.polygon.pos.length === 0) return null;
        const xs = props.polygon.pos.map(p => p.x);
        const ys = props.polygon.pos.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const pointsStr = props.polygon.pos.map(p => `${p.x - minX},${p.y - minY}`).join(" ");
        return { minX, minY, w: maxX - minX, h: maxY - minY, pointsStr };
    });

    return (
        <Show when={bounds()}>
            <div style={{
                position: "absolute",
                left: `${bounds()!.minX}px`,
                top: `${bounds()!.minY}px`,
                width: `${bounds()!.w}px`,
                height: `${bounds()!.h}px`
            }}>
                <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                    <polygon points={bounds()!.pointsStr}
                        fill={style.fill()}
                        stroke={style.stroke()}
                        stroke-width={style.strokeWidth()}
                    />
                </svg>
            </div>
        </Show>
    );
}

const spriteCache = new Map<string, string>();
function generateSpriteDataUrl(pixels: Color[], w: number, h: number): string {
    const key = `${w}x${h}:${JSON.stringify(pixels)}`;
    if (spriteCache.has(key)) return spriteCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.createImageData(w, h);

    for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        const idx = i * 4;
        imgData.data[idx] = p.r;
        imgData.data[idx + 1] = p.g;
        imgData.data[idx + 2] = p.b;
        imgData.data[idx + 3] = (p.a !== undefined ? p.a : 1) * 255;
    }

    ctx.putImageData(imgData, 0, 0);
    const url = canvas.toDataURL();

    if (spriteCache.size >= 50) {
        spriteCache.delete(spriteCache.keys().next().value!);
    }
    spriteCache.set(key, url);
    return url;
}

const SpriteComponent = (props: { sprite: Sprite & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const url = createMemo(() => generateSpriteDataUrl(props.sprite.data, props.sprite.width, props.sprite.height));

    return (
        <img src={url()} style={{
            position: "absolute",
            left: `${props.sprite.pos.x}px`,
            top: `${props.sprite.pos.y}px`,
            width: `${props.sprite.width}px`,
            height: `${props.sprite.height}px`,
            "image-rendering": "pixelated"
        }} />
    );
}

const ButtonComponent = (props: { button: Button & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.button);

    const hoverFill = () => {
        if (props.button.fill) {
            return getHoverColor(props.button.fill, 15);
        }
        return style.fill();
    };

    const [hover, setHover] = createSignal(false);

    return (
        <button
            style={{
                position: "absolute",
                left: `${props.button.pos.x}px`,
                top: `${props.button.pos.y}px`,
                width: "100px",
                height: "30px",
                border: `2px solid ${style.stroke()}`,
                color: style.stroke(),
                "background-color": hover() ? hoverFill() : style.fill(),
                "font-weight": "bold",
                "border-radius": "4px",
                cursor: "pointer",
                "box-shadow": "2px 2px 0px rgba(0,0,0,0.2)",
                transition: "background-color 0.2s"
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => {
                syncInput({ type: "gui_event", id: props.button.id });
            }}
        >
            {props.button.text}
        </button>
    );
}

const SliderComponent = (props: { slider: Slider & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.slider);

    return (
        <input type="range" min="0" max="100"
            value={(props.slider as any).val || 0}
            style={{
                position: "absolute",
                left: `${props.slider.pos.x}px`,
                top: `${props.slider.pos.y}px`,
                width: `${props.slider.width}px`,
                margin: "0",
                "accent-color": style.fill()
            }}
            onInput={(e) => {
                inputState[props.slider.id + "_val"] = parseFloat(e.currentTarget.value);
                syncInput();
            }}
        />
    );
}

const CheckboxComponent = (props: { checkbox: Checkbox & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.checkbox);

    return (
        <input type="checkbox"
            checked={(props.checkbox as any).val || false}
            style={{
                position: "absolute",
                left: `${props.checkbox.pos.x}px`,
                top: `${props.checkbox.pos.y}px`,
                width: "20px",
                height: "20px",
                margin: "0",
                "accent-color": style.fill()
            }}
            onChange={(e) => {
                inputState[props.checkbox.id + "_val"] = e.currentTarget.checked;
                syncInput();
            }}
        />
    )
}

const RadioComponent = (props: { radio: Radio & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.radio);

    return (
        <input type="radio"
            checked={(props.radio as any).val || false}
            name={props.radio.group}
            style={{
                position: "absolute",
                left: `${props.radio.pos.x}px`,
                top: `${props.radio.pos.y}px`,
                margin: "0",
                "accent-color": style.fill()
            }}
            onChange={(e) => {
                if (e.currentTarget.checked) {
                    // Clear other radio buttons in the same group in inputState
                    const prefix = `rad_${props.radio.group}_`;
                    for (const key in inputState) {
                        if (key.startsWith(prefix) && key.endsWith("_val")) {
                            inputState[key] = false;
                        }
                    }
                    inputState[props.radio.id + "_val"] = true;
                    syncInput({ type: "gui_event", id: props.radio.id });
                }
            }}
        />
    )
}

const TextboxComponent = (props: { textbox: Textbox & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.textbox);

    return (
        <input type="text"
            value={inputState[props.textbox.id + "_val"] || ""}
            style={{
                position: "absolute",
                left: `${props.textbox.pos.x}px`,
                top: `${props.textbox.pos.y}px`,
                width: `${props.textbox.width}px`,
                height: `${props.textbox.height}px`,
                border: `2px solid ${style.stroke()}`,
                color: style.stroke(),
                "background-color": "white",
                "border-radius": "4px",
                outline: inputState["focused_textbox"] === props.textbox.id ? `2px solid ${style.stroke()}` : "none"
            }}
            onInput={(e) => {
                inputState[props.textbox.id + "_val"] = e.currentTarget.value;
                syncInput();
            }}
            onFocus={() => {
                inputState["focused_textbox"] = props.textbox.id;
                syncInput();
            }}
            onBlur={() => {
                if (inputState["focused_textbox"] === props.textbox.id) {
                    inputState["focused_textbox"] = null;
                    syncInput();
                }
            }}
        />
    )
}


const App = () => {
    return (
        <>
            <div id="gui-window" style={{
                width: `${guiState.width}px`,
                height: `${guiState.height}px`,
                position: "relative",
                margin: "auto",
                "margin-top": "auto",
                "margin-bottom": "10px",
                background: "white",
                "box-shadow": "0 0 40px rgba(0,0,0,0.8)",
                "flex-shrink": 0,
                cursor: guiState.showCoords ? "crosshair" : "default"
            }}>
                <Show when={guiState.root}>
                    <ElementRenderer element={guiState.root!} />
                </Show>

                <Show when={guiState.showCoords}>
                    <div style={{
                        position: "absolute",
                        left: `${guiState.mouseX + 12}px`,
                        top: `${guiState.mouseY + 12}px`,
                        background: "rgba(0,0,0,0.75)",
                        color: "white",
                        padding: "2px 6px",
                        "border-radius": "3px",
                        "font-size": "11px",
                        "font-family": "monospace",
                        "pointer-events": "none",
                        "z-index": 10000,
                        "white-space": "nowrap",
                        "box-shadow": "2px 2px 4px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.2)"
                    }}>
                        {guiState.mouseX}, {guiState.mouseY}
                    </div>
                </Show>
            </div>
            <div style={{
                color: "#888",
                "font-size": "12px",
                "margin-bottom": "auto", // Push the bottom margin into the flex centering
                "padding-bottom": "20px",
                "text-align": "center",
                "max-width": "80%",
                "font-style": "italic"
            }}>
                Screen not updating? Try minimizing this window so that both the IDE window and this window are visible.
            </div>
        </>
    );
};

render(() => <App />, document.getElementById("gui-root")!);
