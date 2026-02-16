import { describe, it, expect } from 'vitest';
import { Compiler } from './compiler.ts';
import { parser } from '../lang.grammar';

describe('Compiler', () => {
    const compiler = new Compiler();

    it('should compile basic variable initialization', () => {
        const code = "init x = 10";
        const tree = parser.parse(code);
        const opcodes = compiler.compile(code, tree);

        expect(opcodes.length).toBeGreaterThan(0);
        // Expect push 10 and init x
        expect(opcodes[0].type).toBe('push');
        const initOp = opcodes.find(op => op.type === 'init');
        expect(initOp).toBeDefined();
        expect((initOp as any).name).toBe('x');
    });

    it('should compile arithmetic expressions', () => {
        const code = "init y = 5 + 3";
        const tree = parser.parse(code);
        const opcodes = compiler.compile(code, tree);

        const binaryOp = opcodes.find(op => op.type === 'binary_op');
        expect(binaryOp).toBeDefined();
        expect((binaryOp as any).op).toBe('+');
    });

    it('should compile if statements', () => {
        const code = "if (true) then { init x = 1 }";
        const tree = parser.parse(code);
        const opcodes = compiler.compile(code, tree);

        expect(opcodes.some(op => op.type === 'jump_if_false')).toBe(true);
        expect(opcodes.some(op => op.type === 'init')).toBe(true);
    });
});
