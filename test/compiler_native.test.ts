import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/vm/compiler.ts';
import { parser } from '../src/lang.grammar';

describe('Compiler Native Function Support', () => {
    it('should emit call_foreign for default print function', () => {
        const compiler = new Compiler(['print']);
        const code = "print(42)";
        const tree = parser.parse(code);
        const { opcodes } = compiler.compile(code, tree);

        // push 42, call_foreign print (1 arg), pop
        expect(opcodes.map(o => o.type)).toEqual(['push', 'call_foreign', 'pop']);
        expect((opcodes[1] as any).name).toBe('print');
        expect((opcodes[1] as any).nargs).toBe(1);
    });

    it('should emit call_foreign for custom foreign functions', () => {
        const compiler = new Compiler(['print', 'math_sin']);
        const code = "math_sin(3.14)";
        const tree = parser.parse(code);
        const { opcodes } = compiler.compile(code, tree);

        expect(opcodes.map(o => o.type)).toEqual(['push', 'call_foreign', 'pop']);
        expect((opcodes[1] as any).name).toBe('math_sin');
    });

    it('should emit regular call for non-foreign identifiers', () => {
        const compiler = new Compiler(['print']);
        const code = "my_func()";
        const tree = parser.parse(code);
        const { opcodes } = compiler.compile(code, tree);

        // call (0 args) uses Callee then Arguments
        expect(opcodes.map(o => o.type)).toEqual(['load', 'call', 'pop']);
    });
});
