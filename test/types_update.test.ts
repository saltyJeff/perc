import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../src/vm/index';
import { perc_map } from '../src/vm/perc_types';
import { parser } from "../lang.grammar";

describe('Types Update', () => {
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

    describe('Immutable Tuples', () => {
        it('should create tuples with (| |) syntax', () => {
            run(`init t = new (| 10, 20, 30 |)`);
            const t = getVar('t');
            expect(t?.to_string()).toBe('(| 10, 20, 30 |)');
        });

        it('should support 1-based indexing', () => {
            run(`
                init t = new (| 10, 20, 30 |)
                init first = t[1]
                init second = t[2]
                init third = t[3]
            `);
            expect(getVar('first')?.to_string()).toBe('10');
            expect(getVar('second')?.to_string()).toBe('20');
            expect(getVar('third')?.to_string()).toBe('30');
        });

        it('should error on 0-based indexing', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init t = new (| 10, 20, 30 |)
                init zero = t[0]
            `);
            expect(lastError).toContain('Index out of bounds');
        });

        it('should be immutable (write throws error)', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init t = new (| 10, 20 |)
                change t[1] = 99
            `);
            expect(lastError).toContain('Tuples are immutable');
        });
    });

    describe('1-based Indexing for Lists and Strings', () => {
        it('should use 1-based indexing for Lists', () => {
            run(`
                init l = new [10, 20, 30]
                init first = l[1]
            `);
            expect(getVar('first')?.to_string()).toBe('10');
        });

        it('should handle emoji characters as single units', () => {
            run(`
                init s = "😀😃"
                init first = s[1]
                init second = s[2]
            `);
            expect(getVar('first')?.to_string()).toBe('😀');
            expect(getVar('second')?.to_string()).toBe('😃');
        });

        it('should fail on single quotes', () => {
            expect(() => run(`init s = 'hello'`)).toThrow();
        });
    });

    describe('Clone Builtin', () => {
        it('should clone lists (shallow copy)', () => {
            run(`
                init l1 = new [1, 2]
                init l2 = clone(l1)
                change l2[1] = 99
            `);
            expect(getVar('l1')?.to_string()).toBe('[1, 2]');
            expect(getVar('l2')?.to_string()).toBe('[99, 2]');
        });

        it('should clone maps (shallow copy)', () => {
            run(`
                init m1 = new {"a": 1}
                init m2 = clone(m1)
                change m2.a = 99
            `);
            const m1 = getVar('m1');
            const m2 = getVar('m2');
            expect((m1 as perc_map).data.get('a')?.to_string()).toBe('1');
            expect((m2 as perc_map).data.get('a')?.to_string()).toBe('99');
        });
    });
});
