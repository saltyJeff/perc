import { SourceLocation } from "../errors";

export abstract class perc_type {
    abstract get type(): string;

    // Structural
    get(key: perc_type): perc_type { return new perc_err("Method 'get' not implemented."); }
    set(key: perc_type, value: perc_type): perc_type { return new perc_err("Method 'set' not implemented."); }

    // Arithmetic
    add(other: perc_type): perc_type { return new perc_err("Method 'add' not implemented."); }
    sub(other: perc_type): perc_type { return new perc_err("Method 'sub' not implemented."); }
    mul(other: perc_type): perc_type { return new perc_err("Method 'mul' not implemented."); }
    div(other: perc_type): perc_type { return new perc_err("Method 'div' not implemented."); }
    mod(other: perc_type): perc_type { return new perc_err("Method 'mod' not implemented."); }
    pow(other: perc_type): perc_type { return new perc_err("Method 'pow' not implemented."); }

    // Logical
    and(other: perc_type): perc_type { return new perc_err("Method 'and' not implemented."); }
    or(other: perc_type): perc_type { return new perc_err("Method 'or' not implemented."); }
    xor(other: perc_type): perc_type { return new perc_err("Method 'xor' not implemented."); }
    not(): perc_type { return new perc_err("Method 'not' not implemented."); }

    // Comparison
    eq(other: perc_type): perc_type { return new perc_bool(this === other); }
    ne(other: perc_type): perc_type { return new perc_bool(this !== other); }
    lt(other: perc_type): perc_type { return new perc_bool(false); }
    le(other: perc_type): perc_type { return new perc_bool(false); }
    gt(other: perc_type): perc_type { return new perc_bool(false); }
    ge(other: perc_type): perc_type { return new perc_bool(false); }

    // Bitwise
    bitwise_and(other: perc_type): perc_type { return new perc_err("Method 'bitwise_and' not implemented."); }
    bitwise_or(other: perc_type): perc_type { return new perc_err("Method 'bitwise_or' not implemented."); }
    bitwise_xor(other: perc_type): perc_type { return new perc_err("Method 'bitwise_xor' not implemented."); }
    shl(other: perc_type): perc_type { return new perc_err("Method 'shl' not implemented."); }
    shr(other: perc_type): perc_type { return new perc_err("Method 'shr' not implemented."); }

    is_truthy(): boolean { return true; }

    get_iterator(): perc_iterator | perc_err {
        return new perc_err(`Type '${this.type}' is not iterable`);
    }

    clone(): perc_type { return new perc_err("Cannot clone primitive type"); }

    to_string(): string { return "[object perc_type]"; }
}

export interface perc_iterator {
    next(): { value: perc_type, done: boolean };
}

export class perc_err extends perc_type {
    value: string;
    location?: SourceLocation | [number, number];
    get type() { return 'error'; }
    constructor(value: string, location?: SourceLocation | [number, number]) {
        super();
        this.value = value;
        this.location = location;
    }
    to_string(): string { return "Error: " + this.value; }

    // Propagate error
    get(key: perc_type): perc_type { return this; }
    set(key: perc_type, value: perc_type): perc_type { return this; }
    add(other: perc_type): perc_type { return this; }
    sub(other: perc_type): perc_type { return this; }
    mul(other: perc_type): perc_type { return this; }
    div(other: perc_type): perc_type { return this; }
    mod(other: perc_type): perc_type { return this; }
    pow(other: perc_type): perc_type { return this; }
    and(other: perc_type): perc_type { return this; }
    or(other: perc_type): perc_type { return this; }
    xor(other: perc_type): perc_type { return this; }
    not(): perc_type { return this; }
    bitwise_and(other: perc_type): perc_type { return this; }
    bitwise_or(other: perc_type): perc_type { return this; }
    bitwise_xor(other: perc_type): perc_type { return this; }
    shl(other: perc_type): perc_type { return this; }
    shr(other: perc_type): perc_type { return this; }
    eq(other: perc_type): perc_bool { return new perc_bool(false); }
    ne(other: perc_type): perc_bool { return new perc_bool(true); }
}

export class perc_nil extends perc_type {
    get type() { return 'nil'; }
    to_string(): string { return "nil"; }
    is_truthy(): boolean { return false; }
    eq(other: perc_type): perc_bool { return new perc_bool(other instanceof perc_nil); }
    clone(): perc_type { return this; }
}

export class perc_bool extends perc_type {
    value: boolean;
    get type() { return 'bool'; }
    constructor(value: boolean) {
        super();
        this.value = !!value;
    }
    to_string(): string { return this.value.toString(); }
    is_truthy(): boolean { return this.value; }
    not(): perc_type { return new perc_bool(!this.value); }
    eq(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_bool && this.value === other.value);
    }
    clone(): perc_type { return this; }
}

export class perc_number extends perc_type {
    buffer: Float64Array | Float32Array | Int32Array | Uint32Array | Int16Array | Uint16Array | Int8Array | Uint8Array;
    type: 'f64' | 'f32' | 'i32' | 'u32' | 'i16' | 'u16' | 'i8' | 'u8';

    constructor(value: number, type: 'f64' | 'f32' | 'i32' | 'u32' | 'i16' | 'u16' | 'i8' | 'u8' = 'f64') {
        super();
        this.type = type;
        switch (type) {
            case 'f32': this.buffer = new Float32Array(1); break;
            case 'i32': this.buffer = new Int32Array(1); break;
            case 'u32': this.buffer = new Uint32Array(1); break;
            case 'i16': this.buffer = new Int16Array(1); break;
            case 'u16': this.buffer = new Uint16Array(1); break;
            case 'i8': this.buffer = new Int8Array(1); break;
            case 'u8': this.buffer = new Uint8Array(1); break;
            default: this.buffer = new Float64Array(1); break;
        }
        this.buffer[0] = value;
    }

    private get val() { return this.buffer[0]; }

    add(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val + other.val, this.type);
        return super.add(other);
    }
    sub(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val - other.val, this.type);
        return super.sub(other);
    }
    mul(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val * other.val, this.type);
        return super.mul(other);
    }
    div(other: perc_type): perc_type {
        if (other instanceof perc_number) {
            if (other.val === 0) return new perc_err("Division by zero");
            return new perc_number(this.val / other.val, this.type);
        }
        return super.div(other);
    }
    mod(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val % other.val, this.type);
        return super.mod(other);
    }
    pow(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(Math.pow(this.val, other.val), this.type);
        return super.pow(other);
    }

    // Bitwise ops - always behave as 32-bit ints in JS
    bitwise_and(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val & other.val, this.type);
        return super.bitwise_and(other);
    }
    bitwise_or(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val | other.val, this.type);
        return super.bitwise_or(other);
    }
    bitwise_xor(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val ^ other.val, this.type);
        return super.bitwise_xor(other);
    }
    shl(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val << other.val, this.type);
        return super.shl(other);
    }
    shr(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val >> other.val, this.type);
        return super.shr(other);
    }

    eq(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_number && this.val === other.val);
    }
    lt(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_number && this.val < other.val);
    }
    le(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_number && this.val <= other.val);
    }
    gt(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_number && this.val > other.val);
    }
    ge(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_number && this.val >= other.val);
    }

    clone(): perc_type { return this; }
    to_string(): string { return this.val.toString(); }
}

export class perc_native_method extends perc_type {
    name: string;
    handler: (...args: perc_type[]) => perc_type;

    constructor(name: string, handler: (...args: perc_type[]) => perc_type) {
        super();
        this.name = name;
        this.handler = handler;
    }

    get type() { return 'native_method'; }
    to_string(): string { return `<native method ${this.name}>`; }
}

export class perc_string extends perc_type {
    value: string;
    get type() { return 'string'; }
    constructor(value: string) {
        super();
        this.value = value;
    }
    to_string(): string { return this.value; }
    add(other: perc_type): perc_type {
        return new perc_string(this.value + other.to_string());
    }
    get(key: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0] - 1; // 1-based indexing
            if (idx < 0) return new perc_err("Index out of bounds");

            let i = 0;
            for (const char of this.value) {
                if (i === idx) return new perc_string(char);
                i++;
            }
            return new perc_err("Index out of bounds");
        }

        // Methods
        if (key instanceof perc_string) {
            switch (key.value) {
                case "len":
                    return new perc_native_method("len", () => new perc_number(this.value.length));
                case "upper":
                    return new perc_native_method("upper", () => new perc_string(this.value.toUpperCase()));
                case "lower":
                    return new perc_native_method("lower", () => new perc_string(this.value.toLowerCase()));
                case "split":
                    return new perc_native_method("split", (sep) => {
                        const s = sep instanceof perc_string ? sep.value : " ";
                        return new perc_list(this.value.split(s).map(p => new perc_string(p)));
                    });
                case "has":
                    return new perc_native_method("has", (sub) => {
                        const s = sub instanceof perc_string ? sub.value : sub.to_string();
                        return new perc_bool(this.value.includes(s));
                    });
            }
        }

        return super.get(key);
    }
    eq(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_string && this.value === other.value);
    }
    get_iterator(): perc_iterator | perc_err {
        const iter = this.value[Symbol.iterator]();
        return {
            next: () => {
                const res = iter.next();
                if (res.done) return { value: new perc_nil(), done: true };
                return { value: new perc_string(res.value), done: false };
            }
        };
    }
    clone(): perc_type { return this; }
}

let nextAddress = 1;

export class perc_list extends perc_type {
    elements: perc_type[];
    pseudoAddress: number;
    get type() { return 'list'; }
    constructor(elements: perc_type[] = []) {
        super();
        this.elements = elements;
        this.pseudoAddress = nextAddress++;
    }
    get(key: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0] - 1; // 1-based indexing
            if (idx >= 0 && idx < this.elements.length) return this.elements[idx];
            return new perc_err("Index out of bounds");
        }

        // Methods
        if (key instanceof perc_string) {
            switch (key.value) {
                case "push":
                    return new perc_native_method("push", (val) => {
                        this.elements.push(val);
                        return val;
                    });
                case "pop":
                    return new perc_native_method("pop", () => {
                        if (this.elements.length === 0) return new perc_nil();
                        return this.elements.pop()!;
                    });
                case "insert":
                    return new perc_native_method("insert", (idx, val) => {
                        if (idx instanceof perc_number) {
                            let i = idx.buffer[0] - 1; // 1-based
                            if (i < 0) i = 0;
                            if (i > this.elements.length) i = this.elements.length;
                            this.elements.splice(i, 0, val);
                            return val;
                        }
                        return new perc_err("Index must be a number");
                    });
                case "remove":
                    return new perc_native_method("remove", (val) => {
                        const idx = this.elements.findIndex(e => e.eq(val).is_truthy());
                        if (idx !== -1) {
                            this.elements.splice(idx, 1);
                            return new perc_bool(true);
                        }
                        return new perc_bool(false);
                    });
                case "delete":
                    return new perc_native_method("delete", (idx) => {
                        if (idx instanceof perc_number) {
                            const i = idx.buffer[0] - 1; // 1-based
                            if (i >= 0 && i < this.elements.length) {
                                const removed = this.elements.splice(i, 1)[0];
                                return removed;
                            }
                            return new perc_nil();
                        }
                        return new perc_err("Index must be a number");
                    });
                case "contains":
                    return new perc_native_method("contains", (val) => {
                        const found = this.elements.some(e => e.eq(val).is_truthy());
                        return new perc_bool(found);
                    });
                case "index_of":
                    return new perc_native_method("index_of", (val) => {
                        const idx = this.elements.findIndex(e => e.eq(val).is_truthy());
                        return new perc_number(idx !== -1 ? idx + 1 : -1, 'i32'); // 1-based
                    });
                case "clear":
                    return new perc_native_method("clear", () => {
                        this.elements = [];
                        return new perc_nil();
                    });
                case "join":
                    return new perc_native_method("join", (sep) => {
                        const s = sep instanceof perc_string ? sep.value : ", ";
                        return new perc_string(this.elements.map(e => e.to_string()).join(s));
                    });
                case "len":
                    return new perc_native_method("len", () => new perc_number(this.elements.length));
            }
        }

        return super.get(key);
    }
    set(key: perc_type, value: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0] - 1; // 1-based indexing
            if (idx >= 0 && idx < this.elements.length) {
                this.elements[idx] = value;
                return value;
            }
            return new perc_err("Index out of bounds");
        }
        return super.set(key, value);
    }
    clone(): perc_type {
        // Deep copy
        return new perc_list(this.elements.map(e => e.clone()));
    }
    get_iterator(): perc_iterator | perc_err {
        let i = 0;
        return {
            next: () => {
                if (i < this.elements.length) {
                    return { value: this.elements[i++], done: false };
                }
                return { value: new perc_nil(), done: true };
            }
        };
    }
    to_string(): string {
        return `[list@${this.pseudoAddress}]`;
    }
}

export class perc_tuple extends perc_type {
    elements: perc_type[];
    get type() { return 'tuple'; }
    constructor(elements: perc_type[] = []) {
        super();
        this.elements = elements;
    }
    get(key: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0] - 1; // 1-based indexing
            if (idx >= 0 && idx < this.elements.length) return this.elements[idx];
            return new perc_err("Index out of bounds");
        }
        if (key instanceof perc_string && key.value === "len") {
            return new perc_native_method("len", () => new perc_number(this.elements.length));
        }
        return super.get(key);
    }
    set(key: perc_type, value: perc_type): perc_type {
        return new perc_err("Tuples are immutable");
    }
    clone(): perc_type {
        // Tuples are value types and immutable, so return self
        return this;
    }
    get_iterator(): perc_iterator | perc_err {
        let i = 0;
        return {
            next: () => {
                if (i < this.elements.length) {
                    return { value: this.elements[i++], done: false };
                }
                return { value: new perc_nil(), done: true };
            }
        };
    }
    to_string(): string {
        return "(| " + this.elements.map(e => e.to_string()).join(", ") + " |)";
    }
}

export class perc_map extends perc_type {
    data: Map<any, perc_type>;
    pseudoAddress: number;
    get type() { return 'map'; }
    constructor() {
        super();
        this.data = new Map();
        this.pseudoAddress = nextAddress++;
    }
    get(key: perc_type): perc_type {
        // Methods
        if (key instanceof perc_string) {
            switch (key.value) {
                case "keys":
                    return new perc_native_method("keys", () => {
                        // We track keys as strings in the internal map, but we might want to recover types if possible?
                        // Current implementation converts keys to string for storage.
                        // So keys() will return strings.
                        return new perc_list(Array.from(this.data.keys()).map(k => new perc_string(k)));
                    });
                case "values":
                    return new perc_native_method("values", () => {
                        return new perc_list(Array.from(this.data.values()));
                    });
                case "contains":
                    return new perc_native_method("contains", (k) => {
                        return new perc_bool(this.data.has(k.to_string()));
                    });
                case "delete":
                    return new perc_native_method("delete", (k) => {
                        const existed = this.data.delete(k.to_string());
                        return new perc_bool(existed);
                    });
                case "clear":
                    return new perc_native_method("clear", () => {
                        this.data.clear();
                        return new perc_nil();
                    });
                case "len":
                    return new perc_native_method("len", () => new perc_number(this.data.size));
            }
        }

        const k = key.to_string();
        return this.data.get(k) || new perc_nil();
    }
    set(key: perc_type, value: perc_type): perc_type {
        this.data.set(key.to_string(), value);
        return value;
    }
    clone(): perc_type {
        const m = new perc_map();
        // Deep copy of map data
        for (const [k, v] of this.data.entries()) {
            m.data.set(k, v.clone());
        }
        return m;
    }
    to_string(): string {
        return `{map@${this.pseudoAddress}}`;
    }
    get_iterator(): perc_iterator | perc_err {
        const keys = Array.from(this.data.keys());
        let i = 0;
        return {
            next: () => {
                if (i < keys.length) {
                    return { value: new perc_string(keys[i++]), done: false };
                }
                return { value: new perc_nil(), done: true };
            }
        };
    }
}

export class perc_range extends perc_type {
    start: number;
    end: number;
    step: number;
    get type() { return 'range'; }

    constructor(start: number, end: number, step: number = 1) {
        super();
        this.start = start;
        this.end = end;
        this.step = step;
        if (this.step === 0) this.step = 1; // Prevent inf loop
    }

    get_iterator(): perc_iterator | perc_err {
        let current = this.start;
        const end = this.end;
        const step = this.step;

        return {
            next: () => {
                if ((step > 0 && current < end) || (step < 0 && current > end)) {
                    const val = current;
                    current += step;
                    return { value: new perc_number(val, 'i32'), done: false };
                }
                return { value: new perc_nil(), done: true };
            }
        };
    }

    to_string(): string {
        return `range(${this.start}, ${this.end}, ${this.step})`;
    }

    clone(): perc_type { return this; } // Ranges are immutable value objects effectively
}

export class perc_closure extends perc_type {
    addr: number;
    name: string;
    captured: any;
    get type() { return 'function'; }
    constructor(addr: number, captured: any, name: string = "anonymous") {
        super();
        this.addr = addr;
        this.captured = captured;
        this.name = name;
    }
    to_string(): string { return this.name === "anonymous" ? `<function at ${this.addr}>` : `<function ${this.name}>`; }
}
