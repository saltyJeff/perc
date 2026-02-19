import { describe, it, expect } from 'vitest';
import { VM } from "./index.ts";
import { perc_number, perc_list, perc_map } from "./perc_types.ts";
import type { opcode } from "./opcodes.ts";

describe('PerC Reference Semantics', () => {
    const runVM = (code: opcode[]) => {
        const vm = new VM(code);
        let error: any = null;
        vm.set_events({
            on_error: (msg, loc) => { error = { value: msg, location: loc }; }
        });
        const runner = vm.run();
        let result = runner.next();
        let steps = 0;
        while (!result.done && steps < 1000) {
            result = runner.next();
            steps++;
        }
        return { vm, error };
    };

    it('should clone lists on init', () => {
        // init x = new [1, 2, 3]
        // init y = x
        // x[0] = 99
        // y[0] should still be 1
        const code: opcode[] = [
            /* 0 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 1 */ { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
            /* 2 */ { type: 'push', imm: new perc_number(3), src_start: 0, src_end: 0 },
            /* 3 */ { type: 'new_array', size: 3, src_start: 0, src_end: 0 },
            /* 4 */ { type: 'init', name: 'x', catch: false, src_start: 0, src_end: 0 },

            /* 5 */ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            /* 6 */ { type: 'init', name: 'y', catch: false, src_start: 0, src_end: 0 },

            // x[0] = 99
            /* 7 */ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            /* 8 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 }, // Index 1 (1-based)
            /* 9 */ { type: 'push', imm: new perc_number(99), src_start: 0, src_end: 0 },
            /* 10*/ { type: 'index_store', catch: false, src_start: 0, src_end: 0 },

            // push y[0]
            /* 11*/ { type: 'load', name: 'y', src_start: 0, src_end: 0 },
            /* 12*/ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 13*/ { type: 'index_load', src_start: 0, src_end: 0 }
        ];

        const { vm, error } = runVM(code);
        if (error) console.error("VM Error:", error);
        const y0 = vm.stack.pop();
        expect(y0?.to_string()).toBe("1");
    });

    it('should reference lists on ref', () => {
        // init x = new [1, 2, 3]
        // ref y = x
        // x[0] = 99
        // y[0] should be 99
        const code: opcode[] = [
            /* 0 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 1 */ { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
            /* 2 */ { type: 'push', imm: new perc_number(3), src_start: 0, src_end: 0 },
            /* 3 */ { type: 'new_array', size: 3, src_start: 0, src_end: 0 },
            /* 4 */ { type: 'init', name: 'x', catch: false, src_start: 0, src_end: 0 },

            /* 5 */ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            /* 6 */ { type: 'ref', name: 'y', catch: false, src_start: 0, src_end: 0 },

            // x[0] = 99
            /* 7 */ { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            /* 8 */ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 9 */ { type: 'push', imm: new perc_number(99), src_start: 0, src_end: 0 },
            /* 10*/ { type: 'index_store', catch: false, src_start: 0, src_end: 0 },

            // push y[0]
            /* 11*/ { type: 'load', name: 'y', src_start: 0, src_end: 0 },
            /* 12*/ { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            /* 13*/ { type: 'index_load', src_start: 0, src_end: 0 }
        ];

        const { vm, error } = runVM(code);
        if (error) console.error("VM Error:", error);
        const y0 = vm.stack.pop();
        expect(y0?.to_string()).toBe("99");
    });

    it('should error when using ref on non-reference types', () => {
        // init x = 10
        // ref y = x -> Error
        const code: opcode[] = [
            { type: 'push', imm: new perc_number(10), src_start: 0, src_end: 0 },
            { type: 'init', name: 'x', catch: false, src_start: 0, src_end: 0 },
            { type: 'load', name: 'x', src_start: 0, src_end: 0 },
            { type: 'ref', name: 'y', catch: false, src_start: 10, src_end: 20 } // Dummy loc
        ];

        const { vm, error } = runVM(code);
        expect(error).not.toBeNull();
        expect(error.value).toContain("Cannot ref a non-reference type");
        expect(error.location).toEqual([10, 20]);
    });
});
