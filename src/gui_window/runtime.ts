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

        this.resize();

        window.addEventListener('resize', () => this.resize());

        // Input handling
        this.canvas.addEventListener('mousedown', (e) => this.handleMouse(e, true));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouse(e, false));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouse(e, null));

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'render_batch') {
                this.render(event.data.batch);
            }
        });
    }

    private resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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

        // State for graphics
        let fillStyle = '#000';
        let strokeStyle = '#000';
        let lineWidth = 1;

        for (const cmd of batch) {
            const args = cmd.args;
            switch (cmd.type) {
                case 'fill':
                    fillStyle = `rgb(${args.r}, ${args.g}, ${args.b})`;
                    break;
                case 'stroke':
                    strokeStyle = `rgb(${args.r}, ${args.g}, ${args.b})`;
                    lineWidth = args.width || lineWidth;
                    break;
                case 'rect':
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fillRect(args.x, args.y, args.w, args.h);
                    break;
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(args.x, args.y, args.r, 0, Math.PI * 2);
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fill();
                    break;
                case 'line':
                    this.ctx.beginPath();
                    this.ctx.moveTo(args.x1, args.y1);
                    this.ctx.lineTo(args.x2, args.y2);
                    this.ctx.strokeStyle = strokeStyle;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.stroke();
                    break;
                case 'text':
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.font = '14px sans-serif';
                    this.ctx.textAlign = args.align || 'left';
                    this.ctx.fillText(args.text, args.x, args.y);
                    break;
                case 'button':
                    this.drawButton(args.id, args.text, args.x, args.y, fillStyle, strokeStyle);
                    break;
                case 'slider':
                    this.drawSlider(args.id, args.x, args.y, args.val, fillStyle, strokeStyle);
                    break;
                case 'translate':
                    this.ctx.translate(args.x, args.y);
                    break;
                case 'scale':
                    this.ctx.scale(args.x, args.y);
                    break;
                case 'rotate':
                    this.ctx.rotate(args.angle);
                    break;
                case 'save':
                    this.ctx.save();
                    break;
                case 'restore':
                    this.ctx.restore();
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
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fill();
                    break;
                case 'image':
                    this.drawImage(args.url, args.x, args.y, args.w, args.h);
                    break;
                case 'sprite':
                    this.drawSprite(args.data, args.x, args.y, args.w, args.h);
                    break;
                case 'checkbox':
                    this.drawCheckbox(args.id, args.x, args.y, args.val, fillStyle, strokeStyle);
                    break;
                case 'radio':
                    this.drawRadio(args.id, args.x, args.y, args.val, fillStyle, strokeStyle);
                    break;
                case 'input':
                    this.drawInput(args.id, args.x, args.y);
                    break;
            }
        }
    }

    private drawSprite(pixels: any[], x: number, y: number, w: number, h: number) {
        // Draw pixel-by-pixel using fillRect to respect transformations
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const i = py * w + px;
                if (i < pixels.length) {
                    this.ctx.fillStyle = `rgb(${pixels[i].r}, ${pixels[i].g}, ${pixels[i].b})`;
                    this.ctx.fillRect(x + px, y + py, 1, 1);
                }
            }
        }
    }

    private drawCheckbox(id: string, x: number, y: number, val: boolean, fillStyle: string, strokeStyle: string) {
        const size = 20;
        const hover = this.isHover(x, y, size, size);
        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_was_down']) {
            this.inputState[id + '_val'] = !val;
            this.syncInput();
        }
        this.inputState[id + '_was_down'] = this.inputState['mouse_down'];

        this.ctx.strokeStyle = strokeStyle;
        this.ctx.strokeRect(x, y, size, size);
        if (val) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        }
    }

    private drawRadio(id: string, x: number, y: number, val: boolean, fillStyle: string, strokeStyle: string) {
        const r = 10;
        const hover = this.isHover(x - r, y - r, r * 2, r * 2);
        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_was_down']) {
            this.inputState[id + '_val'] = true;
            this.syncInput();
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

    private drawInput(id: string, x: number, y: number) {
        const w = 200;
        const h = 30;
        const val = this.inputState[id + '_val'] || "";
        const hover = this.isHover(x, y, w, h);

        if (hover && this.inputState['mouse_down'] && !this.inputState[id + '_focused']) {
            // Focus logic? For now, let's just use window.prompt if clicked to keep it simple for IE11/Student use
            const newVal = window.prompt("Enter text:", val);
            if (newVal !== null) {
                this.inputState[id + '_val'] = newVal;
                this.syncInput();
            }
        }

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(val, x + 5, y + h / 2);
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

    private drawButton(id: string, text: string, x: number, y: number, fillStyle: string, strokeStyle: string) {
        const w = 100;
        const h = 30;
        const hover = this.isHover(x, y, w, h);
        const down = hover && this.inputState['mouse_down'];

        this.ctx.fillStyle = down ? '#444' : (hover ? fillStyle : '#555');
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

    private drawSlider(id: string, x: number, y: number, currentVal: number, fillStyle: string, strokeStyle: string) {
        const w = 200;
        const h = 10;
        const handleX = x + (currentVal / 100) * w;

        this.ctx.fillStyle = strokeStyle;
        this.ctx.fillRect(x, y, w, h);

        const hover = this.isHover(x - 5, y - 10, w + 10, h + 20);
        if (hover && this.inputState['mouse_down']) {
            const mx = this.inputState['mouse_x'];
            const newVal = Math.max(0, Math.min(100, ((mx - x) / w) * 100));
            this.inputState[id + '_val'] = newVal;
            this.syncInput();
        }

        this.ctx.fillStyle = fillStyle;
        this.ctx.fillRect(handleX - 5, y - 5, 10, 20);
    }

    private isHover(x: number, y: number, w: number, h: number) {
        const mx = this.inputState['mouse_x'];
        const my = this.inputState['mouse_y'];
        return mx >= x && mx <= x + w && my >= y && my <= y + h;
    }
}

new GUIRuntime();
