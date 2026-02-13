export abstract class perc_type {
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
    eq(other: perc_type): perc_bool { return new perc_bool(this === other); }
    ne(other: perc_type): perc_bool { return new perc_bool(this !== other); }
    lt(other: perc_type): perc_bool { return new perc_bool(false); }
    le(other: perc_type): perc_bool { return new perc_bool(false); }
    gt(other: perc_type): perc_bool { return new perc_bool(false); }
    ge(other: perc_type): perc_bool { return new perc_bool(false); }

    is_truthy(): boolean { return true; }

    get_iterator(): perc_iterator {
        return {
            next: () => ({ value: new perc_nil(), done: true })
        };
    }

    to_string(): string { return "[object perc_type]"; }
}

export interface perc_iterator {
    next(): { value: perc_type, done: boolean };
}

export class perc_err extends perc_type {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    to_string(): string { return "Error: " + this.value; }
}

export class perc_nil extends perc_type {
    to_string(): string { return "nil"; }
    is_truthy(): boolean { return false; }
    eq(other: perc_type): perc_bool { return new perc_bool(other instanceof perc_nil); }
}

export class perc_bool extends perc_type {
    value: boolean;
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
}

export class perc_number extends perc_type {
    buffer: Float64Array | Float32Array | Int32Array | Uint32Array | Int16Array | Uint16Array | Int8Array | Uint8Array;

    constructor(value: number, type: 'f64' | 'f32' | 'i32' | 'u32' | 'i16' | 'u16' | 'i8' | 'u8' = 'f64') {
        super();
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
        if (other instanceof perc_number) return new perc_number(this.val + other.val);
        return super.add(other);
    }
    sub(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val - other.val);
        return super.sub(other);
    }
    mul(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val * other.val);
        return super.mul(other);
    }
    div(other: perc_type): perc_type {
        if (other instanceof perc_number) {
            if (other.val === 0) return new perc_err("Division by zero");
            return new perc_number(this.val / other.val);
        }
        return super.div(other);
    }
    mod(other: perc_type): perc_type {
        if (other instanceof perc_number) return new perc_number(this.val % other.val);
        return super.mod(other);
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

    to_string(): string { return this.val.toString(); }
}

export class perc_string extends perc_type {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    to_string(): string { return this.value; }
    add(other: perc_type): perc_type {
        return new perc_string(this.value + other.to_string());
    }
    eq(other: perc_type): perc_bool {
        return new perc_bool(other instanceof perc_string && this.value === other.value);
    }
}

export class perc_list extends perc_type {
    elements: perc_type[];
    constructor(elements: perc_type[] = []) {
        super();
        this.elements = elements;
    }
    get(key: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0];
            if (idx >= 0 && idx < this.elements.length) return this.elements[idx];
            return new perc_err("Index out of bounds");
        }
        return super.get(key);
    }
    set(key: perc_type, value: perc_type): perc_type {
        if (key instanceof perc_number) {
            const idx = key.buffer[0];
            if (idx >= 0 && idx < this.elements.length) {
                this.elements[idx] = value;
                return value;
            }
            return new perc_err("Index out of bounds");
        }
        return super.set(key, value);
    }
    get_iterator(): perc_iterator {
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
        return "[" + this.elements.map(e => e.to_string()).join(", ") + "]";
    }
}

export class perc_map extends perc_type {
    data: Map<any, perc_type>;
    constructor() {
        super();
        this.data = new Map();
    }
    get(key: perc_type): perc_type {
        const k = key.to_string();
        return this.data.get(k) || new perc_nil();
    }
    set(key: perc_type, value: perc_type): perc_type {
        this.data.set(key.to_string(), value);
        return value;
    }
    to_string(): string {
        return "{" + Array.from(this.data.entries()).map(([k, v]) => `${k}: ${v.to_string()}`).join(", ") + "}";
    }
}

export class perc_closure extends perc_type {
    addr: number;
    name: string;
    captured: any; // Ideally Scope, but using any to avoid circularity if not careful
    constructor(addr: number, captured: any, name: string = "anonymous") {
        super();
        this.addr = addr;
        this.captured = captured;
        this.name = name;
    }
    to_string(): string { return this.name === "anonymous" ? `<function at ${this.addr}>` : `<function ${this.name}>`; }
}
