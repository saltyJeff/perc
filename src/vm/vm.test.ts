import { describe, it, expect, vi } from 'vitest';
import { VM } from "./index.ts";
import { perc_number, perc_string, perc_nil, perc_closure } from "./perc_types.ts";
import type { opcode } from "./opcodes.ts";

describe('PerC Virtual Machine', () => {
    const runVM = (code: opcode[], setup?: (vm: VM) => void) => {
        const vm = new VM(code);
        const printed: string[] = [];
        let lastStackVal: any = null;

        vm.set_events({
            on_stack_push: (val) => { lastStackVal = val; }
        });

        vm.register_foreign("print", (arg) => {
            const s = arg.to_string();
            printed.push(s);
            return new perc_nil();
        });

        if (setup) setup(vm);
        vm.in_debug_mode = true;

        const runner = vm.run();

        let steps = 0;
        let result = runner.next();
        while (!result.done && steps < 5000) {
            result = runner.next();
            steps++;
        }

        return { lastStackVal, printed, steps, done: result.done };
    };
    it('should perform basic arithmetic (10 + 20)', () => {
        const code: opcode[] = [
            { type: 'push', imm: new perc_number(10), src_start: 0, src_end: 0 },
            { type: 'push', imm: new perc_number(20), src_start: 0, src_end: 0 },
            { type: 'binary_op', op: '+', src_start: 0, src_end: 0 }
        ];
        const { lastStackVal } = runVM(code);
        expect(lastStackVal?.to_string()).toBe("30");
    });

    it('should calculate Fibonacci(6) recursively', () => {
        const fib_code: opcode[] = [
            /* 0 */ { type: 'make_closure', addr: 6, captured: [], name: 'fib', src_start: 0, src_end: 0 },
            /* 1 */ { type: 'init', name: 'fib', catch: false, src_start: 0, src_end: 0 },
            /* 2 */ { type: 'push', imm: new perc_number(6), src_start: 0, src_end: 0 },
            /* 3 */ { type: 'load', name: 'fib', src_start: 0, src_end: 0 },
            /* 4 */ { type: 'call', nargs: 1, src_start: 0, src_end: 0 },
            /* 5 */ { type: 'jump', addr: 99, src_start: 0, src_end: 0 },

            // Closure body (addr 6)
            /* 6 */ { type: 'init', name: 'n', catch: false, src_start: 0, src_end: 0 },
            /* 7 */ { type: 'load', name: 'n', src_start: 0, src_end: 0 },
            /* 8 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 9 */ { type: 'binary_op', op: '<=', src_start: 0, src_end: 0 },
            /* 10*/ { type: 'jump_if_false', addr: 13, src_start: 0, src_end: 0 },
            /* 11*/ { type: 'load', name: 'n', src_start: 0, src_end: 0 },
            /* 12*/ { type: 'ret', src_start: 0, src_end: 0 },

            /* 13*/ { type: 'load', name: 'n', src_start: 0, src_end: 0 },
            /* 14*/ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 15*/ { type: 'binary_op', op: '-', src_start: 0, src_end: 0 },
            /* 16*/ { type: 'load', name: 'fib', src_start: 0, src_end: 0 },
            /* 17*/ { type: 'call', nargs: 1, src_start: 0, src_end: 0 },

            /* 18*/ { type: 'load', name: 'n', src_start: 0, src_end: 0 },
            /* 19*/ { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
            /* 20*/ { type: 'binary_op', op: '-', src_start: 0, src_end: 0 },
            /* 21*/ { type: 'load', name: 'fib', src_start: 0, src_end: 0 },
            /* 22*/ { type: 'call', nargs: 1, src_start: 0, src_end: 0 },

            /* 23*/ { type: 'binary_op', op: '+', src_start: 0, src_end: 0 },
            /* 24*/ { type: 'ret', src_start: 0, src_end: 0 }
        ];
        const { lastStackVal } = runVM(fib_code);
        expect(lastStackVal?.to_string()).toBe("8");
    });

    it('should pass the "Kitchen Sink" comprehensive test', () => {
        const sink_code: opcode[] = [
            /* 0 */ { type: 'push', imm: new perc_number(3), src_start: 0, src_end: 0 },
            /* 1 */ { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
            /* 2 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 3 */ { type: 'new_array', size: 3, src_start: 0, src_end: 0 },
            /* 4 */ { type: 'init', name: 'list', catch: false, src_start: 0, src_end: 0 },
            /* 5 */ { type: 'push', imm: new perc_number(0), src_start: 0, src_end: 0 },
            /* 6 */ { type: 'init', name: 'sum', catch: false, src_start: 0, src_end: 0 },
            /* 7 */ { type: 'load', name: 'list', src_start: 0, src_end: 0 },
            /* 8 */ { type: 'get_iter', src_start: 0, src_end: 0 },
            /* 9 */ { type: 'iter_next', src_start: 0, src_end: 0 },
            /* 10*/ { type: 'jump_if_false', addr: 18, src_start: 0, src_end: 0 },
            /* 11*/ { type: 'init', name: 'x', catch: false, src_start: 0, src_end: 0 },
            /* 12*/ { type: 'load', name: 'sum', src_start: 0, src_end: 0 },
            /* 13*/ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            /* 14*/ { type: 'binary_op', op: '+', src_start: 0, src_end: 0 },
            /* 15*/ { type: 'store', name: 'sum', catch: false, src_start: 0, src_end: 0 },
            /* 16*/ { type: 'jump', addr: 9, src_start: 0, src_end: 0 },
            /* 17*/ { type: 'jump', addr: 18, src_start: 0, src_end: 0 },
            /* 18*/ { type: 'load', name: 'sum', src_start: 0, src_end: 0 },
            /* 19*/ { type: 'push', imm: new perc_number(5), src_start: 0, src_end: 0 },
            /* 20*/ { type: 'binary_op', op: '>', src_start: 0, src_end: 0 },
            /* 21*/ { type: 'jump_if_false', addr: 25, src_start: 0, src_end: 0 },
            /* 22*/ { type: 'push', imm: new perc_string("Large"), src_start: 0, src_end: 0 },
            /* 23*/ { type: 'call_foreign', name: 'print', nargs: 1, src_start: 0, src_end: 0 },
            /* 24*/ { type: 'jump', addr: 27, src_start: 0, src_end: 0 },
            /* 25*/ { type: 'push', imm: new perc_string("Small"), src_start: 0, src_end: 0 },
            /* 26*/ { type: 'call_foreign', name: 'print', nargs: 1, src_start: 0, src_end: 0 },
            /* 27*/ { type: 'make_closure', addr: 32, captured: ['sum'], name: 'getSumClosure', src_start: 0, src_end: 0 },
            /* 28*/ { type: 'init', name: 'getSumClosure', catch: false, src_start: 0, src_end: 0 },
            /* 29*/ { type: 'load', name: 'getSumClosure', src_start: 0, src_end: 0 },
            /* 30*/ { type: 'call', nargs: 0, src_start: 0, src_end: 0 },
            /* 31*/ { type: 'jump', addr: 99, src_start: 0, src_end: 0 },
            /* 32*/ { type: 'load', name: 'sum', src_start: 0, src_end: 0 },
            /* 33*/ { type: 'ret', src_start: 0, src_end: 0 }
        ];
        const { lastStackVal, printed } = runVM(sink_code);
        expect(lastStackVal?.to_string()).toBe("6");
        expect(printed).toContain("Large");
    });
});
