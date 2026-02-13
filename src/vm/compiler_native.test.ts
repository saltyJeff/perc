import { describe, it, expect } from 'vitest';
import { Compiler } from './compiler.ts';

describe('Compiler Native Function Support', () => {
    it('should emit call_foreign for default print function', () => {
        const compiler = new Compiler(['print']);
        const ast = {
            type: "SourceFile",
            body: [
                {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: { type: "Identifier", name: "print", location: { start: { offset: 0 }, end: { offset: 5 } } },
                        arguments: [
                            { type: "IntegerLiteral", value: "42", location: { start: { offset: 6 }, end: { offset: 8 } } }
                        ],
                        location: { start: { offset: 0 }, end: { offset: 9 } }
                    },
                    location: { start: { offset: 0 }, end: { offset: 9 } }
                }
            ]
        };
        const opcodes = compiler.compile(ast);
        // push 42, call_foreign print (1 arg), pop
        expect(opcodes.map(o => o.type)).toEqual(['push', 'call_foreign', 'pop']);
        expect((opcodes[1] as any).name).toBe('print');
        expect((opcodes[1] as any).nargs).toBe(1);
    });

    it('should emit call_foreign for custom foreign functions', () => {
        const compiler = new Compiler(['print', 'math_sin']);
        const ast = {
            type: "SourceFile",
            body: [
                {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: { type: "Identifier", name: "math_sin", location: { start: { offset: 0 }, end: { offset: 8 } } },
                        arguments: [
                            { type: "FloatLiteral", value: "3.14", location: { start: { offset: 9 }, end: { offset: 13 } } }
                        ],
                        location: { start: { offset: 0 }, end: { offset: 14 } }
                    },
                    location: { start: { offset: 0 }, end: { offset: 14 } }
                }
            ]
        };
        const opcodes = compiler.compile(ast);
        expect(opcodes.map(o => o.type)).toEqual(['push', 'call_foreign', 'pop']);
        expect((opcodes[1] as any).name).toBe('math_sin');
    });

    it('should emit regular call for non-foreign identifiers', () => {
        const compiler = new Compiler(['print']);
        const ast = {
            type: "SourceFile",
            body: [
                {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: { type: "Identifier", name: "my_func", location: { start: { offset: 0 }, end: { offset: 7 } } },
                        arguments: [],
                        location: { start: { offset: 0 }, end: { offset: 9 } }
                    },
                    location: { start: { offset: 0 }, end: { offset: 9 } }
                }
            ]
        };
        const opcodes = compiler.compile(ast);
        // load my_func, call (0 args), pop
        expect(opcodes.map(o => o.type)).toEqual(['load', 'call', 'pop']);
    });
});
