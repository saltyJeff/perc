import type { Color } from "./gui_cmds";

const colorCache = new Map<string, string>();
export function toCSSColor(c: Color | undefined): string {
    if (!c) return "transparent";
    const a = c.a !== undefined ? c.a : 1;
    const key = `${c.r},${c.g},${c.b},${a}`;
    let css = colorCache.get(key);
    if (!css) {
        css = `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
        if (colorCache.size < 1000) colorCache.set(key, css);
    }
    return css;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function getHoverColor(c: Color, percent: number): string {
    const { r, g, b, a = 1 } = c;
    const [h, s, l] = rgbToHsl(r, g, b);
    const newL = l > 50 ? Math.max(0, l - percent) : Math.min(100, l + percent);
    const [nr, ng, nb] = hslToRgb(h, s, newL);
    return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
}

export function toCSSMatrix(m: number[] | undefined): string {
    if (!m) return "matrix(1, 0, 0, 1, 0, 0)";
    return `matrix(${m[0]}, ${m[3]}, ${m[1]}, ${m[4]}, ${m[2]}, ${m[5]})`;
}

export function multiplyMatrices(m1: number[], m2: number[]): number[] {
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
