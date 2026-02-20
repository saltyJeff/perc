import type { BuiltinFunc } from "../vm/builtins";
import { perc_nil, perc_number, perc_string, perc_map, perc_bool, perc_list, perc_err, perc_type } from "../vm/perc_types";
import type { Color, GUIElements, Position } from "./gui_cmds";
import { GUIManager } from "./manager";

function percColorToColor(color: perc_type): Color {
    console.assert(color instanceof perc_map);
    const r = color.get(new perc_string('r'));
    const g = color.get(new perc_string('g'));
    const b = color.get(new perc_string('b'));
    const a = color.get(new perc_string('a'));
    return { r: (r as any).buffer[0], g: (g as any).buffer[0], b: (b as any).buffer[0], a: (a as any).buffer[0] };
}


export const createGuiBuiltins = (gui: GUIManager): Record<string, BuiltinFunc> => {
    const spriteConversionCache = new WeakMap<perc_list, Color[]>();
    let commandList: GUIElements[] = [];
    function pushCmd(cmd: GUIElements) {
        commandList.push(cmd);
    }

    // Type validation helper
    function validateGUIArgs(funcName: string, args: (perc_type | undefined)[], expected: string[]): perc_err | undefined {
        for (let i = 0; i < expected.length; i++) {
            const exp = expected[i];
            const isOptional = exp.endsWith('?');
            const baseType = isOptional ? exp.slice(0, -1) : exp;
            const arg = args[i];

            if (arg === undefined || arg instanceof perc_nil) {
                if (isOptional) continue;
                return new perc_err(`${funcName}() expects at least ${expected.filter(e => !e.endsWith('?')).length} arguments, but argument ${i + 1} is missing`);
            }

            if (baseType === 'number' && !(arg instanceof perc_number)) {
                return new perc_err(`${funcName}() argument ${i + 1} must be a number, got ${(arg as any).type || (arg as any).constructor.name}`);
            } else if (baseType === 'string' && !(arg instanceof perc_string)) {
                return new perc_err(`${funcName}() argument ${i + 1} must be a string, got ${(arg as any).type || (arg as any).constructor.name}`);
            } else if (baseType === 'color' && !(arg instanceof perc_map)) {
                return new perc_err(`${funcName}() argument ${i + 1} must be a color (rgb/hsl), got ${(arg as any).type || (arg as any).constructor.name}`);
            } else if (baseType === 'array' && !(arg instanceof perc_list)) {
                return new perc_err(`${funcName}() argument ${i + 1} must be an array, got ${(arg as any).type || (arg as any).constructor.name}`);
            }
        }
        return undefined;
    }

    return {
        'window': (width, height) => {
            const err = validateGUIArgs('window', [width, height], ['number?', 'number?']);
            if (err) return err;

            commandList = [];

            const w = width instanceof perc_number ? (width as any).buffer[0] : 640;
            const h = height instanceof perc_number ? (height as any).buffer[0] : 480;

            const success = gui.openWindow(w, h);
            if (!success) {
                return new perc_err("Window was closed");
            }
            return new perc_nil();
        },

        'end_window': () => {
            gui.sendWindowUpdate(commandList);
            return new perc_nil();
        },

        'button': (text, x, y) => {
            const err = validateGUIArgs('button', [text, x, y], ['string', 'number', 'number']);
            if (err) return err;
            const textStr = text.to_string();
            const xVal = (x as any).buffer[0];
            const yVal = (y as any).buffer[0];
            const id = `btn_${textStr}_${xVal}_${yVal}`;

            pushCmd({
                type: 'button',
                id,
                text: textStr,
                pos: { x: xVal, y: yVal }
            });
            return new perc_bool(gui.isClicked(id));
        },

        'fill': (color) => {
            const err = validateGUIArgs('fill', [color], ['color']);
            if (err) return err;
            pushCmd({
                type: 'fill',
                fill: percColorToColor(color)
            });
            return new perc_nil();
        },

        'stroke': (color, width) => {
            const err = validateGUIArgs('stroke', [color, width], ['color', 'number?']);
            if (err) return err;
            const cmd: any = {
                type: 'stroke',
                stroke: percColorToColor(color)
            };
            if (width) {
                cmd.strokeWidth = (width as any).buffer[0];
            }
            pushCmd(cmd);
            return new perc_nil();
        },

        'rect': (x, y, w, h) => {
            const err = validateGUIArgs('rect', [x, y, w, h], ['number', 'number', 'number', 'number']);
            if (err) return err;
            pushCmd({
                type: 'rect',
                pos: { x: (x as any).buffer[0], y: (y as any).buffer[0] },
                width: (w as any).buffer[0],
                height: (h as any).buffer[0]
            });
            return new perc_nil();
        },

        'circle': (x, y, r) => {
            const err = validateGUIArgs('circle', [x, y, r], ['number', 'number', 'number']);
            if (err) return err;
            pushCmd({
                type: 'circle',
                pos: { x: (x as any).buffer[0], y: (y as any).buffer[0] },
                radius: (r as any).buffer[0]
            });
            return new perc_nil();
        },

        'line': (x1, y1, x2, y2) => {
            const err = validateGUIArgs('line', [x1, y1, x2, y2], ['number', 'number', 'number', 'number']);
            if (err) return err;
            pushCmd({
                type: 'line',
                p1: { x: (x1 as any).buffer[0], y: (y1 as any).buffer[0] },
                p2: { x: (x2 as any).buffer[0], y: (y2 as any).buffer[0] }
            });
            return new perc_nil();
        },

        'text': (text, x, y, align) => {
            const err = validateGUIArgs('text', [text, x, y, align], ['string', 'number', 'number', 'string?']);
            if (err) return err;
            pushCmd({
                type: 'text',
                text: text.to_string(),
                pos: { x: (x as any).buffer[0], y: (y as any).buffer[0] },
                align: align instanceof perc_string ? align.to_string() : 'left'
            });
            return new perc_nil();
        },

        'slider': (x, y, label) => {
            const err = validateGUIArgs('slider', [x, y, label], ['number', 'number', 'string?']);
            if (err) return err;
            const xVal = (x as any).buffer[0];
            const yVal = (y as any).buffer[0];
            const labelStr = label instanceof perc_string ? label.to_string() : undefined;
            const id = `slider_${xVal}_${yVal}`;
            const currentVal = gui.getInput(id + '_val') || 0;

            pushCmd({
                type: 'slider',
                id,
                pos: { x: xVal, y: yVal },
                width: 200,
                height: 20,
                label: labelStr,
                val: currentVal as number
            });
            return new perc_number(currentVal);
        },

        'translate': (x, y) => {
            const err = validateGUIArgs('translate', [x, y], ['number', 'number']);
            if (err) return err;
            const tx = (x as any).buffer[0];
            const ty = (y as any).buffer[0];

            // Standard translation matrix
            const mat = [
                1, 0, tx,
                0, 1, ty,
                0, 0, 1
            ] as [number, number, number, number, number, number, number, number, number];

            pushCmd({
                type: 'transform',
                transform: mat
            });
            return new perc_nil();
        },

        'scale': (x, y) => {
            const err = validateGUIArgs('scale', [x, y], ['number', 'number']);
            if (err) return err;
            const sx = (x as any).buffer[0];
            const sy = (y as any).buffer[0];

            const mat = [
                sx, 0, 0,
                0, sy, 0,
                0, 0, 1
            ] as [number, number, number, number, number, number, number, number, number];

            pushCmd({
                type: 'transform',
                transform: mat
            });
            return new perc_nil();
        },

        'rotate': (angle) => {
            const err = validateGUIArgs('rotate', [angle], ['number']);
            if (err) return err;
            const a = (angle as any).buffer[0];
            const cos = Math.cos(a);
            const sin = Math.sin(a);

            const mat = [
                cos, -sin, 0,
                sin, cos, 0,
                0, 0, 1
            ] as [number, number, number, number, number, number, number, number, number];

            pushCmd({
                type: 'transform',
                transform: mat
            });
            return new perc_nil();
        },

        'group': () => {
            pushCmd({ type: 'group' });
            return new perc_nil();
        },

        'end_group': () => {
            pushCmd({ type: 'end_group' });
            return new perc_nil();
        },

        'image': (x, y, w, h, url) => {
            const err = validateGUIArgs('image', [x, y, w, h, url], ['number', 'number', 'number', 'number', 'string']);
            if (err) return err;
            pushCmd({
                type: 'image',
                pos: { x: (x as any).buffer[0], y: (y as any).buffer[0] },
                width: (w as any).buffer[0],
                height: (h as any).buffer[0],
                src: url.to_string()
            });
            return new perc_nil();
        },

        'sprite': (x, y, w, h, data) => {
            const err = validateGUIArgs('sprite', [x, y, w, h, data], ['number', 'number', 'number', 'number', 'array']);
            if (err) return err;

            let pixels: Color[] = [];
            if (data instanceof perc_list) {
                // Check cache first
                const cached = spriteConversionCache.get(data);
                if (cached) {
                    pixels = cached;
                } else {
                    for (const pixel of data.elements) {
                        if (!(pixel instanceof perc_map)) {
                            return new perc_err(`sprite: pixel data contains non-color value`);
                        }

                        const rVal = pixel.get(new perc_string('r'));
                        const gVal = pixel.get(new perc_string('g'));
                        const bVal = pixel.get(new perc_string('b'));
                        const aVal = pixel.get(new perc_string('a'));

                        pixels.push({
                            r: (rVal instanceof perc_number) ? (rVal as any).buffer[0] : 0,
                            g: (gVal instanceof perc_number) ? (gVal as any).buffer[0] : 0,
                            b: (bVal instanceof perc_number) ? (bVal as any).buffer[0] : 0,
                            a: (aVal instanceof perc_number) ? (aVal as any).buffer[0] : 1
                        });
                    }
                    // Cache the result for this perc_list instance
                    spriteConversionCache.set(data, pixels);
                }
            }
            pushCmd({
                type: 'sprite',
                pos: { x: (x as any).buffer[0], y: (y as any).buffer[0] },
                width: (w as any).buffer[0],
                height: (h as any).buffer[0],
                data: pixels
            });
            return new perc_nil();
        },

        'polygon': (x, y, points) => {
            const err = validateGUIArgs('polygon', [x, y, points], ['number', 'number', 'array']);
            if (err) return err;
            const pts: Position[] = [];
            if (points instanceof perc_list) {
                for (const p of points.elements) {
                    if (p instanceof perc_map) {
                        pts.push({
                            x: (p.get(new perc_string('x')) as any).buffer[0],
                            y: (p.get(new perc_string('y')) as any).buffer[0]
                        });
                    }
                }
            }

            const originX = (x as any).buffer[0];
            const originY = (y as any).buffer[0];
            const adjustedPts = pts.map(p => ({ x: p.x + originX, y: p.y + originY }));

            pushCmd({
                type: 'polygon',
                pos: adjustedPts
            });
            return new perc_nil();
        },

        'textbox': (x, y, prompt) => {
            const err = validateGUIArgs('textbox', [x, y, prompt], ['number', 'number', 'string?']);
            if (err) return err;
            const xVal = (x as any).buffer[0];
            const yVal = (y as any).buffer[0];
            const promptStr = prompt instanceof perc_string ? prompt.to_string() : "";
            const id = `textbox_${xVal}_${yVal}`;
            const val = gui.getInput(id + '_val') || "";

            pushCmd({
                type: 'textbox',
                id,
                pos: { x: xVal, y: yVal },
                width: 150,
                height: 25,
                prompt: promptStr,
                val: val as string
            });
            return new perc_string(val);
        },

        'checkbox': (x, y, label) => {
            const err = validateGUIArgs('checkbox', [x, y, label], ['number', 'number', 'string?']);
            if (err) return err;
            const xVal = (x as any).buffer[0];
            const yVal = (y as any).buffer[0];
            const labelStr = label instanceof perc_string ? label.to_string() : undefined;
            const id = `chk_${xVal}_${yVal}`;
            const val = gui.getInput(id + '_val') || false;

            pushCmd({
                type: 'checkbox',
                id,
                pos: { x: xVal, y: yVal },
                label: labelStr,
                val: val as boolean
            });
            return new perc_bool(val);
        },

        'radio': (group, x, y, label) => {
            const err = validateGUIArgs('radio', [group, x, y, label], ['string', 'number', 'number', 'string?']);
            if (err) return err;
            const groupName = group.to_string();
            const xVal = (x as any).buffer[0];
            const yVal = (y as any).buffer[0];
            const labelStr = label instanceof perc_string ? label.to_string() : undefined;
            const id = `rad_${groupName}_${xVal}_${yVal}`;
            const val = gui.getInput(id + '_val') || false;

            if (gui.isClicked(id)) {
                const allInputs = gui.getAllInputs();
                for (const key in allInputs) {
                    if (key.startsWith(`rad_${groupName}_`) && key.endsWith('_val') && key !== id + '_val') {
                        gui.setInput(key, false);
                    }
                }
            }

            pushCmd({
                type: 'radio',
                id,
                group: groupName,
                pos: { x: xVal, y: yVal },
                label: labelStr,
                val: val as boolean
            });
            return new perc_bool(val);
        }
    };
};
