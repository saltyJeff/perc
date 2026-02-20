import { VM } from "../src/vm/index.ts";
import { perc_number, perc_string, perc_bool, perc_nil } from "../src/vm/perc_types.ts";
import { expect, test, describe } from "vitest";
import { parser } from "../src/lang.grammar";

describe("Extended Features", () => {
    const run = (code: string) => {
        const vm = new VM();
        let lastTop: any = null;
        vm.set_events({
            on_stack_top_update: (val) => lastTop = val
        });
        vm.execute(code, parser);
        const gen = vm.run();
        while (!gen.next().done) { }
        return lastTop;
    };

    const run_capture_print = (code: string) => {
        try {
            const vm = new VM();
            const output: string[] = [];
            vm.register_foreign("print", (arg) => {
                output.push(arg.to_string());
                return new perc_nil();
            });
            vm.execute(code, parser);
            const gen = vm.run();
            while (!gen.next().done) { }
            return output;
        } catch (e) {
            console.error("VM/Test Error:", e);
            throw e;
        }
    };


    test("Bitwise Operations", () => {
        expect(run_capture_print("init x = 1 & 2; print(x)")[0]).toBe("0");
        expect(run_capture_print("init x = 1 | 2; print(x)")[0]).toBe("3");
        expect(run_capture_print("init x = 1 ^ 2; print(x)")[0]).toBe("3");
        expect(run_capture_print("init x = 5 & 1; print(x)")[0]).toBe("1");
    });

    test("Shift Operations", () => {
        expect(run_capture_print("init x = 8 >> 1; print(x)")[0]).toBe("4");
        expect(run_capture_print("init x = 4 << 1; print(x)")[0]).toBe("8");
    });

    test("Power Operator", () => {
        expect(run_capture_print("init x = 2 ** 3; print(x)")[0]).toBe("8");
        expect(run_capture_print("init x = 3 ** 2; print(x)")[0]).toBe("9");
    });

    test("Integer Overflow (i8)", () => {
        // i8 is signed: -128 to 127
        expect(run_capture_print("init x = i8(255); print(x)")[0]).toBe("-1");
        expect(run_capture_print("init x = i8(127); change x = x + 1; print(x)")[0]).toBe("-128");
    });

    test("Integer Overflow (u8)", () => {
        // u8: 0 to 255
        expect(run_capture_print("init x = u8(255); change x = x + 1; print(x)")[0]).toBe("0");
    });

    test("Type Conversions", () => {
        expect(run_capture_print(`init x = int("123"); print(x)`)[0]).toBe("123");
        expect(run_capture_print(`init x = float("12.5"); print(x)`)[0]).toBe("12.5");
    });

    test("Literal Typing", () => {
        const res1 = run_capture_print("init x = 123; print(x)");
        expect(res1[0]).toBe("123");

        const res2 = run_capture_print("init x = 123.45; print(x)");
        expect(res2[0]).toBe("123.45");

        const res3 = run_capture_print("init x = 0xFF; print(x)"); // 255
        expect(res3[0]).toBe("255");
    });
});
