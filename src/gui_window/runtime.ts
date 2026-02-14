interface GUICommand {
    type: string;
    args: any;
}


class GUIRuntime {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private inputState: Record<string, any> = {};

    constructor() {
        this.canvas = document.getElementById('gui-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        // Use nearest-neighbor scaling (pixelated) instead of bilinear
        this.ctx.imageSmoothingEnabled = false;

        // Input handling
        this.canvas.addEventListener('mousedown', (e) => this.handleMouse(e, true));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouse(e, false));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouse(e, null));

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'render_batch') {
                if (event.data.state) {
                    // Update local state from authoritative main window state
                    // We only update keys that exist in the main state to avoid losing local-only transient state
                    for (const key in event.data.state) {
                        this.inputState[key] = event.data.state[key];
                    }
                }
                this.render(event.data.batch);
            }
        });

        // Keyboard events for textbox input
        window.addEventListener('keydown', (e) => {
            const focusedId = this.inputState['focused_textbox'];
            if (focusedId) {
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    const val = this.inputState[focusedId + '_val'] || "";
                    this.inputState[focusedId + '_val'] = val.slice(0, -1);
                    this.syncInput();
                } else if (e.key === 'Enter') {
                    // Unfocus on Enter
                    this.inputState['focused_textbox'] = null;
                    this.syncInput();
                } else if (e.key.length === 1) {
                    // Regular character
                    const val = this.inputState[focusedId + '_val'] || "";
                    this.inputState[focusedId + '_val'] = val + e.key;
                    this.syncInput();
                }
            }
        });
    }

    private handleMouse(e: MouseEvent, down: boolean | null) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.inputState['mouse_x'] = x;
        this.inputState['mouse_y'] = y;
        if (down !== null) {
            this.inputState['mouse_down'] = down;
        }

        // We'll need a way to track which element was clicked based on its ID
        // For IMGUI, we'll re-send the entire state and the main window will match it
        this.syncInput();
    }

    private syncInput() {
        window.opener.postMessage({ type: 'input_update', state: this.inputState }, '*');
    }

    private render(batch: GUICommand[]) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const cmd of batch) {
            const args = cmd.args;
            const state = args;

            this.ctx.save();
            const m = state.matrix;
            this.ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

            const r = state.fill.r;
            const g = state.fill.g;
            const b = state.fill.b;
            const a = state.fill.a !== undefined ? state.fill.a : 1;

            const sr = state.stroke.r;
            const sg = state.stroke.g;
            const sb = state.stroke.b;
            const sa = state.stroke.a !== undefined ? state.stroke.a : 1;

            const fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            const strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${sa})`;

            this.ctx.fillStyle = fillStyle;
            this.ctx.strokeStyle = strokeStyle;
            this.ctx.lineWidth = state.stroke.width || 1;

            switch (cmd.type) {
                case 'rect':
                    this.ctx.fillRect(args.x, args.y, args.w, args.h);
                    break;
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(args.x, args.y, args.r, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'line':
                    this.ctx.beginPath();
                    this.ctx.moveTo(args.x1, args.y1);
                    this.ctx.lineTo(args.x2, args.y2);
                    this.ctx.stroke();
                    break;
                case 'text':
                    this.ctx.font = '14px sans-serif';
                    this.ctx.textAlign = args.align || 'left';
                    this.ctx.fillText(args.text, args.x, args.y);
                    break;
                case 'button':
                    this.drawButton(args.id, args.text, args.x, args.y, fillStyle, strokeStyle, m);
                    break;
                case 'slider':
                    this.drawSlider(args.id, args.x, args.y, args.val, fillStyle, strokeStyle, m);
                    break;
                case 'checkbox':
                    this.drawCheckbox(args.id, args.x, args.y, args.val, fillStyle, strokeStyle, m);
                    break;
                case 'radio':
                    this.drawRadio(args.id, args.x, args.y, args.val, fillStyle, strokeStyle, m);
                    break;
                case 'textbox':
                    this.drawInput(args.id, args.x, args.y, m);
                    break;
                case 'polygon':
                    this.ctx.beginPath();
                    if (args.points.length > 0) {
                        this.ctx.moveTo(args.x + args.points[0].x, args.y + args.points[0].y);
                        for (let i = 1; i < args.points.length; i++) {
                            this.ctx.lineTo(args.x + args.points[i].x, args.y + args.points[i].y);
                        }
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'image':
                    this.drawImage(args.url, args.x, args.y, args.w, args.h);
                    break;
                case 'sprite':
                    this.drawSprite(args.data, args.x, args.y, args.w, args.h);
                    break;
            }
            this.ctx.restore();
        }
    }

    private drawSprite(pixels: any[], x: number, y: number, w: number, h: number) {
        // Draw pixel-by-pixel using fillRect to respect transformations
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const i = py * w + px;
                if (i < pixels.length) {
                    const p = pixels[i];
                    const r = p.r;
                    const g = p.g;
                    const b = p.b;
                    const a = p.a !== undefined ? p.a : 1;

                    if (a === 0) continue;

                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    this.ctx.fillRect(x + px, y + py, 1, 1);
                }
            }
        }
    }

    private drawCheckbox(id: string, x: number, y: number, val: boolean, fillStyle: string, strokeStyle: string, matrix: number[]) {
        const size = 20;
        const hover = this.isHover(x, y, size, size, matrix);
        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_was_down']) {
            this.inputState[id + '_val'] = !val;
            this.inputState[id + '_clicked'] = true;
            this.syncInput();
            setTimeout(() => { this.inputState[id + '_clicked'] = false; this.syncInput(); }, 100);
        }
        this.inputState[id + '_was_down'] = this.inputState['mouse_down'];

        this.ctx.strokeStyle = strokeStyle;
        this.ctx.strokeRect(x, y, size, size);
        if (val) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        }
    }

    private drawRadio(id: string, x: number, y: number, val: boolean, fillStyle: string, strokeStyle: string, matrix: number[]) {
        const r = 10;
        const hover = this.isCircleHover(x, y, r, matrix);
        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_was_down']) {
            this.inputState[id + '_val'] = true;
            this.inputState[id + '_clicked'] = true;
            this.syncInput();
            setTimeout(() => { this.inputState[id + '_clicked'] = false; this.syncInput(); }, 100);
        }
        this.inputState[id + '_was_down'] = this.inputState['mouse_down'];

        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.stroke();
        if (val) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r - 4, 0, Math.PI * 2);
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }
    }

    private drawInput(id: string, x: number, y: number, matrix: number[]) {
        const w = 200;
        const h = 30;
        const val = this.inputState[id + '_val'] || "";
        const hover = this.isHover(x, y, w, h, matrix);
        const focused = this.inputState['focused_textbox'] === id;

        // Click to focus/unfocus
        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_was_down']) {
            this.inputState['focused_textbox'] = focused ? null : id;
            this.syncInput();
        }
        this.inputState[id + '_was_down'] = this.inputState['mouse_down'];

        // Light background for visibility
        this.ctx.fillStyle = focused ? '#fff' : '#ddd';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = focused ? '#00f' : '#000';
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(val + (focused ? '|' : ''), x + 5, y + h / 2);
    }

    private imgCache: Record<string, HTMLImageElement> = {};
    private drawImage(url: string, x: number, y: number, w: number, h: number) {
        let img = this.imgCache[url];
        if (!img) {
            img = new Image();
            img.src = url;
            img.onload = () => this.syncInput();
            this.imgCache[url] = img;
        }
        if (img.complete) {
            this.ctx.drawImage(img, x, y, w, h);
        }
    }

    private drawButton(id: string, text: string, x: number, y: number, fillStyle: string, strokeStyle: string, matrix: number[]) {
        const w = 100;
        const h = 30;
        const hover = this.isHover(x, y, w, h, matrix);
        const down = hover && this.inputState['mouse_down'];

        this.ctx.fillStyle = down ? '#ccc' : (hover ? '#ddd' : '#eee');
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.strokeRect(x, y, w, h);

        this.ctx.fillStyle = strokeStyle;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + w / 2, y + h / 2);

        if (hover && !this.inputState['mouse_down'] && this.inputState[id + '_was_down']) {
            this.inputState[id + '_clicked'] = true;
            this.syncInput();
            setTimeout(() => { this.inputState[id + '_clicked'] = false; this.syncInput(); }, 100);
        }
        this.inputState[id + '_was_down'] = down;
    }

    private drawSlider(id: string, x: number, y: number, currentVal: number, fillStyle: string, strokeStyle: string, matrix: number[]) {
        const w = 200;
        const h = 10;
        const handleX = x + (currentVal / 100) * w;

        this.ctx.fillStyle = strokeStyle;
        this.ctx.fillRect(x, y, w, h);

        const hover = this.isHover(x - 5, y - 10, w + 10, h + 20, matrix);
        if (hover && this.inputState['mouse_down']) {
            this.ctx.save();
            this.ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
            const mx = this.inputState['mouse_x'];
            // This is a bit tricky: we need to project mouse into local space if we want accurate dragging in a rotated slider.
            // For now, let's assume simple cases or just keep it simple.
            const newVal = Math.max(0, Math.min(100, ((mx - x) / w) * 100));
            this.inputState[id + '_val'] = newVal;
            this.syncInput();
            this.ctx.restore();
        }

        this.ctx.fillStyle = fillStyle;
        this.ctx.fillRect(handleX - 5, y - 5, 10, 20);
    }

    private isHover(x: number, y: number, w: number, h: number, matrix: number[]) {
        this.ctx.save();
        this.ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        const result = this.ctx.isPointInPath(this.inputState['mouse_x'], this.inputState['mouse_y']);
        this.ctx.restore();
        return result;
    }

    private isCircleHover(x: number, y: number, r: number, matrix: number[]) {
        this.ctx.save();
        this.ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        const result = this.ctx.isPointInPath(this.inputState['mouse_x'], this.inputState['mouse_y']);
        this.ctx.restore();
        return result;
    }
}

new GUIRuntime();
