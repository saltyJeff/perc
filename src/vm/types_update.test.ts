
import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './index';
import { perc_number, perc_string, perc_list, perc_tuple, perc_err, perc_bool, perc_map } from './perc_types';
// We need a parser. Since we don't have easy access to the generated parser module in unit tests (it's built by vite),
// we might need to mock it or use a simplified approach. 
// However, the existing tests seem to use `import { parser } from '../perc-grammar.pegjs'` which relies on the vite plugin.
// Let's assume we can run this via `npx vitest` which uses vite.
import parser from '../perc-grammar.pegjs';

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
            expect(t).toBeInstanceOf(perc_tuple);
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
            // Error behavior: vm halts or returns error.
            // If main script fails, variables might not be set.
            // But if we capture error events?
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

        it('should error on out of bounds indexing', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init t = new (| 10 |)
                init oob = t[2]
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

        it('should error on 0-based indexing for Lists', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init l = new [10, 20]
                init zero = l[0]
            `);
            expect(lastError).toContain('Index out of bounds');
        });

        it('should return error on OOB for Lists', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init l = new [10, 20]
                init oob = l[3]
            `);
            expect(lastError).toContain('Index out of bounds');
        });

        it('should use 1-based indexing for Strings', () => {
            run(`
                init s = "hello"
                init h = s[1]
                init e = s[2]
            `);
            expect(getVar('h')?.to_string()).toBe('h');
            expect(getVar('e')?.to_string()).toBe('e');
        });

        it('should error on 0-based indexing for Strings', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init s = "hello"
                init zero = s[0]
            `);
            expect(lastError).toContain('Index out of bounds');
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
            // We need to catch the parser error
            try {
                run(`init s = 'hello'`);
                // If run doesn't throw (parser error might be caught in run or vm.execute), checks VM error
            } catch (e) {
                // Parser might throw
                expect(e).toBeDefined();
                return;
            }
            // If VM captures error
            // We can't easily check for syntax error string without mocking parser or checking console output if vm swallows it.
            // But let's assume if it fails to parse, vm.execute might throw or log error.
            // Our 'run' helper assumes valid code usually.
            // Let's rely on the fact that 'hello' is not valid syntax anymore.
            // If we can't easily test syntax error here without better test harness, 
            // we can trust the grammar change.
            // But let's try to see if we can assert failure.
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
            // l1 should remain [1, 2]
            // l2 should be [99, 2]
            const l1 = getVar('l1');
            const l2 = getVar('l2');
            expect(l1?.to_string()).toBe('[1, 2]');
            expect(l2?.to_string()).toBe('[99, 2]');
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

        it('should clone tuples (create copy)', () => {
            run(`
                init t1 = new (| 1, 2 |)
                init t2 = clone(t1)
            `);
            const t1 = getVar('t1');
            const t2 = getVar('t2');
            expect(t1).not.toBe(t2); // Different objects
            expect(t1?.to_string()).toBe(t2?.to_string());
        });

        it('should error when cloning primitives', () => {
            let lastError: string | null = null;
            vm.set_events({
                on_error: (msg) => { lastError = msg; }
            });
            run(`
                init n = clone(123)
            `);
            expect(lastError).toContain('Cannot clone primitive type');
        });
    });
});
