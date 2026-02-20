import { VM } from "../src/vm/index.ts";
import { perc_string, perc_nil } from "../src/vm/perc_types.ts";
import { expect, test, describe } from "vitest";
import { parser } from "../src/lang.grammar";

describe("Async Input", () => {
    test("Input pauses execution and resumes with value", () => {
        const vm = new VM();
        const code = `
            init name = input("Enter name:");
            print("Hello " + name);
        `;

        let output = "";
        let inputPrompt = "";

        // Mock print/input
        vm.register_foreign('print', (...args) => {
            output += args.map(a => a.to_string()).join(' ');
            return new perc_nil();
        });

        vm.register_foreign('input', (prompt_str) => {
            inputPrompt = prompt_str.to_string();
            // Simulate VM pause for input
            vm.is_waiting_for_input = true;
            return new perc_nil();
        });

        vm.execute(code, parser);
        const runner = vm.run();

        // 1. Run until input requested
        let steps = 0;
        let done = false;
        while (steps < 100) {
            const res = runner.next();
            if (res.done) { done = true; break; }
            if (vm.is_waiting_for_input) break;
            steps++;
        }

        expect(vm.is_waiting_for_input).toBe(true);
        expect(inputPrompt).toBe("Enter name:");
        expect(output).toBe(""); // Not printed yet

        // 2. Resume with input
        vm.resume_with_input(new perc_string("World"));
        expect(vm.is_waiting_for_input).toBe(false);

        // 3. Continue execution
        while (steps < 200) {
            const res = runner.next();
            if (res.done) break;
            steps++;
        }

        expect(output).toBe("Hello World");
    });
});
