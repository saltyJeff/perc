import { VM } from "../src/vm/index.ts";
import { perc_number, perc_string, perc_map } from "../src/vm/perc_types.ts";
import { expect, test, describe } from "vitest";
import { parser } from "../src/lang.grammar";

describe("Color Features", () => {
    const run = (code: string) => {
        const vm = new VM();
        let lastTop: any = null;
        vm.set_events({
            on_stack_top_update: (val) => lastTop = val
        });
        vm.execute_repl(code, parser);
        vm.in_debug_mode = true;
        const gen = vm.run();
        while (!gen.next().done) { }
        return lastTop;
    };

    test("RGBA Function", () => {
        const res = run("init c = rgba(10, 20, 30, 0.5); c");
        expect(res).toBeInstanceOf(perc_map);
        expect((res.get(new perc_string('r')) as perc_number).buffer[0]).toBe(10);
        expect((res.get(new perc_string('g')) as perc_number).buffer[0]).toBe(20);
        expect((res.get(new perc_string('b')) as perc_number).buffer[0]).toBe(30);
        expect((res.get(new perc_string('a')) as perc_number).buffer[0]).toBe(0.5);
    });

    test("HSLA Function", () => {
        // Red: hsl(0, 100%, 50%) -> rgb(255, 0, 0)
        const res = run("init c = hsla(0, 100, 50, 0.8); c");
        expect(res).toBeInstanceOf(perc_map);
        expect((res.get(new perc_string('r')) as perc_number).buffer[0]).toBe(255);
        expect((res.get(new perc_string('g')) as perc_number).buffer[0]).toBe(0);
        expect((res.get(new perc_string('b')) as perc_number).buffer[0]).toBe(0);
        expect((res.get(new perc_string('a')) as perc_number).buffer[0]).toBe(0.8);
    });

    test("RGB Function contains alpha 1", () => {
        const res = run("init c = rgb(10, 20, 30); c");
        expect(res).toBeInstanceOf(perc_map);
        expect((res.get(new perc_string('a')) as perc_number).buffer[0]).toBe(1);
    });

    test("HSL Function contains alpha 1", () => {
        const res = run("init c = hsl(0, 100, 50); c");
        expect(res).toBeInstanceOf(perc_map);
        expect((res.get(new perc_string('a')) as perc_number).buffer[0]).toBe(1);
    });
});
