import type { opcode } from "./opcodes.ts";
import { perc_type, perc_bool, perc_err, perc_closure, perc_number, perc_string, perc_list, perc_map, perc_tuple } from "./perc_types.ts";
import type { perc_iterator } from "./perc_types.ts";
import { Compiler } from "./compiler.ts";
import { standardBuiltins } from "./builtins.ts";

export interface VMEventMap {
    on_frame_push: (frame: Frame) => void;
    on_frame_pop: () => void;
    on_var_update: (name: string, value: perc_type, range: [number, number] | null) => void;
    on_stack_push: (value: perc_type) => void;
    on_node_eval: (range: [number, number]) => void;
    on_debugger: () => void;
    on_state_dump: () => void;
    on_error: (err: string, location: [number, number] | null) => void;
    on_stack_top_update: (val: perc_type | null) => void;
    on_input_request: (prompt: string) => void;
}

export class Scope {
    values: Map<string, perc_type> = new Map();
    definitions: Map<string, [number, number]> = new Map();
    parent: Scope | null = null;
    is_closure_scope: boolean = false;

    constructor(parent: Scope | null = null) {
        this.parent = parent;
    }

    define(name: string, value: perc_type, range: [number, number]) {
        this.values.set(name, value);
        this.definitions.set(name, range);
    }

    assign(name: string, value: perc_type, range: [number, number]): boolean {
        if (this.values.has(name)) {
            this.values.set(name, value);
            this.definitions.set(name, range);
            return true;
        }
        if (this.parent) return this.parent.assign(name, value, range);
        return false;
    }

    lookup(name: string): perc_type | null {
        if (this.values.has(name)) return this.values.get(name)!;
        if (this.parent) return this.parent.lookup(name);
        return null;
    }

    lookup_definition(name: string): [number, number] | null {
        if (this.definitions.has(name)) return this.definitions.get(name)!;
        if (this.parent) return this.parent.lookup_definition(name);
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
    public stack: perc_type[] = [];
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
        this.register_builtins(standardBuiltins);
    }



    public register_builtins(funcs: Record<string, (...args: perc_type[]) => perc_type>) {
        for (const [name, func] of Object.entries(funcs)) {
            this.register_foreign(name, func);
        }
    }

    reset_state() {
        this.ip = 0;
        this.stack = [];
        this.call_stack = [];
        this.iterators = [];
        this.is_waiting_for_input = false;
        this.in_debug_mode = false;
        // Don't clear foreign_funcs here as they are registered once
        const global_scope = new Scope();
        this.current_frame = new Frame(global_scope, -1, 0, "global");
        // Notify debugger of the initial global frame so it can be populated
        this.events.on_frame_push?.(this.current_frame);
    }

    execute(source: string, parser: any) {
        try {
            const ast = parser.parse(source);
            const compiler = new Compiler(Array.from(this.foreign_funcs.keys()));
            this.code = compiler.compile(ast);
            this.reset_state();
        } catch (e: any) {
            const loc: [number, number] | null = e.location ? [e.location.start.offset, e.location.end.offset] : null;
            console.error(e.message, loc);
            this.events.on_error?.(e.message, loc);
            throw e;
        }
    }

    execute_repl(source: string, parser: any) {
        try {
            const ast = parser.parse(source);
            const compiler = new Compiler(Array.from(this.foreign_funcs.keys()));
            // We need to know if we are in a valid state to extend.
            // Ideally, we append code? No, we just want to run this snippet in the current global context.
            // But the compiler produces a full program with END.
            // And `run()` expects to start from 0.

            // Simpler approach for now:
            // 1. Compile the REPL snippet.
            // 2. Set VM code to this new snippet.
            // 3. Reset IP to 0, stack to empty (or keep stack?), but KEEP global scope.
            // 4. Ideally, we should reuse the global scope from the previous run.

            this.code = compiler.compile_repl(ast);

            // Reset state BUT preserve global scope
            this.ip = 0;
            this.stack = [];
            this.call_stack = [];
            this.iterators = [];
            this.is_waiting_for_input = false;
            // this.in_debug_mode = false; // Keep debug mode if set?

            // If we don't have a current frame (first run), create one.
            // If we do, we want to REUSE the global scope.
            if (!this.current_frame) {
                const global_scope = new Scope();
                this.current_frame = new Frame(global_scope, -1, 0, "global");
                this.events.on_frame_push?.(this.current_frame);
            } else {
                // We have a frame. Find the global scope.
                const global_scope = this.get_global_scope();
                // Create a new frame using that same scope
                this.current_frame = new Frame(global_scope, -1, 0, "global"); // Repl is always global for now
                // We might need to notify debugger of this "new" frame start?
                // The debugger might be confused if we just swap frames.
                // But for REPL, it's like a fresh run in the same environment.
                this.events.on_frame_push?.(this.current_frame);
            }

        } catch (e: any) {
            const loc: [number, number] | null = e.location ? [e.location.start.offset, e.location.end.offset] : null;
            console.error(e.message, loc);
            this.events.on_error?.(e.message, loc);
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

    get_scope_variables(start_scope: Scope): Record<string, { value: perc_type, range: [number, number] | null }> {
        const res: Record<string, { value: perc_type, range: [number, number] | null }> = {};
        let s: Scope | null = start_scope;
        while (s) {
            // If we are at the global scope (parent is null) AND we didn't start at global, 
            // stop traversal to avoid duplicating globals in local frames.
            if (s.parent === null && s !== start_scope) break;

            for (const [k, v] of s.values.entries()) {
                if (!(k in res)) {
                    res[k] = {
                        value: v,
                        range: s.definitions.get(k) || null
                    };
                }
            }
            s = s.parent;
        }
        return res;
    }

    get_current_scope_values(): Record<string, { value: perc_type, range: [number, number] | null }> {
        return this.get_scope_variables(this.current_frame.scope);
    }

    public get_global_scope(): Scope {
        // Find the bottom-most scope of the current frame, or the initial global scope
        if (this.call_stack.length > 0) {
            let s = this.call_stack[0].scope;
            while (s.parent) s = s.parent;
            return s;
        }
        let s = this.current_frame.scope;
        while (s.parent) s = s.parent;
        return s;
    }

    set_events(events: Partial<VMEventMap>) {
        this.events = events;
    }

    register_foreign(name: string, func: (...args: perc_type[]) => perc_type) {
        this.foreign_funcs.set(name, func);
    }

    public get_foreign_funcs(): Map<string, (...args: perc_type[]) => perc_type> {
        return this.foreign_funcs;
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
                        const p_val = this.pop();
                        if (p_val instanceof perc_err) {
                            this.return_error(p_val);
                            // Yield? return_error modifies ip and stack.
                            // We need to `continue` outer loop?
                            // Yes, `return_error` sets IP.
                            // `continue` will restart loop with new IP.
                            // But we need to check yield condition.
                            // `return_error` might change frame.
                            // We should probably `continue` immediately.
                            // BUT `switch` break just goes to `ip++`.
                            // `return_error` sets `ip` to `ret_addr`.
                            // So we should NOT `ip++`.
                            // We should `continue`.
                            continue;
                        }
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
                        const init_val = this.pop();
                        if (init_val instanceof perc_err && !op.catch) {
                            this.return_error(init_val);
                            continue;
                        }
                        this.current_frame.scope.define(op.name, init_val, [op.src_start, op.src_end]);
                        if (this.in_debug_mode) {
                            this.events.on_var_update?.(op.name, this.current_frame.scope.lookup(op.name)!, [op.src_start, op.src_end]);
                        }
                        break;
                    case 'load':
                        const val = this.current_frame.scope.lookup(op.name);
                        if (!val) throw new Error(`Undefined variable: ${op.name}`);
                        this.push(val);
                        break;
                    case 'store':
                        const s_val = this.pop();
                        if (s_val instanceof perc_err && !op.catch) {
                            this.return_error(s_val);
                            continue;
                        }
                        if (!this.current_frame.scope.assign(op.name, s_val, [op.src_start, op.src_end])) {
                            throw new Error(`Cannot assign to uninitialized variable: ${op.name}`);
                        }
                        if (this.in_debug_mode) {
                            this.events.on_var_update?.(op.name, s_val, [op.src_start, op.src_end]);
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
                    case 'typeof':
                        const t_val = this.pop();
                        let type_str = t_val.type;
                        if (['i8', 'u8', 'i16', 'u16', 'i32', 'u32'].includes(type_str)) type_str = 'int';
                        if (['f32', 'f64'].includes(type_str)) type_str = 'float';
                        this.push(new perc_string(type_str));
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
                        const jf_cond = this.pop();
                        if (jf_cond instanceof perc_err) {
                            this.return_error(jf_cond);
                            continue;
                        }
                        if (!jf_cond.is_truthy()) {
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
                        const jt_cond = this.pop();
                        if (jt_cond instanceof perc_err) {
                            this.return_error(jt_cond);
                            continue;
                        }
                        if (jt_cond.is_truthy()) {
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
                        const iter_obj = this.pop();
                        if (iter_obj instanceof perc_err) {
                            this.return_error(iter_obj);
                            continue;
                        }
                        const iterator = iter_obj.get_iterator();
                        if (iterator instanceof perc_err) {
                            this.return_error(iterator);
                            continue;
                        }
                        this.iterators.push(iterator);
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
                        if (func instanceof perc_err) {
                            // Can't call an error
                            this.return_error(func);
                            continue;
                        }
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
                        const res = foreign(...for_args.reverse());
                        this.push(res);
                        break;
                    case 'new_array':
                        const arr_els: perc_type[] = [];
                        let arr_err: perc_err | null = null;
                        for (let i = 0; i < op.size; i++) {
                            const val = this.pop();
                            arr_els.push(val);
                            if (val instanceof perc_err && !arr_err) arr_err = val;
                        }
                        if (arr_err) {
                            this.return_error(arr_err);
                            continue;
                        }
                        this.push(new perc_list(arr_els.reverse()));
                        break;
                    case 'new_map':
                        const m = new perc_map();
                        let map_err: perc_err | null = null;
                        for (let i = 0; i < op.size; i++) {
                            const val = this.pop();
                            const key = this.pop();
                            if (val instanceof perc_err && !map_err) map_err = val;
                            if (key instanceof perc_err && !map_err) map_err = key;
                            m.set(key, val);
                        }
                        if (map_err) {
                            this.return_error(map_err);
                            continue;
                        }
                        this.push(m);
                        break;
                    case 'new_tuple':
                        const tup_els: perc_type[] = [];
                        let tup_err: perc_err | null = null;
                        for (let i = 0; i < op.size; i++) {
                            const val = this.pop();
                            tup_els.push(val);
                            if (val instanceof perc_err && !tup_err) tup_err = val;
                        }
                        if (tup_err) {
                            this.return_error(tup_err);
                            continue;
                        }
                        this.push(new perc_tuple(tup_els.reverse()));
                        break;
                    case 'index_load':
                        const idx = this.pop();
                        const obj = this.pop();
                        if (idx instanceof perc_err) {
                            this.return_error(idx);
                            continue;
                        }
                        if (obj instanceof perc_err) {
                            this.return_error(obj);
                            continue;
                        }
                        this.push(obj.get(idx));
                        break;
                    case 'index_store':
                        const st_val = this.pop();
                        const st_idx = this.pop();
                        const st_obj = this.pop();
                        if (st_val instanceof perc_err && !op.catch) {
                            this.return_error(st_val);
                            continue;
                        }
                        if (st_idx instanceof perc_err) {
                            this.return_error(st_idx);
                            continue;
                        }
                        if (st_obj instanceof perc_err) {
                            this.return_error(st_obj);
                            continue;
                        }
                        const st_res = st_obj.set(st_idx, st_val);
                        if (st_res instanceof perc_err && !op.catch) {
                            this.return_error(st_res);
                            continue;
                        }
                        this.push(st_res);
                        break;
                    case 'member_load':
                        const m_obj = this.pop();
                        // Member load uses a string key
                        if (m_obj instanceof perc_err) {
                            this.return_error(m_obj);
                            continue;
                        }
                        this.push(m_obj.get(new perc_string(op.name)));
                        break;
                    case 'member_store':
                        const ms_val = this.pop();
                        const ms_obj = this.pop();
                        if (ms_val instanceof perc_err && !op.catch) {
                            this.return_error(ms_val);
                            continue;
                        }
                        if (ms_obj instanceof perc_err) {
                            this.return_error(ms_obj);
                            continue;
                        }
                        const ms_res = ms_obj.set(new perc_string(op.name), ms_val);
                        if (ms_res instanceof perc_err && !op.catch) {
                            this.return_error(ms_res);
                            continue;
                        }
                        this.push(ms_res);
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
                    case 'enter_scope':
                        this.current_frame.scope = new Scope(this.current_frame.scope);
                        break;
                    case 'exit_scope':
                        if (this.current_frame.scope.parent) {
                            this.current_frame.scope = this.current_frame.scope.parent;
                        } else {
                            throw new Error("Cannot exit global scope");
                        }
                        break;
                }
            } catch (e: any) {
                console.error(e.message);
                this.events.on_error?.(e.message, null);
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
            case 'is': return new perc_bool(left === right);
            case '!=': return left.ne(right);
            case '<': return left.lt(right);
            case '<=': return left.le(right);
            case '>': return left.gt(right);
            case '>=': return left.ge(right);
            case '&&':
            case 'and': return new perc_bool(left.is_truthy() && right.is_truthy());
            case '||':
            case 'or': return new perc_bool(left.is_truthy() || right.is_truthy());
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

    private return_error(err: perc_err) {
        if (this.call_stack.length === 0) {
            this.ip = -1; // Halt
            console.error(err.value);
            this.events.on_error?.(err.value, err.location); // Report unhandled error
            return;
        }

        const finishing_frame = this.current_frame;
        this.current_frame = this.call_stack.pop()!;
        this.ip = finishing_frame.ret_addr;
        this.push(err);

        if (this.in_debug_mode) {
            this.events.on_frame_pop?.();
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
