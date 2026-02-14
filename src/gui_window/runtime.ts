import {
    init,
    classModule,
    propsModule,
    styleModule,
    eventListenersModule,
    h,
    toVNode,
    attributesModule,
} from "snabbdom";
import type { VNode } from "snabbdom";

interface GUICommand {
    type: string;
    args: any;
    // We expect args to contain:
    // x, y, w, h, r, etc.
    // matrix: [a, b, c, d, e, f]
    // fill: { r, g, b, a }
    // stroke: { r, g, b, a, width }
    // text, id, etc.
}

const patch = init([
    classModule,
    propsModule,
    styleModule,
    eventListenersModule,
    attributesModule,
]);

class GUIRuntime {
    private container: HTMLElement;
    private oldVNode: VNode;
    private inputState: Record<string, any> = {};

    constructor() {
        this.container = document.getElementById("gui-root")!;
        this.oldVNode = toVNode(this.container);

        // Global Input Listeners (for generic mouse tracking)
        window.addEventListener("mousemove", (e) => this.handleGlobalMouse(e));
        window.addEventListener("mousedown", () => {
            this.inputState["mouse_down"] = true;
            this.syncInput();
        });
        window.addEventListener("mouseup", () => {
            this.inputState["mouse_down"] = false;
            this.syncInput();
        });

        // Communication with Main Window
        window.addEventListener("message", (event) => {
            if (event.data && event.data.type === "render_batch") {
                if (event.data.state) {
                    for (const key in event.data.state) {
                        this.inputState[key] = event.data.state[key];
                    }
                }
                this.render(event.data.batch);
            }
        });

        // Initial Render
        this.render([]);
    }

    private handleGlobalMouse(e: MouseEvent) {
        const rect = this.container.getBoundingClientRect();
        this.inputState["mouse_x"] = e.clientX - rect.left;
        this.inputState["mouse_y"] = e.clientY - rect.top;
        this.syncInput();
    }

    private syncInput() {
        if (window.opener) {
            window.opener.postMessage(
                { type: "input_update", state: this.inputState },
                "*"
            );
        }
    }

    private toCSSColor(c: { r: number; g: number; b: number; a?: number }) {
        const a = c.a !== undefined ? c.a : 1;
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    }

    private toCSSMatrix(m: number[]) {
        return `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4]}, ${m[5]})`;
    }

    private render(batch: GUICommand[]) {
        const children: VNode[] = batch.map((cmd, index) => {
            const args = cmd.args;
            const style: Record<string, string> = {
                position: "absolute",
                transform: this.toCSSMatrix(args.matrix || [1, 0, 0, 1, 0, 0]),
                transformOrigin: "top left", // Important for our matrix coord system
            };

            // Common props
            const fill = args.fill ? this.toCSSColor(args.fill) : "black";
            const stroke = args.stroke ? this.toCSSColor(args.stroke) : "transparent";
            const strokeWidth = args.stroke?.width || 1;

            switch (cmd.type) {
                case "rect":
                    return h("div", {
                        key: index,
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: args.w + "px",
                            height: args.h + "px",
                            backgroundColor: fill,
                            // If stroke is needed for rect, use border?
                            // Canvas 'stroke' centers on the line. Border is inside or outside. 
                            // Let's use SVG for vector accuracy (as requested).
                            // BUT 'rect' in CSS is very efficiently handled by div.
                            // User asked: "turn each of the vector drawing mechanisms into an SVG"
                            // So let's use SVG.
                        },
                    }, [
                        h("svg", {
                            attrs: {
                                width: "100%",
                                height: "100%",
                                viewBox: `0 0 ${args.w} ${args.h}`,
                                preserveAspectRatio: "none", // stretch to fill div
                            },
                            style: {
                                overflow: "visible",
                                pointerEvents: "none"
                            }
                        }, [
                            h("rect", {
                                attrs: {
                                    x: 0,
                                    y: 0,
                                    width: args.w,
                                    height: args.h,
                                    fill: fill,
                                    stroke: stroke,
                                    "stroke-width": strokeWidth,
                                }
                            })
                        ])
                    ]);

                case "circle":
                    // Circle bounding box is x-r, y-r, w=2r, h=2r
                    // Args from canvas: x, y (center), r (radius)
                    // We need to position the SVG at top-left of bounding box
                    const cx = args.x;
                    const cy = args.y;
                    const r = args.r;
                    return h("div", {
                        key: index,
                        style: {
                            ...style,
                            left: (cx - r) + "px",
                            top: (cy - r) + "px",
                            width: (r * 2) + "px",
                            height: (r * 2) + "px",
                        }
                    }, [
                        h("svg", {
                            attrs: { width: "100%", height: "100%" },
                            style: { overflow: "visible", pointerEvents: "none" }
                        }, [
                            h("circle", {
                                attrs: {
                                    cx: r,
                                    cy: r,
                                    r: r,
                                    fill: fill,
                                    stroke: stroke,
                                    "stroke-width": strokeWidth
                                }
                            })
                        ])
                    ]);

                case "line":
                    // Line is tricky with bounding box. Let's just make a specialized SVG at 0,0 of the container?
                    // No, that breaks interleaving.
                    // We can make an SVG that covers the bounding box of the line?
                    // Or just an SVG at x1,y1? 
                    // Let's use an SVG at 0,0 of the transform group (handled by parent style matrix/pos)
                    // But line coordinates are often global or relative to transform.
                    // cmd.args usually has transformed coordinates? No, args are raw, matrix is separate.
                    // So we draw line from (x1,y1) to (x2,y2) inside an SVG that is positioned at 0,0?
                    // If we position SVG at 0,0, it might be huge.
                    // Better: calculate bounding box.
                    const minX = Math.min(args.x1, args.x2) - strokeWidth;
                    const minY = Math.min(args.y1, args.y2) - strokeWidth;
                    const maxX = Math.max(args.x1, args.x2) + strokeWidth;
                    const maxY = Math.max(args.y1, args.y2) + strokeWidth;
                    const lw = maxX - minX;
                    const lh = maxY - minY;

                    return h("div", {
                        key: index,
                        style: {
                            ...style,
                            left: minX + "px",
                            top: minY + "px",
                            width: lw + "px",
                            height: lh + "px",
                        }
                    }, [
                        h("svg", {
                            attrs: { width: "100%", height: "100%" },
                            style: { overflow: "visible", pointerEvents: "none" }
                        }, [
                            h("line", {
                                attrs: {
                                    x1: args.x1 - minX,
                                    y1: args.y1 - minY,
                                    x2: args.x2 - minX,
                                    y2: args.y2 - minY,
                                    stroke: stroke,
                                    "stroke-width": strokeWidth,
                                    "stroke-linecap": "round"
                                }
                            })
                        ])
                    ]);

                case "polygon":
                    // Bounding box again
                    if (!args.points || args.points.length === 0) return h("div");
                    const xs = args.points.map((p: any) => p.x);
                    const ys = args.points.map((p: any) => p.y);
                    const pMinX = Math.min(...xs);
                    const pMinY = Math.min(...ys);
                    const pMaxX = Math.max(...xs);
                    const pMaxY = Math.max(...ys);
                    const pw = pMaxX - pMinX;
                    const ph = pMaxY - pMinY;

                    const pts = args.points.map((p: any) => `${p.x - pMinX},${p.y - pMinY}`).join(" ");

                    // Polygon is usually drawn relative to args.x/args.y?
                    // Canvas: moveTo(x + p.x, y + p.y)
                    // So origin is args.x, args.y
                    // We need to shift everything by args.x, args.y

                    const polyLeft = args.x + pMinX;
                    const polyTop = args.y + pMinY;

                    return h("div", {
                        key: index,
                        style: {
                            ...style,
                            left: polyLeft + "px",
                            top: polyTop + "px",
                            width: pw + "px",
                            height: ph + "px",
                        }
                    }, [
                        h("svg", {
                            attrs: { width: "100%", height: "100%" },
                            style: { overflow: "visible", pointerEvents: "none" }

                        }, [
                            h("polygon", {
                                attrs: {
                                    points: pts,
                                    fill: fill,
                                    stroke: stroke,
                                    "stroke-width": strokeWidth
                                }
                            })
                        ])
                    ]);

                case "text":
                    return h("div", {
                        key: index,
                        style: {
                            ...style, // Matrix handles position? args.x/y usually separate.
                            // Canvas text is at x,y. Matrix applies.
                            // We position div at x,y.
                            left: args.x + "px",
                            top: args.y + "px",
                            font: "14px sans-serif",
                            whiteSpace: "pre",
                            color: fill, // Text fill is color
                            textAlign: args.align || "left",
                            // Canvas alignment is relative to anchor. 
                            // transform: translate(-50%) for center?
                            transform: `${style.transform} translate(${args.align === 'center' ? '-50%' : args.align === 'right' ? '-100%' : '0'}, 0)`
                        }
                    }, args.text);

                case "image":
                    return h("img", {
                        key: index,
                        attrs: { src: args.url },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: args.w + "px",
                            height: args.h + "px",
                            imageRendering: "pixelated"
                        }
                    });

                case "sprite":
                    // Generate Data URL for sprite (cached?) 
                    // To avoid continuous generation, we might need memoization or cache based on content ref?
                    // Content is passed as array. Hashing it is expensive.
                    // But usually sprites are static data structures in user code?
                    // For now, generate basic canvas -> data url.
                    const dataUrl = this.generateSpriteDataUrl(args.data, args.w, args.h);
                    return h("img", {
                        key: index,
                        attrs: { src: dataUrl },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: args.w + "px", // Scaled width?
                            height: args.h + "px",
                            imageRendering: "pixelated"
                            // Wait, sprite args.w/h are pixel dimensions or display dimensions?
                            // In builtins: 'sprite', { x, y, w, h, data }
                            // Usually w/h are loop bounds.
                            // The display size is determined by 'pixel' size which is 1x1 drawn?
                            // In canvas, we drew 1x1 rects at x+px, y+py.
                            // So the sprite is w x h pixels in size.
                            // If we use an img, we set its intrinsic size to w x h.
                            // And let CSS scale it if matrix has scale.
                        }
                    });

                // --- Widgets ---
                // ID should be used as key for React-like preservation

                case "button":
                    return h("button", {
                        key: args.id,
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: "100px", // fixed size from valid code
                            height: "30px",
                            backgroundColor: "#eee", // Default
                            border: `1px solid ${stroke}`,
                            color: stroke, // Text color
                            cursor: "pointer"
                        },
                        on: {
                            click: () => {
                                this.inputState[args.id + "_clicked"] = true;
                                this.syncInput();
                                setTimeout(() => {
                                    this.inputState[args.id + "_clicked"] = false;
                                    this.syncInput();
                                }, 100);
                            }
                        }
                    }, args.text);

                case "slider":
                    return h("input", {
                        key: args.id,
                        props: {
                            type: "range",
                            min: 0,
                            max: 100,
                            value: args.val
                        },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: "200px",
                            margin: "0",
                            accentColor: fill // Modern CSS for slider color
                        },
                        on: {
                            input: (e: any) => {
                                this.inputState[args.id + "_val"] = parseFloat(e.target.value);
                                this.syncInput();
                            }
                        }
                    });

                case "checkbox":
                    // Checkbox custom styling is hard with native <input type=checkbox>
                    // But we can wrap it or use accent-color.
                    return h("input", {
                        key: args.id,
                        props: {
                            type: "checkbox",
                            checked: args.val
                        },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: "20px",
                            height: "20px",
                            margin: "0",
                            accentColor: fill
                        },
                        on: {
                            change: (e: any) => {
                                this.inputState[args.id + "_val"] = e.target.checked;
                                this.syncInput();
                            }
                        }
                    });

                case "radio":
                    return h("input", {
                        key: args.id,
                        props: {
                            type: "radio",
                            checked: args.val,
                            // name: args.group? // We don't have group name in args sadly?
                            // Wait, builtins.radio passes 'radio' command.
                            // Let's check builtins.ts
                            // builtins.radio calls gui.pushCommand('radio', { id... val })
                            // It computes mutual exclusion itself!
                            // So we don't strictly need 'name' prop for logic, just visual.
                            // But snabbdom checked prop triggers update.
                        },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            margin: "0",
                            accentColor: fill
                        },
                        on: {
                            change: (e: any) => {
                                // Only trigger if checked (radio logic)
                                if (e.target.checked) {
                                    this.inputState[args.id + "_val"] = true;
                                    // We also need to set others to false? 
                                    // The builtin 'radio' function handles unsetting others based on click detection.
                                    // Here we set this one to true.
                                    // The backend (vm) re-runs builtin, logic sees click, clears others.
                                    // We need to set 'clicked' too?
                                    this.inputState[args.id + "_clicked"] = true;
                                    this.syncInput();
                                    setTimeout(() => {
                                        this.inputState[args.id + "_clicked"] = false;
                                        this.syncInput();
                                    }, 100);
                                }
                            }
                        }
                    });

                case "textbox":
                    return h("input", {
                        key: args.id,
                        props: {
                            type: "text",
                            value: this.inputState[args.id + "_val"] !== undefined ? this.inputState[args.id + "_val"] : ""
                        },
                        style: {
                            ...style,
                            left: args.x + "px",
                            top: args.y + "px",
                            width: "200px",
                            height: "30px",
                            border: `1px solid ${this.inputState["focused_textbox"] === args.id ? "blue" : "black"}`
                        },
                        on: {
                            input: (e: any) => {
                                this.inputState[args.id + "_val"] = e.target.value;
                                this.syncInput();
                            },
                            focus: () => {
                                this.inputState["focused_textbox"] = args.id;
                                this.syncInput();
                            },
                            blur: () => {
                                if (this.inputState["focused_textbox"] === args.id) {
                                    this.inputState["focused_textbox"] = null;
                                    this.syncInput();
                                }
                            }
                        }
                    });

                default:
                    return h("div", { key: index });
            }
        });

        const vnode = h("div#gui-root", {
            style: {
                width: "640px",
                height: "480px",
                position: "relative",
                background: "white", // Default canvas bg
                overflow: "hidden"
            }
        }, children);

        patch(this.oldVNode, vnode);
        this.oldVNode = vnode;
    }

    private generateSpriteDataUrl(pixels: any[], w: number, h: number): string {
        // Simple caching strategy: if pixels === lastPixels, return lastUrl?
        // JS arrays allow object identity check if the VM passes the same reference.
        // The VM creates new arrays every time? 'new [...]' creates new array.
        // So identity check fails.
        // Minimal approach: just draw to offscreen canvas.

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
        return canvas.toDataURL();
    }
}

new GUIRuntime();
