import { perc_type, perc_number, perc_string, perc_map, perc_err, perc_range, perc_list, perc_tuple } from "./perc_types";

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

// Clone
standardBuiltins['clone'] = (arg: perc_type) => {
    return arg.clone();
};

// Global utilities
standardBuiltins['len'] = (arg: perc_type) => {
    if (arg instanceof perc_list) return new perc_number(arg.elements.length);
    if (arg instanceof perc_string) return new perc_number(arg.value.length);
    if (arg instanceof perc_map) return new perc_number(arg.data.size);
    if (arg instanceof perc_tuple) return new perc_number(arg.elements.length);
    return new perc_err(`Type '${arg.type}' has no length`);
};

standardBuiltins['str'] = (arg: perc_type) => {
    return new perc_string(arg.to_string());
};

standardBuiltins['range'] = (...args: perc_type[]) => {
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
