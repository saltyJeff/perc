import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/vm/compiler';
import { parser } from '../src/lang.grammar';
import { PercCompileError } from '../src/errors';

describe('Compiler Error Handling', () => {
    const compile = (code: string) => {
        const compiler = new Compiler();
        const tree = parser.parse(code);
        const result = compiler.compile(code, tree);
        if (result.errors.length > 0) {
            throw result.errors[0];
        }
        return result;
    };

    it('should throw error for missing "then" in if statement', () => {
        const code = `if (true) { }`;
        try {
            compile(code);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e).toBeInstanceOf(PercCompileError);
            expect(e.message).toContain("Expected 'then' in if statement");
            expect(e.location).toBeDefined();
        }
    });

    it('should throw error for missing ")" in if statement', () => {
        const code = `if (true then { }`;
        try {
            compile(code);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            // In this case, Lezer might parse "then" as part of expression or error node
            // Our compiler expects ")"
            expect(e).toBeInstanceOf(PercCompileError);
            // It might fail at "then" expecting ")" or similar
        }
    });

    it('should throw error for missing closing "}" in block', () => {
        const code = `if (true) then { init x = 1; `;
        try {
            compile(code);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e).toBeInstanceOf(PercCompileError);
            expect(e.message).toContain("Unexpected syntax in Block");
        }
    });

    it('should throw error for variable redeclaration', () => {
        const code = `
            init x = 1;
            init x = 2;
        `;
        try {
            compile(code);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e).toBeInstanceOf(PercCompileError);
            expect(e.message).toContain("Variable 'x' already declared");
        }
    });

    it('should throw error for typeof with wrong arg count', () => {
        const code = `init x = typeof(1, 2);`;
        try {
            compile(code);
            expect.fail("Should have thrown error");
        } catch (e: any) {
            expect(e).toBeInstanceOf(PercCompileError);
            expect(e.message).toContain("typeof expects exactly 1 argument");
        }
    });

    it('should report location for errors', () => {
        const code = `
init x = 1;
init x = 2;`;
        try {
            compile(code);
        } catch (e: any) {
            expect(e).toBeInstanceOf(PercCompileError);
            expect(e.location.start.line).toBe(3);
        }
    });
});
