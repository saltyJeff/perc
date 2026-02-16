
import { describe, it, expect } from 'vitest';
import { VM } from './index';
import * as peggy from "peggy";
import fs from "fs";
import { perc_list, perc_map, perc_number, perc_tuple } from './perc_types';

const grammar = fs.readFileSync("./src/perc-grammar.pegjs", "utf-8");
const parser = peggy.generate(grammar);

describe('Expanded Suite', () => {
    it('should error on double initialization at compile time', () => {
        const vm = new VM();
        const code = `
            init k = 1;
            init k = 2;
        `;
        expect(() => {
            vm.execute(code, parser);
        }).toThrow(/Variable 'k' already declared/);
    });

    it('should allow re-initialization in a new block (shadowing)', () => {
        const vm = new VM();
        const code = `
            init k = 1;
            {
                init k = 2;
            }
        `;
        expect(() => {
            vm.execute(code, parser);
        }).not.toThrow();

        // Verify values
        const runner = vm.run();
        while (!runner.next().done);

        // Outer k should be 1
        const global_scope = vm.get_global_scope();
        expect(global_scope.lookup('k')?.to_string()).toBe("1");
    });


    it('should initialize list datatype correctly', () => {
        const vm = new VM();
        const code = `
            init i = new [1, 2, 3];
        `;
        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();
        const i = scope['i'].value;
        expect(i).toBeInstanceOf(perc_list);
        const list = i as perc_list;
        expect(list.elements.length).toBe(3);
        expect(list.elements[0].to_string()).toBe("1");
    });

    it('should initialize tuple datatype correctly', () => {
        const vm = new VM();
        const code = `
            init j = new (|1, 2, 3|);
        `;
        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();
        const j = scope['j'].value;
        // Currently correctly implemented as perc_list in VM
        expect(j).toBeInstanceOf(perc_tuple);
        const tuple = j as perc_tuple;
        expect(tuple.elements.length).toBe(3);
        expect(tuple.elements[0].to_string()).toBe("1");
    });

    it('should initialize map datatype correctly', () => {
        const vm = new VM();
        const code = `
            init k = new {"a": 1, "b": 2};
        `;
        vm.execute(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        const scope = vm.get_current_scope_values();
        const k = scope['k'].value;
        expect(k).toBeInstanceOf(perc_map);
        const map = k as perc_map;

        expect(map.data.has("a")).toBe(true);
        expect(map.data.get("a")?.to_string()).toBe("1");
        expect(map.data.get("b")?.to_string()).toBe("2");
    });

    it('should maintain scope across REPL executions', () => {
        const vm = new VM();
        const code1 = `init x = 10;`;
        vm.execute_repl(code1, parser);
        let runner = vm.run();
        while (!runner.next().done);

        const code2 = `init y = x + 5;`;
        vm.execute_repl(code2, parser);
        runner = vm.run();
        while (!runner.next().done);

        const global_scope = vm.get_global_scope();
        expect(global_scope.lookup('x')?.to_string()).toBe("10");
        expect(global_scope.lookup('y')?.to_string()).toBe("15");
    });
    it('should leave expression result on stack for REPL', () => {
        const vm = new VM();
        const code = `1 + 2`;
        vm.execute_repl(code, parser);
        const runner = vm.run();
        while (!runner.next().done);

        expect(vm.stack.length).toBe(1);
        expect(vm.stack[0].to_string()).toBe("3");
    });
});
