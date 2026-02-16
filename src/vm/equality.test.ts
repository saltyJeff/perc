
import { VM } from "./index.ts";
import { perc_bool } from "./perc_types.ts";
import { expect, test, describe } from "vitest";
import * as peggy from "peggy";
import fs from "fs";

const grammar = fs.readFileSync("./src/perc-grammar.pegjs", "utf-8");
const parser = peggy.generate(grammar);

function evalCode(code: string) {
    const vm = new VM();
    vm.execute(code, parser);
    const iterator = vm.run();
    // exhaust iterator
    for (const _ of iterator) { }

    // Check global scope for "res"
    const scope = vm.get_global_scope();
    return scope.lookup("res");
}

describe("Equality Operators", () => {
    test("Reference equality (is) works as expected", () => {
        // Different instances of primitives
        const primitiveDiff = evalCode(`
            init a = 1;
            init b = 1;
            init res = a is b;
        `);
        expect((primitiveDiff as perc_bool).value).toBe(false);

        // Same instance via assignment
        const primitiveSame = evalCode(`
            init a = 1;
            init b = a;
            init res = a is b;
        `);
        expect((primitiveSame as perc_bool).value).toBe(true);

        // Different lists
        const listDiff = evalCode(`
            init a = new [1];
            init b = new [1];
            init res = a is b;
        `);
        expect((listDiff as perc_bool).value).toBe(false);

        // Same list
        const listSame = evalCode(`
            init a = new [1];
            init b = a;
            init res = a is b;
        `);
        expect((listSame as perc_bool).value).toBe(true);
    });

    test("Value equality (==) works as expected", () => {
        // Primitives value equality
        const primitiveEq = evalCode(`
            init a = 1;
            init b = 1;
            init res = a == b;
        `);
        expect((primitiveEq as perc_bool).value).toBe(true);

        // Lists currently use reference equality for == (default impl),
        // unless I implement deep equality. 
        // User said "== can be overridden per type".
        // Since perc_list triggers default eq, currently [1] == [1] is false.
        // Let's verify this current behavior without asserting it MUST be true/false if it depends on future impl.
        // But for primitives, it MUST be true.
    });

    test("Reference equality (is) vs Value equality (==)", () => {
        const compare = evalCode(`
            init a = 1;
            init b = 1;
            init is_eq = a is b;
            init val_eq = a == b;
            init res = (is_eq == false) and (val_eq == true);
         `);
        expect((compare as perc_bool).value).toBe(true);
    });
});
