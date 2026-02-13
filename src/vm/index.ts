import type { opcode } from "./opcodes.ts";
import { perc_type, perc_bool, perc_nil, perc_err, perc_closure, perc_number, perc_string, perc_list, perc_map } from "./perc_types.ts";
import type { perc_iterator } from "./perc_types.ts";
import { Compiler } from "./compiler.ts";

export interface VMEventMap {
    on_frame_push: (frame: Frame) => void;
    on_frame_pop: () => void;
    on_var_update: (name: string, value: perc_type) => void;
    on_stack_push: (value: perc_type) => void;
    on_node_eval: (range: [number, number]) => void;
    on_debugger: () => void;
    on_state_dump: () => void;
    on_error: (err: string) => void;
    on_stack_top_update: (val: perc_type | null) => void;
    on_input_request: (prompt: string) => void;
}

export class Scope {
    values: Map<string, perc_type> = new Map();
    parent: Scope | null = null;
    is_closure_scope: boolean = false;

    constructor(parent: Scope | null = null) {
        this.parent = parent;
    }

    define(name: string, value: perc_type) {
        this.values.set(name, value);
    }

    assign(name: string, value: perc_type): boolean {
        if (this.values.has(name)) {
            this.values.set(name, value);
            return true;
        }
        if (this.parent) return this.parent.assign(name, value);
        return false;
    }

    lookup(name: string): perc_type | null {
        if (this.values.has(name)) return this.values.get(name)!;
        if (this.parent) return this.parent.lookup(name);
        return null;
    }
}

export class Frame {
    scope: Scope;
    ret_addr: number;
    stack_start: number;
    name: string;
    args: string[];

    constructor(scope: Scope, ret_addr: number, stack_start: number, name: string = "global", args: string[] = []) {
        this.scope = scope;
        this.ret_addr = ret_addr;
        this.stack_start = stack_start;
        this.name = name;
        this.args = args;
    }
}

export class VM {
    private code: opcode[] = [];
    private ip: number = 0;
    private stack: perc_type[] = [];
    private call_stack: Frame[] = [];
    private current_frame!: Frame;
    private foreign_funcs: Map<string, (...args: perc_type[]) => perc_type> = new Map();
    private events: Partial<VMEventMap> = {};
    private iterators: perc_iterator[] = [];
    public is_waiting_for_input: boolean = false;
    public in_debug_mode: boolean = false;

    constructor(code: opcode[] = []) {
        this.code = code;
        this.reset_state();
        this.register_defaults();
    }

    private register_defaults() {
        const types = ['i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'f32', 'f64'] as const;
        for (const t of types) {
            this.register_foreign(t, (arg: perc_type) => {
                if (arg instanceof perc_number) return new perc_number(arg.buffer[0], t);
                // Try parsing string
                if (arg instanceof perc_string) {
                    const n = parseFloat(arg.value);
                    if (!isNaN(n)) return new perc_number(n, t);
                }
                return new perc_err(`Cannot cast ${arg.to_string()} to ${t}`);
            });
        }
        // Aliases
        this.register_foreign('int', this.foreign_funcs.get('i32')!);
        this.register_foreign('float', this.foreign_funcs.get('f64')!);

        // Input
        this.register_foreign('input', (prompt_str: perc_type) => {
            const p = prompt_str instanceof perc_string ? prompt_str.value : "";
            this.events.on_input_request?.(p);
            this.is_waiting_for_input = true;
            return new perc_nil(); // Placeholder, will be replaced by resume_with_input
        });
    }

    reset_state() {
        this.ip = 0;
        this.stack = [];
        this.call_stack = [];
        this.iterators = [];
        this.is_waiting_for_input = false;
        this.in_debug_mode = false;
        const global_scope = new Scope();
        this.current_frame = new Frame(global_scope, -1, 0);
    }

    execute(source: string, parser: any) {
        try {
            const ast = parser.parse(source);
            const compiler = new Compiler();
            this.code = compiler.compile(ast);
            this.reset_state();
        } catch (e: any) {
            this.events.on_error?.(e.message);
            throw e;
        }
    }

    resume_with_input(val: perc_type) {
        if (this.is_waiting_for_input) {
            // The 'input' function pushed a nil placeholder. We replace it.
            this.pop();
            this.push(val);
            this.is_waiting_for_input = false;
        }
    }

    get_call_stack_names(): string[] {
        const frames = [...this.call_stack, this.current_frame];
        return frames.map(f => {
            const argsStr = f.args.length > 0 ? f.args.join(", ") : "";
            return `${f.name}(${argsStr})`;
        });
    }

    public get_frames(): Frame[] {
        return [...this.call_stack, this.current_frame];
    }

    get_current_scope_values(): Record<string, string> {
        const res: Record<string, string> = {};
        let s: Scope | null = this.current_frame.scope;
        while (s) {
            for (const [k, v] of s.values.entries()) {
                if (!(k in res)) res[k] = v.to_string();
            }
            s = s.parent;
        }
        return res;
    }

    set_events(events: Partial<VMEventMap>) {
        this.events = events;
    }

    register_foreign(name: string, func: (...args: perc_type[]) => perc_type) {
        this.foreign_funcs.set(name, func);
    }

    *run(): Generator<void, void, void> {
        let last_src_start = -1;
        let last_src_end = -1;
        let ops_count = 0;

        while (this.ip >= 0 && this.ip < this.code.length) {
            const op = this.code[this.ip];

            // Highlight only in debug mode
            if (this.in_debug_mode) {
                this.events.on_node_eval?.([op.src_start, op.src_end]);
            }

            try {
                switch (op.type) {
                    case 'push':
                        this.push(op.imm);
                        break;
                    case 'pop':
                        this.pop();
                        break;
                    case 'dup':
                        const d = this.pop();
                        this.push(d);
                        this.push(d);
                        break;
                    case 'swap':
                        const a = this.pop();
                        const b = this.pop();
                        this.push(a);
                        this.push(b);
                        break;
                    case 'init':
                        this.current_frame.scope.define(op.name, this.pop());
                        if (this.in_debug_mode) {
                            this.events.on_var_update?.(op.name, this.current_frame.scope.lookup(op.name)!);
                        }
                        break;
                    case 'load':
                        const val = this.current_frame.scope.lookup(op.name);
                        if (!val) throw new Error(`Undefined variable: ${op.name}`);
                        this.push(val);
                        break;
                    case 'store':
                        const s_val = this.pop();
                        if (!this.current_frame.scope.assign(op.name, s_val)) {
                            throw new Error(`Cannot assign to uninitialized variable: ${op.name}`);
                        }
                        if (this.in_debug_mode) {
                            this.events.on_var_update?.(op.name, s_val);
                        }
                        break;
                    case 'binary_op':
                        const right = this.pop();
                        const left = this.pop();
                        this.push(this.apply_binary(left, right, op.op));
                        break;
                    case 'unary_op':
                        const u = this.pop();
                        this.push(this.apply_unary(u, op.op));
                        break;
                    case 'jump':
                        this.ip = op.addr;
                        // Check yield condition for jump
                        if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                            last_src_start = op.src_start;
                            last_src_end = op.src_end;
                            yield;
                        }
                        continue;
                    case 'jump_if_false':
                        if (!this.pop().is_truthy()) {
                            this.ip = op.addr;
                            // Check yield condition
                            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                                last_src_start = op.src_start;
                                last_src_end = op.src_end;
                                yield;
                            }
                            continue;
                        }
                        break;
                    case 'jump_if_true':
                        if (this.pop().is_truthy()) {
                            this.ip = op.addr;
                            // Check yield condition
                            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                                last_src_start = op.src_start;
                                last_src_end = op.src_end;
                                yield;
                            }
                            continue;
                        }
                        break;
                    case 'get_iter':
                        this.iterators.push(this.pop().get_iterator());
                        break;
                    case 'iter_next':
                        const iter = this.iterators[this.iterators.length - 1];
                        const { value, done } = iter.next();
                        if (!done) {
                            this.push(value);
                            this.push(new perc_bool(true));
                        } else {
                            this.iterators.pop();
                            this.push(new perc_bool(false));
                        }
                        break;
                    case 'call':
                        const func = this.pop();
                        if (!(func instanceof perc_closure)) throw new Error("Object is not callable");

                        // Arguments are already on the stack. Current frame is where they are.
                        // However, we want to capture their values for the debugger.
                        // The stack has [..., arg0, arg1, ..., argN]
                        const call_args: string[] = [];
                        const arg_count = op.nargs;
                        for (let i = 0; i < arg_count; i++) {
                            // Elements were pushed in order, so the top of stack is the last arg.
                            // We peek at them relative to the end of the stack.
                            const val = this.stack[this.stack.length - arg_count + i];
                            if (val) call_args.push(val.to_string());
                        }

                        const call_scope = new Scope(func.captured as any);
                        const new_frame = new Frame(call_scope, this.ip + 1, this.stack.length, func.name, call_args);
                        this.call_stack.push(this.current_frame);
                        this.current_frame = new_frame;
                        this.ip = func.addr;
                        if (this.in_debug_mode) {
                            this.events.on_frame_push?.(new_frame);
                        }
                        // Check yield condition
                        if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                            last_src_start = op.src_start;
                            last_src_end = op.src_end;
                            yield;
                        }
                        continue;
                    case 'ret':
                        const ret_val = this.pop();
                        const finishing_frame = this.current_frame;
                        if (this.call_stack.length === 0) {
                            this.ip = -1; // Halt
                            break;
                        }
                        this.current_frame = this.call_stack.pop()!;
                        this.ip = finishing_frame.ret_addr;
                        this.push(ret_val);
                        if (this.in_debug_mode) {
                            this.events.on_frame_pop?.();
                        }
                        // Check yield condition
                        if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end)) {
                            last_src_start = op.src_start;
                            last_src_end = op.src_end;
                            yield;
                        }
                        continue;
                    case 'make_closure':
                        this.push(new perc_closure(op.addr, this.current_frame.scope, op.name));
                        break;
                    case 'call_foreign':
                        const for_args: perc_type[] = [];
                        for (let i = 0; i < op.nargs; i++) for_args.push(this.pop());
                        const foreign = this.foreign_funcs.get(op.name);
                        if (!foreign) throw new Error(`Foreign function not found: ${op.name}`);
                        this.push(foreign(...for_args.reverse())); // args were pushed in order, pop in reverse
                        break;
                    case 'new_array':
                        const arr_els: perc_type[] = [];
                        for (let i = 0; i < op.size; i++) arr_els.push(this.pop());
                        this.push(new perc_list(arr_els.reverse()));
                        break;
                    case 'new_map':
                        const m = new perc_map();
                        for (let i = 0; i < op.size; i++) {
                            const val = this.pop();
                            const key = this.pop();
                            m.set(key, val);
                        }
                        this.push(m);
                        break;
                    case 'new_tuple':
                        // For now, treat tuples as lists or a restricted list
                        const tup_els: perc_type[] = [];
                        for (let i = 0; i < op.size; i++) tup_els.push(this.pop());
                        this.push(new perc_list(tup_els.reverse()));
                        break;
                    case 'index_load':
                        const idx = this.pop();
                        const obj = this.pop();
                        this.push(obj.get(idx));
                        break;
                    case 'index_store':
                        const st_val = this.pop();
                        const st_idx = this.pop();
                        const st_obj = this.pop();
                        this.push(st_obj.set(st_idx, st_val));
                        break;
                    case 'member_load':
                        const m_obj = this.pop();
                        // Member load uses a string key
                        this.push(m_obj.get(new perc_string(op.name)));
                        break;
                    case 'member_store':
                        const ms_val = this.pop();
                        const ms_obj = this.pop();
                        this.push(ms_obj.set(new perc_string(op.name), ms_val));
                        break;
                    case 'debugger':
                        this.in_debug_mode = true;
                        this.events.on_node_eval?.([op.src_start, op.src_end]); // Highlight debugger statement
                        this.events.on_debugger?.();
                        this.events.on_state_dump?.();
                        yield; // Always pause on debugger
                        last_src_start = op.src_start;
                        last_src_end = op.src_end;
                        break;
                }
            } catch (e: any) {
                this.events.on_error?.(e.message);
                return;
            }

            this.ip++;
            ops_count++;
            if (this.should_yield(op.src_start, op.src_end, last_src_start, last_src_end) || ops_count > 2000) {
                last_src_start = op.src_start;
                last_src_end = op.src_end;
                ops_count = 0;
                yield;
            }
        }
    }

    private should_yield(curr_start: number, curr_end: number, last_start: number, last_end: number): boolean {
        // Yield if we are in debug mode AND the source position has changed
        if (this.in_debug_mode) {
            return curr_start !== last_start || curr_end !== last_end;
        }
        // In non-debug mode, we don't yield on every instruction to be faster, 
        // BUT the outer loop (index.ts) expects BATCH_SIZE yields.
        // If we don't yield, we might freeze the UI.
        // Actually, we SHOULD yield every instruction or every N instructions to let the event loop breathe,
        // but since index.ts uses a batch loop (run 100 times), yielding here just returns to that loop.
        // So yielding every instruction is fine and safest.
        // Wait, the User Request says: "the VM should keep executing bytecode until the src_start and/or src_end changes"
        // This is specifically for "delta updating the generator" context (step 3/step 4).
        // If in Run mode (not debug), we can probably just yield normally (every instruction) or for performance optimization
        // we could yield less often. 
        // NOTE: If we yield ONLY on src change in Run mode, `index.ts` might run fewer "visual steps" per frame.
        // Let's stick to: Yield if src changes OR we just want to yield to be safe.
        // However, the prompt specifically asked for the "VM should keep executing... until ... changes" behavior.
        // I will apply this behavior universally as it makes "step" consistent.
        return curr_start !== last_start || curr_end !== last_end;
    }

    private apply_binary(left: perc_type, right: perc_type, op: string): perc_type {
        switch (op) {
            case '+': return left.add(right);
            case '-': return left.sub(right);
            case '*': return left.mul(right);
            case '/': return left.div(right);
            case '%': return left.mod(right);
            case '==': return left.eq(right);
            case '!=': return left.ne(right);
            case '<': return left.lt(right);
            case '<=': return left.le(right);
            case '>': return left.gt(right);
            case '>=': return left.ge(right);
            case '&&': return new perc_bool(left.is_truthy() && right.is_truthy());
            case '||': return new perc_bool(left.is_truthy() || right.is_truthy());
            case '**': return left.pow(right);
            case '&': return left.bitwise_and(right);
            case '|': return left.bitwise_or(right);
            case '^': return left.bitwise_xor(right);
            case '<<': return left.shl(right);
            case '>>': return left.shr(right);
            default: return new perc_err(`Unknown operator: ${op}`);
        }
    }

    private apply_unary(u: perc_type, op: string): perc_type {
        switch (op) {
            case '-': return new perc_number(0).sub(u);
            case '!':
            case 'not': return u.not();
            default: return new perc_err(`Unknown unary operator: ${op}`);
        }
    }

    private push(val: perc_type) {
        this.stack.push(val);
        if (this.in_debug_mode) {
            this.events.on_stack_push?.(val);
            this.events.on_stack_top_update?.(val);
        }
    }

    private pop(): perc_type {
        if (this.stack.length === 0) throw new Error("Stack underflow");
        const v = this.stack.pop()!;
        if (v instanceof perc_err) throw new Error(v.value);

        // Notify top update
        if (this.in_debug_mode) {
            if (this.stack.length > 0) {
                this.events.on_stack_top_update?.(this.stack[this.stack.length - 1]);
            } else {
                this.events.on_stack_top_update?.(null);
            }
        }

        return v;
    }
}
