import type { Scope } from "./scope.ts";

export class Frame {
    scope: Scope;
    ret_addr: number;
    stack_start: number;
    name: string;
    args: string[];

    constructor(scope: Scope, ret_addr: number, stack_start: number, name: string = "global", args: string[] = []) {
        this.scope = scope;
        this.ret_addr = ret_addr;
        this.stack_start = stack_start;
        this.name = name;
        this.args = args;
    }
}
