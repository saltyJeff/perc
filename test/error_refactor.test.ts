import { describe, it, expect, vi } from 'vitest';
import { VM } from '../src/vm/index';
import { parser } from '../src/lang.grammar';
import { perc_number, perc_err } from '../src/vm/perc_types';

describe('Error Handling Refactor', () => {

    it('should detect undefined variable as compile error', () => {
        const vm = new VM();
        vm.register_foreign("print", () => new perc_err("mock"));
        const source = `
            init x = 10;
            print(y);
        `;

        try {
            vm.execute(source, parser);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e.message).toContain("Variable 'y' is not defined");
            expect(e.name).toBe("PercCompileError");
        }
    });

    it('should detect variable re-initialization as compile error', () => {
        const vm = new VM();
        const source = `
            init x = 10;
            init x = 20;
        `;

        try {
            vm.execute(source, parser);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e.message).toContain("Variable 'x' already declared");
            expect(e.name).toBe("PercCompileError");
        }
    });

    it('should allow variable shadowing in inner scope', () => {
        const vm = new VM();
        const source = `
            init x = 10;
            if (true) then {
                init x = 20; 
                // This is allowed as shadowing
            }
        `;

        // Should not throw
        vm.execute(source, parser);
    });

    it('should detect accessing inner scope variable from outer scope', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const vm = new VM();
        vm.register_foreign("print", () => new perc_err("mock"));
        const source = `
            if (true) then {
                init z = 30;
            }
            print(z);
        `;

        try {
            vm.execute(source, parser);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e.message).toContain("Variable 'z' is not defined");
        }
        spy.mockRestore();
    });

    it('should return runtime error instead of throwing', () => {
        const vm = new VM();
        // Division by zero is a runtime error handled by perc_type.div
        // But let's use something that triggers return_error
        // e.g. calling a number
        const source = `
            init x = 10;
            x();
        `;

        const errorSpy = vi.fn();
        vm.set_events({
            on_error: errorSpy
        });

        vm.execute(source, parser);

        // Execute the code
        const runner = vm.run();
        let result = runner.next();
        while (!result.done) {
            result = runner.next();
        }

        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy.mock.calls[0][0]).toContain("Object is not callable");
    });

    it('should run successfully twice on reused VM', () => {
        const vm = new VM();
        const source = `init x = 10;`;

        // Run 1
        vm.execute(source, parser);
        let runner = vm.run();
        let res = runner.next();
        while (!res.done) res = runner.next();

        // Run 2
        vm.execute(source, parser);
        runner = vm.run();
        res = runner.next();
        while (!res.done) res = runner.next();

        // If we get here, it didn't crash or get stuck
        expect(true).toBe(true);
    });
});
