import { describe, it, expect } from 'vitest';
import { Compiler } from './compiler.ts';

describe('Compiler', () => {
    const compiler = new Compiler();

    it('should compile basic variable initialization', () => {
        const ast = {
            type: "SourceFile",
            body: [
                {
                    type: "VarInit",
                    name: "x",
                    value: { type: "IntegerLiteral", value: "10", location: { start: { offset: 0 }, end: { offset: 2 } } },
                    location: { start: { offset: 0 }, end: { offset: 10 } }
                }
            ]
        };
        const opcodes = compiler.compile(ast);
        expect(opcodes).toHaveLength(2);
        expect(opcodes[0].type).toBe('push');
        expect(opcodes[1].type).toBe('init');
        expect((opcodes[1] as any).name).toBe('x');
    });

    it('should compile arithmetic expressions', () => {
        const ast = {
            type: "SourceFile",
            body: [
                {
                    type: "ExpressionStatement",
                    expression: {
                        type: "BinaryExpression",
                        left: { type: "IntegerLiteral", value: "5", location: { start: { offset: 0 }, end: { offset: 0 } } },
                        operator: "+",
                        right: { type: "IntegerLiteral", value: "3", location: { start: { offset: 0 }, end: { offset: 0 } } },
                        location: { start: { offset: 0 }, end: { offset: 5 } }
                    },
                    location: { start: { offset: 0 }, end: { offset: 5 } }
                }
            ]
        };
        const opcodes = compiler.compile(ast);
        // push 5, push 3, binary +, pop
        expect(opcodes.map(o => o.type)).toEqual(['push', 'push', 'binary_op', 'pop']);
    });
});
