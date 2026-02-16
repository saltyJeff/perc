import { describe, it } from 'vitest';
import { parse } from './ast-adapter';

describe('AST Debug', () => {
    it('should dump AST', () => {
        const code = 'init x = 10; init y = 20; print(x + y);';
        const ast = parse(code);
        console.log(JSON.stringify(ast, (key, value) => key === 'location' ? undefined : value, 2));
    });
});
