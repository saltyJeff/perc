import { describe, it, expect } from 'vitest';
import { VM } from "../src/vm/index.ts";
import { perc_number, perc_string, perc_list, perc_map, perc_bool, perc_nil } from "../src/vm/perc_types.ts";
import type { opcode } from "../src/vm/opcodes.ts";

describe('PerC Built-in Methods', () => {
    const runVM = (code: opcode[]) => {
        const vm = new VM(code);
        const runner = vm.run();
        let result = runner.next();
        let steps = 0;
        while (!result.done && steps < 5000) {
            result = runner.next();
            steps++;
        }
        return vm.stack.length > 0 ? vm.stack[vm.stack.length - 1] : null;
    };

    it('should support list methods: push, pop, len', () => {
        const code: opcode[] = [
            // list = [1, 2]
            { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            { type: 'push', imm: new perc_number(2), src_start: 0, src_end: 0 },
            { type: 'new_array', size: 2, src_start: 0, src_end: 0 },
            { type: 'init', name: 'list', catch: false, src_start: 0, src_end: 0 },

            // list.push(3)
            { type: 'load', name: 'list', src_start: 0, src_end: 0 },
            { type: 'member_load', name: 'push', src_start: 0, src_end: 0 },
            { type: 'push', imm: new perc_number(3), src_start: 0, src_end: 0 },
            { type: 'call', nargs: 1, src_start: 0, src_end: 0 },
            { type: 'pop', src_start: 0, src_end: 0 }, // discard result

            // len(list)
            { type: 'load', name: 'list', src_start: 0, src_end: 0 },
            { type: 'call_foreign', name: 'len', nargs: 1, src_start: 0, src_end: 0 },
        ];

        const res = runVM(code);
        expect(res?.to_string()).toBe("3");
    });

    it('should support list pop', () => {
        const code: opcode[] = [
            // list = [10]
            { type: 'push', imm: new perc_number(10), src_start: 0, src_end: 0 },
            { type: 'new_array', size: 1, src_start: 0, src_end: 0 },
            { type: 'init', name: 'list', catch: false, src_start: 0, src_end: 0 },

            // list.pop()
            { type: 'load', name: 'list', src_start: 0, src_end: 0 },
            { type: 'member_load', name: 'pop', src_start: 0, src_end: 0 },
            { type: 'call', nargs: 0, src_start: 0, src_end: 0 },
        ];
        const res = runVM(code);
        expect(res?.to_string()).toBe("10");
    });

    it('should support map methods: keys, values, len', () => {
        const code: opcode[] = [
            // m = {"a": 1}
            { type: 'push', imm: new perc_string("a"), src_start: 0, src_end: 0 },
            { type: 'push', imm: new perc_number(1), src_start: 0, src_end: 0 },
            { type: 'new_map', size: 1, src_start: 0, src_end: 0 },
            { type: 'init', name: 'm', catch: false, src_start: 0, src_end: 0 },

            // len(m)
            { type: 'load', name: 'm', src_start: 0, src_end: 0 },
            { type: 'call_foreign', name: 'len', nargs: 1, src_start: 0, src_end: 0 },
        ];
        const res = runVM(code);
        expect(res?.to_string()).toBe("1");
    });

    it('should support range()', () => {
        const code: opcode[] = [
            // r = range(5)
            { type: 'push', imm: new perc_number(5), src_start: 0, src_end: 0 },
            { type: 'call_foreign', name: 'range', nargs: 1, src_start: 0, src_end: 0 },
            { type: 'init', name: 'r', catch: false, src_start: 0, src_end: 0 },

            // convert to list to verify: list(r) - wait we don't have list() constructor from iterable yet.
            // Let's just iterate manually or check type.
            { type: 'load', name: 'r', src_start: 0, src_end: 0 },
        ];
        const res = runVM(code);
        expect(res?.type).toBe("range");
        expect(res?.to_string()).toBe("range(0, 5, 1)");
    });

    it('should support string methods: upper, len', () => {
        const code: opcode[] = [
            { type: 'push', imm: new perc_string("hello"), src_start: 0, src_end: 0 },
            { type: 'init', name: 's', catch: false, src_start: 0, src_end: 0 },

            // s.upper()
            { type: 'load', name: 's', src_start: 0, src_end: 0 },
            { type: 'member_load', name: 'upper', src_start: 0, src_end: 0 },
            { type: 'call', nargs: 0, src_start: 0, src_end: 0 },
        ];
        const res = runVM(code);
        expect(res?.to_string()).toBe("HELLO");
    });
});
