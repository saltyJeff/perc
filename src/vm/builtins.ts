import { perc_type, perc_number, perc_string, perc_map, perc_err } from "./perc_types";

export type BuiltinFunc = (...args: perc_type[]) => perc_type;

export const standardBuiltins: Record<string, BuiltinFunc> = {};

// Register default type casts
const types = ['i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'f32', 'f64'] as const;
for (const t of types) {
    standardBuiltins[t] = (arg: perc_type) => {
        if (arg instanceof perc_number) return new perc_number(arg.buffer[0], t);
        // Try parsing string
        if (arg instanceof perc_string) {
            const n = parseFloat(arg.value);
            if (!isNaN(n)) return new perc_number(n, t);
        }
        return new perc_err(`Cannot cast ${arg.to_string()} to ${t}`);
    };
}

// Aliases
standardBuiltins['int'] = standardBuiltins['i32'];
standardBuiltins['float'] = standardBuiltins['f64'];

// Color functions
standardBuiltins['rgb'] = (r: perc_type, g: perc_type, b: perc_type) => {
    const m = new perc_map();
    m.set(new perc_string('r'), r);
    m.set(new perc_string('g'), g);
    m.set(new perc_string('b'), b);
    m.set(new perc_string('a'), new perc_number(1));
    return m;
};

standardBuiltins['rgba'] = (r: perc_type, g: perc_type, b: perc_type, a: perc_type) => {
    const m = new perc_map();
    m.set(new perc_string('r'), r);
    m.set(new perc_string('g'), g);
    m.set(new perc_string('b'), b);
    m.set(new perc_string('a'), a);
    return m;
};

standardBuiltins['hsl'] = (h: perc_type, s: perc_type, l: perc_type) => {
    // HSL to RGB conversion
    const hv = h instanceof perc_number ? h.buffer[0] : 0;
    const sv = s instanceof perc_number ? s.buffer[0] / 100 : 0;
    const lv = l instanceof perc_number ? l.buffer[0] / 100 : 0;

    const k = (n: number) => (n + hv / 30) % 12;
    const a = sv * Math.min(lv, 1 - lv);
    const f = (n: number) => lv - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);

    const m = new perc_map();
    m.set(new perc_string('r'), new perc_number(r, 'u8'));
    m.set(new perc_string('g'), new perc_number(g, 'u8'));
    m.set(new perc_string('b'), new perc_number(b, 'u8'));
    m.set(new perc_string('a'), new perc_number(1));
    return m;
};

standardBuiltins['hsla'] = (h: perc_type, s: perc_type, l: perc_type, a: perc_type) => {
    // HSL to RGB conversion
    const hv = h instanceof perc_number ? h.buffer[0] : 0;
    const sv = s instanceof perc_number ? s.buffer[0] / 100 : 0;
    const lv = l instanceof perc_number ? l.buffer[0] / 100 : 0;

    const k = (n: number) => (n + hv / 30) % 12;
    const ka = sv * Math.min(lv, 1 - lv);
    const f = (n: number) => lv - ka * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);

    const m = new perc_map();
    m.set(new perc_string('r'), new perc_number(r, 'u8'));
    m.set(new perc_string('g'), new perc_number(g, 'u8'));
    m.set(new perc_string('b'), new perc_number(b, 'u8'));
    m.set(new perc_string('a'), a);
    return m;
};
