import { VM } from "./index.ts";
import { perc_number, perc_string, perc_bool, perc_nil, perc_list, perc_map } from "./perc_types.ts";
import type { opcode } from "./opcodes.ts";

function runTest(name: string, code: opcode[], setup?: (vm: VM) => void, expected?: (result: any) => boolean) {
    console.log(`--- Running Test: ${name} ---`);
    const vm = new VM(code);
    let last_stack_val: any = null;
    let printed: string[] = [];

    vm.set_events({
        on_stack_push: (val) => { last_stack_val = val; },
        on_error: (err) => { console.error(`[${name}] VM Error:`, err); }
    });

    vm.register_foreign("print", (arg) => {
        const s = arg.to_string();
        printed.push(s);
        console.log(`[VM PRINT]: ${s}`);
        return new perc_nil();
    });

    if (setup) setup(vm);

    const runner = vm.run();
    let steps = 0;
    let result = runner.next();
    while (!result.done && steps < 5000) {
        result = runner.next();
        steps++;
    }

    if (steps >= 5000) {
        console.error(`[${name}] Possible infinite loop (hit 5000 steps)`);
    }

    if (expected && !expected({ last_stack_val, printed })) {
        console.log(`[${name}] Result: FAIL (Actual: ${last_stack_val?.to_string()})`);
        return false;
    }
    console.log(`[${name}] Result: PASS (Steps: ${steps})`);
    return true;
}

const fib_code: opcode[] = [
    /* 0 */ { type: 'make_closure', addr: 6, captured: [], src_start: 0, src_end: 0 },
    /* 1 */ { type: 'init', name: 'fib', src_start: 0, src_end: 0 },
    /* 2 */ { type: 'push', imm: new perc_number(6), src_start: 0, src_end: 0 },
    /* 3 */ { type: 'load', name: 'fib', src_start: 0, src_end: 0 },
    /* 4 */ { type: 'call', nargs: 1, src_start: 0, src_end: 0 },
    /* 5 */ { type: 'jump', addr: 99, src_start: 0, src_end: 0 },

    /* 6 */ { type: 'init', name: 'n', src_start: 0, src_end: 0 },
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

const sink_code: opcode[] = [
    /* 0 */ { type: 'push', imm: new perc_number(3), src_start: 0, src_end: 0 },
    /* 1 */ { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
    /* 2 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
    /* 3 */ { type: 'new_array', size: 3, src_start: 0, src_end: 0 },
    /* 4 */ { type: 'init', name: 'list', src_start: 0, src_end: 0 },
    /* 5 */ { type: 'push', imm: new perc_number(0), src_start: 0, src_end: 0 },
    /* 6 */ { type: 'init', name: 'sum', src_start: 0, src_end: 0 },
    /* 7 */ { type: 'load', name: 'list', src_start: 0, src_end: 0 },
    /* 8 */ { type: 'get_iter', src_start: 0, src_end: 0 },
    /* 9 */ { type: 'iter_next', src_start: 0, src_end: 0 },
    /* 10*/ { type: 'jump_if_false', addr: 18, src_start: 0, src_end: 0 },
    /* 11*/ { type: 'init', name: 'x', src_start: 0, src_end: 0 },
    /* 12*/ { type: 'load', name: 'sum', src_start: 0, src_end: 0 },
    /* 13*/ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
    /* 14*/ { type: 'binary_op', op: '+', src_start: 0, src_end: 0 },
    /* 15*/ { type: 'store', name: 'sum', src_start: 0, src_end: 0 },
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
    /* 27*/ { type: 'make_closure', addr: 32, captured: ['sum'], src_start: 0, src_end: 0 },
    /* 28*/ { type: 'init', name: 'getSumClosure', src_start: 0, src_end: 0 },
    /* 29*/ { type: 'load', name: 'getSumClosure', src_start: 0, src_end: 0 },
    /* 30*/ { type: 'call', nargs: 0, src_start: 0, src_end: 0 },
    /* 31*/ { type: 'jump', addr: 99, src_start: 0, src_end: 0 },
    /* 32*/ { type: 'load', name: 'sum', src_start: 0, src_end: 0 },
    /* 33*/ { type: 'ret', src_start: 0, src_end: 0 }
];

console.log("Starting Advanced VM Tests...");
runTest("Fibonacci(6)", fib_code, undefined, (res) => res.last_stack_val?.to_string() === "8");
runTest("Kitchen Sink", sink_code, undefined, (res) => {
    const isSumCorrect = res.last_stack_val?.to_string() === "6";
    const printedLarge = res.printed.includes("Large");
    return isSumCorrect && printedLarge;
});
console.log("Advanced Tests Complete.");
