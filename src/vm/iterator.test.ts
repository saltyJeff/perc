import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './index';
import { parser } from "../lang.grammar";
import { perc_string } from './perc_types';

describe('Iterator Features', () => {
    let vm: VM;

    beforeEach(() => {
        vm = new VM();
    });

    const run = (code: string) => {
        vm.execute(code, parser);
        const iterator = vm.run();
        let result: IteratorResult<void>;
        do {
            result = iterator.next();
        } while (!result.done);
    };

    const getVar = (name: string) => {
        return vm.get_global_scope().lookup(name);
    }

    it('should iterate over a string', () => {
        run(`
            init s = "abc"
            init res = ""
            for (init c in s) then {
                change res = res + c
            }
        `);
        expect(getVar('res')?.to_string()).toBe('abc');
    });

    it('should iterate over a string with emojis', () => {
        run(`
            init s = "a😀b"
            init res = ""
            for (init c in s) then {
                change res = res + c
                change res = res + "|"
            }
        `);
        expect(getVar('res')?.to_string()).toBe('a|😀|b|');
    });

    it('should error when iterating over a number', () => {
        let lastError: string | null = null;
        vm.set_events({
            on_error: (msg) => { lastError = msg; }
        });
        run(`
            for (init x in 123) then {
                // should not run
            }
        `);
        expect(lastError).toContain("not iterable");
    });
});
