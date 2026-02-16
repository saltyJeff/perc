
import { describe, test, expect } from "vitest";
import * as peggy from "peggy";
import fs from "fs";
import { parse as lezerParse } from "./ast-adapter";

// Load Peggy grammar
const grammar = fs.readFileSync("./src/perc-grammar.pegjs", "utf-8");
const peggyParser = peggy.generate(grammar);

function peggyParse(code: string) {
    try {
        return peggyParser.parse(code);
    } catch (e: any) {
        throw new Error(`Peggy parse failed: ${e.message}`);
    }
}

function stripLocation(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(stripLocation);
    } else if (obj && typeof obj === "object") {
        const newObj: any = {};
        for (const key in obj) {
            if (key === "location") continue;
            newObj[key] = stripLocation(obj[key]);
        }
        return newObj;
    }
    return obj;
}

const testCases = [
    // correct syntax
    `init a = 1;`,
    `change a = 2;`,
    `function foo(a, b) { return a + b; }`,
    `if (a > b) then { print("greater"); } else { print("smaller"); }`,
    `while (true) then { break; }`,
    `for (init i in list) then { print(i); }`,
    `init arr = new [1, 2, 3];`,
    `init map = new { "a": 1, "b": 2 };`,
    `init tuple = new (| 1, 2 |);`,
    `print(a.b[c]);`,
    `init x = new [1, 2];`,
    `init y = function(a) { return a; };`,

    // Expressions
    `init a = 1 + 2 * 3;`,
    `init b = (1 + 2) * 3;`,
    `init c = -a;`,
    `init d = not true;`,
    `init e = a and b or c;`,

    // Literals
    `init hex = 0xFF;`,
    `init bin = 0b101;`,
    `init float = 3.14;`,
    `init str = "hello world";`,
    `init bool = true;`,
    `init n = nil;`
];

describe("Grammar Comparison", () => {
    testCases.forEach((code) => {
        test(`matches for: ${code.trim()}`, () => {
            const peggyAST = peggyParse(code);
            const lezerAST = lezerParse(code);

            const cleanPeggy = stripLocation(peggyAST);
            const cleanLezer = stripLocation(lezerAST);

            try {
                expect(cleanLezer).toEqual(cleanPeggy);
            } catch (e) {
                console.log(`Mismatch for: ${code}`);
                fs.writeFileSync("failed_ast.json", JSON.stringify({
                    code,
                    expected: cleanPeggy,
                    received: cleanLezer
                }, null, 2));
                throw e;
            }
        });
    });
});
