import type { perc_type } from "./perc_types.ts";

export class Scope {
    values: Map<string, perc_type> = new Map();
    definitions: Map<string, [number, number]> = new Map();
    parent: Scope | null = null;
    is_closure_scope: boolean = false;

    constructor(parent: Scope | null = null) {
        this.parent = parent;
    }

    define(name: string, value: perc_type, range: [number, number]) {
        this.values.set(name, value);
        this.definitions.set(name, range);
    }

    assign(name: string, value: perc_type, range: [number, number]): boolean {
        if (this.values.has(name)) {
            this.values.set(name, value);
            this.definitions.set(name, range);
            return true;
        }
        if (this.parent) return this.parent.assign(name, value, range);
        return false;
    }

    lookup(name: string): perc_type | null {
        if (this.values.has(name)) return this.values.get(name)!;
        if (this.parent) return this.parent.lookup(name);
        return null;
    }

    lookup_definition(name: string): [number, number] | null {
        if (this.definitions.has(name)) return this.definitions.get(name)!;
        if (this.parent) return this.parent.lookup_definition(name);
        return null;
    }
}
