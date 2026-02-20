import { describe, it, expect, vi } from 'vitest';
import { VM } from '../src/vm/index';
import { parser } from '../src/lang.grammar';
import { perc_string, perc_err } from '../src/vm/perc_types';

describe('Error Handling', () => {
    it('should support typeof operator', () => {
        const vm = new VM();
        const code = `
            init t_int = typeof(1);
            init t_float = typeof(1.0);
            init t_bool = typeof(true);
            init t_str = typeof("s");
            init t_list = typeof(new [1]);
            init t_map = typeof(new {"a":1});
            init t_err = typeof(1/0);
        `;
        try {
            vm.execute(code, parser);
        } catch (e: any) {
            console.error("Exec Error:", e.message);
            throw e;
        }

        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();

        expect((scope['t_int'].value as perc_string).value).toBe('int');
        expect((scope['t_float'].value as perc_string).value).toBe('float');
        expect((scope['t_bool'].value as perc_string).value).toBe('bool');
        expect((scope['t_str'].value as perc_string).value).toBe('string');
        expect((scope['t_list'].value as perc_string).value).toBe('list');
        expect((scope['t_map'].value as perc_string).value).toBe('map');
        expect((scope['t_err'].value as perc_string).value).toBe('error');
    });

    it('should support other unary operators', () => {
        const vm = new VM();
        const code = `
            init b = !true;
            init n = -1;
        `;
        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);
    });

    it('should catch errors with =? operator', () => {
        const vm = new VM();
        const code = `
            init x =? 1/0;
        `;
        const onError = vi.fn();
        vm.set_events({ on_error: onError });

        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        expect(onError).not.toHaveBeenCalled();
        const scope = vm.get_current_scope_values();
        const x = scope['x'].value;
        expect(x).toBeInstanceOf(perc_err);
        expect((x as perc_err).value).toContain('Division by zero');
    });

    it('should panic and report uncaught errors', () => {
        const vm = new VM();
        const code = `
            init x = 1/0;
        `;
        const onError = vi.fn();
        vm.set_events({ on_error: onError });

        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        expect(onError).toHaveBeenCalled();
        expect(onError.mock.calls[0][0]).toContain('Division by zero');
    });

    it('should bubble up errors from functions', () => {
        const vm = new VM();
        const code = `
            function f() {
                1/0;
                return 5;
            }
            init x =? f();
        `;
        const onError = vi.fn();
        vm.set_events({ on_error: onError });

        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        expect(onError).not.toHaveBeenCalled();
        const scope = vm.get_current_scope_values();
        const x = scope['x'].value;
        expect(x).toBeInstanceOf(perc_err);
    });

    it('should propagate errors in expressions', () => {
        const vm = new VM();
        const code = `
            init x =? (1/0) + 5;
        `;
        const onError = vi.fn();
        vm.set_events({ on_error: onError });

        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();
        const x = scope['x'].value;
        expect(x).toBeInstanceOf(perc_err);
    });

    it('should propagate errors in complex expressions', () => {
        const vm = new VM();
        const code = `
            init x =? 5 + (1/0);
        `;
        const onError = vi.fn();
        vm.set_events({ on_error: onError });

        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();
        expect(scope['x'].value).toBeInstanceOf(perc_err);
    });
});
