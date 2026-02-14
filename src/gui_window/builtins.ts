import type { BuiltinFunc } from "../vm/builtins";
import { perc_nil, perc_number, perc_string, perc_map, perc_bool, perc_list, perc_err, perc_type } from "../vm/perc_types";
import { GUIManager } from "./manager";

export const createGuiBuiltins = (gui: GUIManager): Record<string, BuiltinFunc> => {
    // --- State management ---
    let fillStack = [{ r: 0, g: 0, b: 0, a: 1 }];
    let strokeStack = [{ r: 0, g: 0, b: 0, a: 1, width: 1 }];
    let matrixStack = [[1, 0, 0, 1, 0, 0]]; // a, b, c, d, e, f (identity)

    const multiplyMatrices = (m1: number[], m2: number[]) => {
        const [a1, b1, c1, d1, e1, f1] = m1;
        const [a2, b2, c2, d2, e2, f2] = m2;
        return [
            a1 * a2 + c1 * b2,
            b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2,
            b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1,
            b1 * e2 + d1 * f2 + f1
        ];
    };

    const getSnapshot = () => ({
        fill: fillStack[fillStack.length - 1],
        stroke: strokeStack[strokeStack.length - 1],
        matrix: matrixStack[matrixStack.length - 1]
    });

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
        'window': () => {
            gui.openWindow();
            gui.clearCommands();
            fillStack = [{ r: 0, g: 0, b: 0, a: 1 }];
            strokeStack = [{ r: 0, g: 0, b: 0, a: 1, width: 1 }];
            matrixStack = [[1, 0, 0, 1, 0, 0]];
            return new perc_nil();
        },

        'end_window': () => {
            gui.flushCommands();
            return new perc_nil();
        },

        'button': (text, x, y) => {
            const err = validateGUIArgs('button', [text, x, y], ['string', 'number', 'number']);
            if (err) return err;
            const id = `btn_${text.to_string()}_${x.to_string()}_${y.to_string()}`;
            gui.pushCommand('button', { id, text: text.to_string(), x: (x as any).buffer[0], y: (y as any).buffer[0], ...getSnapshot() });
            return new perc_bool(gui.isClicked(id));
        },

        'fill': (color) => {
            const err = validateGUIArgs('fill', [color], ['color']);
            if (err) return err;

            if (!(color instanceof perc_map)) return new perc_err("fill: invalid color map");

            const rVal = color.get(new perc_string('r'));
            const gVal = color.get(new perc_string('g'));
            const bVal = color.get(new perc_string('b'));
            const aVal = color.get(new perc_string('a'));

            if (!(rVal instanceof perc_number) || !(gVal instanceof perc_number) || !(bVal instanceof perc_number)) {
                return new perc_err("fill: color map must contain r, g, b numbers");
            }

            const r = (rVal as any).buffer[0];
            const g = (gVal as any).buffer[0];
            const b = (bVal as any).buffer[0];
            const a = (aVal instanceof perc_number) ? (aVal as any).buffer[0] : 1;

            fillStack[fillStack.length - 1] = { r, g, b, a };
            return new perc_nil();
        },

        'stroke': (color, width) => {
            const err = validateGUIArgs('stroke', [color, width], ['color', 'number?']);
            if (err) return err;

            if (!(color instanceof perc_map)) return new perc_err("stroke: invalid color map");

            const rVal = color.get(new perc_string('r'));
            const gVal = color.get(new perc_string('g'));
            const bVal = color.get(new perc_string('b'));
            const aVal = color.get(new perc_string('a'));

            if (!(rVal instanceof perc_number) || !(gVal instanceof perc_number) || !(bVal instanceof perc_number)) {
                return new perc_err("stroke: color map must contain r, g, b numbers");
            }

            const r = (rVal as any).buffer[0];
            const g = (gVal as any).buffer[0];
            const b = (bVal as any).buffer[0];
            const a = (aVal instanceof perc_number) ? (aVal as any).buffer[0] : 1;

            const w = (width instanceof perc_number) ? (width as any).buffer[0] : 1;
            strokeStack[strokeStack.length - 1] = { r, g, b, a, width: w };
            return new perc_nil();
        },

        'rect': (x, y, w, h) => {
            const err = validateGUIArgs('rect', [x, y, w, h], ['number', 'number', 'number', 'number']);
            if (err) return err;
            gui.pushCommand('rect', {
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                w: (w as any).buffer[0],
                h: (h as any).buffer[0],
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'circle': (x, y, r) => {
            const err = validateGUIArgs('circle', [x, y, r], ['number', 'number', 'number']);
            if (err) return err;
            gui.pushCommand('circle', {
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                r: (r as any).buffer[0],
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'line': (x1, y1, x2, y2) => {
            const err = validateGUIArgs('line', [x1, y1, x2, y2], ['number', 'number', 'number', 'number']);
            if (err) return err;
            gui.pushCommand('line', {
                x1: (x1 as any).buffer[0],
                y1: (y1 as any).buffer[0],
                x2: (x2 as any).buffer[0],
                y2: (y2 as any).buffer[0],
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'text': (text, x, y, align) => {
            const err = validateGUIArgs('text', [text, x, y, align], ['string', 'number', 'number', 'string?']);
            if (err) return err;
            const alignment = align instanceof perc_string ? align.to_string() : 'left';
            gui.pushCommand('text', {
                text: text.to_string(),
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                align: alignment,
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'slider': (x, y) => {
            const err = validateGUIArgs('slider', [x, y], ['number', 'number']);
            if (err) return err;
            const id = `slider_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
            const currentVal = gui.getInput(id + '_val') || 0;
            gui.pushCommand('slider', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val: currentVal, ...getSnapshot() });
            return new perc_number(currentVal);
        },

        'translate': (x, y) => {
            const err = validateGUIArgs('translate', [x, y], ['number', 'number']);
            if (err) return err;
            const tx = (x as any).buffer[0];
            const ty = (y as any).buffer[0];
            matrixStack[matrixStack.length - 1] = multiplyMatrices(matrixStack[matrixStack.length - 1], [1, 0, 0, 1, tx, ty]);
            return new perc_nil();
        },

        'scale': (x, y) => {
            const err = validateGUIArgs('scale', [x, y], ['number', 'number']);
            if (err) return err;
            const sx = (x as any).buffer[0];
            const sy = (y as any).buffer[0];
            matrixStack[matrixStack.length - 1] = multiplyMatrices(matrixStack[matrixStack.length - 1], [sx, 0, 0, sy, 0, 0]);
            return new perc_nil();
        },

        'rotate': (angle) => {
            const err = validateGUIArgs('rotate', [angle], ['number']);
            if (err) return err;
            const a = (angle as any).buffer[0];
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            matrixStack[matrixStack.length - 1] = multiplyMatrices(matrixStack[matrixStack.length - 1], [cos, sin, -sin, cos, 0, 0]);
            return new perc_nil();
        },

        'group': () => {
            fillStack.push({ ...fillStack[fillStack.length - 1] });
            strokeStack.push({ ...strokeStack[strokeStack.length - 1] });
            matrixStack.push([...matrixStack[matrixStack.length - 1]]);
            return new perc_nil();
        },

        'end_group': () => {
            if (fillStack.length > 1) fillStack.pop();
            if (strokeStack.length > 1) strokeStack.pop();
            if (matrixStack.length > 1) matrixStack.pop();
            return new perc_nil();
        },

        'image': (x, y, w, h, url) => {
            const err = validateGUIArgs('image', [x, y, w, h, url], ['number', 'number', 'number', 'number', 'string']);
            if (err) return err;
            gui.pushCommand('image', {
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                w: (w as any).buffer[0],
                h: (h as any).buffer[0],
                url: url.to_string(),
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'sprite': (x, y, w, h, data) => {
            const err = validateGUIArgs('sprite', [x, y, w, h, data], ['number', 'number', 'number', 'number', 'array']);
            if (err) return err;
            const pixels: any[] = [];
            if (data instanceof perc_list) {
                let idx = 0;
                for (const pixel of data.elements) {
                    if (!(pixel instanceof perc_map)) {
                        return new perc_err(`sprite: pixel at index ${idx} is not a color map`);
                    }

                    const rVal = pixel.get(new perc_string('r'));
                    const gVal = pixel.get(new perc_string('g'));
                    const bVal = pixel.get(new perc_string('b'));
                    const aVal = pixel.get(new perc_string('a'));

                    if (!(rVal instanceof perc_number) || !(gVal instanceof perc_number) || !(bVal instanceof perc_number)) {
                        return new perc_err(`sprite: pixel at index ${idx} missing valid r, g, b components`);
                    }

                    pixels.push({
                        r: (rVal as any).buffer[0],
                        g: (gVal as any).buffer[0],
                        b: (bVal as any).buffer[0],
                        a: (aVal instanceof perc_number) ? (aVal as any).buffer[0] : 1
                    });
                    idx++;
                }
            }
            gui.pushCommand('sprite', {
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                w: (w as any).buffer[0],
                h: (h as any).buffer[0],
                data: pixels,
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'polygon': (x, y, points) => {
            const err = validateGUIArgs('polygon', [x, y, points], ['number', 'number', 'array']);
            if (err) return err;
            const pts: { x: number, y: number }[] = [];
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
            gui.pushCommand('polygon', { x: (x as any).buffer[0], y: (y as any).buffer[0], points: pts, ...getSnapshot() });
            return new perc_nil();
        },

        'update_image': (x, y, w, h, url) => {
            const err = validateGUIArgs('update_image', [x, y, w, h, url], ['number', 'number', 'number', 'number', 'string']);
            if (err) return err;
            gui.pushCommand('update_image', {
                x: (x as any).buffer[0],
                y: (y as any).buffer[0],
                w: (w as any).buffer[0],
                h: (h as any).buffer[0],
                url: url.to_string(),
                ...getSnapshot()
            });
            return new perc_nil();
        },

        'textbox': (x, y) => {
            const err = validateGUIArgs('textbox', [x, y], ['number', 'number']);
            if (err) return err;
            const id = `textbox_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
            const val = gui.getInput(id + '_val') || "";
            gui.pushCommand('textbox', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], ...getSnapshot() });
            return new perc_string(val);
        },

        'checkbox': (x, y) => {
            const err = validateGUIArgs('checkbox', [x, y], ['number', 'number']);
            if (err) return err;
            const id = `chk_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
            const val = gui.getInput(id + '_val') || false;
            gui.pushCommand('checkbox', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val, ...getSnapshot() });
            return new perc_bool(val);
        },

        'radio': (group, x, y) => {
            const err = validateGUIArgs('radio', [group, x, y], ['string', 'number', 'number']);
            if (err) return err;
            const groupName = group.to_string();
            const id = `rad_${groupName}_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
            const val = gui.getInput(id + '_val') || false;

            if (gui.isClicked(id)) {
                const allInputs = gui.getAllInputs();
                for (const key in allInputs) {
                    if (key.startsWith(`rad_${groupName}_`) && key.endsWith('_val') && key !== id + '_val') {
                        gui.setInput(key, false);
                    }
                }
            }
            gui.pushCommand('radio', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val, ...getSnapshot() });
            return new perc_bool(val);
        }
    };
};
