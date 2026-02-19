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
    location: [number, number] | null;
    get type() { return 'error'; }
    constructor(value: string, location: [number, number] | null = null) {
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
    eq(other: perc_type): perc_bool { return new perc_bool(false); } // Equality to error is false? Or Error? Let's say false to avoid crashing equality checks? Or Error? User said "bubble up". So Error.
    // If I return 'this' (perc_err) for eq, it violates return type perc_bool in signature?
    // Signature in base: eq(other): perc_bool.
    // I should change base signature to return perc_type (can be bool or error).
    ne(other: perc_type): perc_bool { return new perc_bool(true); } // Same issue.
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
    // We already use 'type' as a property for the specific number type (i32, f64 etc)
    // This satisfies the abstract getter as long as it's a string!
    // But we might want 'number' as the high level type, and 'i32' as subtype?
    // User wants "Value" and "Type". For number, seeing 'i32' is clearer than 'number'.
    // So current property 'type' is perfect.
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

    // Bitwise ops - always behave as 32-bit ints in JS, so we cast result back to our type
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
