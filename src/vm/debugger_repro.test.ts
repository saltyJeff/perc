import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VM } from './index';
// @ts-ignore
import parser from '../perc-grammar.pegjs';
import { perc_string, perc_nil } from './perc_types';

describe('Debugger Repro', () => {
    let vm: VM;

    beforeEach(() => {
        vm = new VM();
    });

    it('should report correct loop variable value during iteration', () => {
        const varUpdates: { name: string, value: string }[] = [];

        vm.set_events({
            on_var_update: (name, value, range) => {
                varUpdates.push({ name, value: value.to_string() });
            }
        });

        const code = `
            init s = "abc"
            for (init c in s) then {
                // do nothing
            }
        `;

        vm.execute(code, parser);
        vm.in_debug_mode = true;
        const iterator = vm.run();
        let result = iterator.next();
        while (!result.done) {
            result = iterator.next();
        }

        // Filter updates for 'c'
        const cUpdates = varUpdates.filter(u => u.name === 'c');

        expect(cUpdates.length).toBeGreaterThan(0);
        expect(cUpdates[0].value).toBe('a');
        expect(cUpdates[1].value).toBe('b');
        expect(cUpdates[2].value).toBe('c');

        // Ensure no 'nil' updates for 'c'
        const nilUpdates = cUpdates.filter(u => u.value === 'nil');
        expect(nilUpdates.length).toBe(0);
    });

    it('should distinguish string value from type', () => {
        const s = new perc_string("hello");
        expect(s.to_string()).toBe("hello");
        expect(s.type).toBe("string");
    });
});
