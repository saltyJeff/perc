import { describe, it, expect } from 'vitest';
import { VM } from '../src/vm/index';
import { Compiler } from '../src/vm/compiler';
import { perc_nil } from '../src/vm/perc_types';
import { parser } from '../src/lang.grammar';

describe('PerC Basic Integration Tests', () => {
    const run = (code: string) => {
        const vm = new VM();
        const printed: string[] = [];
        let error: string | null = null;

        vm.set_events({
            on_error: (msg) => { error = msg; }
        });

        vm.register_foreign('print', (...args) => {
            printed.push(args.map(a => a.to_string()).join(' '));
            return new perc_nil();
        });

        vm.register_foreign('println', (...args) => {
            printed.push(args.map(a => a.to_string()).join(' ') + '\n');
            return new perc_nil();
        });

        vm.execute(code, parser);
        const runner = vm.run();
        let result = runner.next();
        let steps = 0;
        while (!result.done && steps < 10000) {
            result = runner.next();
            steps++;
        }

        if (error) throw new Error(`VM Error: ${error}`);
        return { vm, printed };
    };

    it('should run a simple script', () => {
        const { printed } = run('init x = 10; init y = 20; print(x + y);');
        expect(printed).toContain('30');
    });

    it('should support implicit semicolons (ASI)', () => {
        const code = `
            init a = 5
            init b = 10
            print(a + b)
        `;
        const { printed } = run(code);
        expect(printed).toContain('15');
    });

    it('should handle complex logic with functions', () => {
        const code = `
            function fact(n) {
                if (n <= 1) then {
                    return 1
                }
                return n * fact(n - 1)
            }
            print(fact(5))
        `;
        const { printed } = run(code);
        expect(printed).toContain('120');
    });

    it('should run recursive Fibonacci', () => {
        const code = `
            function fib(n) {
                if (n <= 1) then {
                    return n
                }
                return fib(n - 1) + fib(n - 2)
            }
            print(fib(7))
        `;
        const { printed } = run(code);
        expect(printed).toContain('13');
    });

    it('should handle a "Kitchen Sink" test with maps, lists only, loops', () => {
        const code = `
            init arr = new [1, 2, 3]
            change arr[1] = 10
            
            init m = new { "key": "value", "count": 42 }
            change m["count"] = m["count"] + 8
            
            init sum = 0
            for (init x in arr) then {
                change sum = sum + x
            }
            
            if (sum > 10) then {
                print("Sum is large: " + sum)
            } else {
                print("Sum is small: " + sum)
            }
            
            print("Map count: " + m["count"])
        `;
        const { printed } = run(code);
        expect(printed).toEqual(['Sum is large: 15', 'Map count: 50']);
    });

    it('should handle comprehensive list reference and mutation', () => {
        const code = `
            init x = new [1, 2, 3]
            ref y = x
            change y[1] = 4
            print(len(y))
            print(x[1])
        `;
        const { printed } = run(code);
        expect(printed).toContain('3'); // len(y)
        expect(printed).toContain('4'); // x[1] updated via y
    });

    it('should support custom foreign functions', () => {
        const vm = new VM();
        const results: number[] = [];
        vm.register_foreign('save_result', (val) => {
            results.push((val as any).buffer[0]);
            return new perc_nil();
        });

        // Need to use compiler with knowledge of the foreign function
        const compiler = new Compiler(['print', 'save_result']);

        const code = `
            init x = 5
            save_result(x * 2)
        `;

        const tree = parser.parse(code);
        const { opcodes } = compiler.compile(code, tree);
        vm.reset_state();
        (vm as any).code = opcodes;

        const runner = vm.run();
        let r = runner.next();
        while (!r.done) r = runner.next();

        expect(results).toEqual([10]);
    });

    it('should support println function', () => {
        const { printed } = run(`
            print("Hello ")
            print("World")
            println("!")
            print("New line")
        `);
        expect(printed).toEqual(['Hello ', 'World', '!\n', 'New line']);
    });
});
