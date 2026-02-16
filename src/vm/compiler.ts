import type { opcode } from "./opcodes.ts";
import { perc_number, perc_string, perc_bool, perc_nil } from "./perc_types.ts";

export class Compiler {
    private opcodes: opcode[] = [];
    private foreign_funcs: Set<string>;

    constructor(foreign_funcs: string[] = []) {
        this.foreign_funcs = new Set(foreign_funcs);
    }

    private scopes: Set<string>[] = [];

    private enter_scope() {
        this.scopes.push(new Set());
    }

    private exit_scope() {
        this.scopes.pop();
    }

    private declare_var(name: string, node: any) {
        const current = this.scopes[this.scopes.length - 1];
        if (current.has(name)) {
            const loc: [number, number] | null = node.location ? [node.location.start.offset, node.location.end.offset] : null;
            // Throw error with location property that VM can catch
            const err: any = new Error(`Variable '${name}' already declared in this scope`);
            err.location = node.location;
            throw err;
        }
        current.add(name);
    }

    compile(ast: any): opcode[] {
        this.opcodes = [];
        this.scopes = [];
        this.enter_scope(); // Global scope
        this.visit(ast);
        this.exit_scope();
        return this.opcodes;
    }

    compile_repl(ast: any): opcode[] {
        this.opcodes = [];
        this.scopes = [];
        this.enter_scope(); // Global scope

        if (ast.type === "SourceFile" && ast.body.length > 0) {
            // Visit all but the last
            for (let i = 0; i < ast.body.length - 1; i++) {
                this.visit(ast.body[i]);
            }
            // Visit the last one specially
            const last = ast.body[ast.body.length - 1];
            if (last.type === "ExpressionStatement") {
                this.visit(last.expression);
                // DO NOT emit 'pop' so the value stays on stack
            } else {
                this.visit(last);
            }
        } else {
            this.visit(ast);
        }

        this.exit_scope();
        return this.opcodes;
    }

    private emit(op: any, node: any) {
        this.opcodes.push({
            ...op,
            src_start: node.location?.start.offset || 0,
            src_end: node.location?.end.offset || 0,
        } as opcode);
    }

    private visit(node: any) {
        if (!node) return;

        switch (node.type) {
            case "SourceFile":
                // SourceFile is top level, scope already created in compile()
                node.body.forEach((s: any) => this.visit(s));
                break;

            case "Block":
                this.enter_scope();
                this.emit({ type: 'enter_scope' }, node);
                node.body.forEach((s: any) => this.visit(s));
                this.emit({ type: 'exit_scope' }, node);
                this.exit_scope();
                break;

            case "VarInit":
                this.visit(node.value);
                this.declare_var(node.name, node);
                this.emit({ type: 'init', name: node.name, catch: node.isCatch || false }, node);
                break;

            case "VarChange":
                if (node.target.type === "Identifier") {
                    this.visit(node.value);
                    this.emit({ type: 'store', name: node.target.name, catch: node.isCatch || false }, node);
                } else if (node.target.type === "MemberExpression") {
                    this.visit(node.target.object);
                    if (node.target.propertyType === "dot") {
                        this.visit(node.value);
                        this.emit({ type: 'member_store', name: node.target.property, catch: node.isCatch || false }, node);
                    } else {
                        this.visit(node.target.index);
                        this.visit(node.value);
                        this.emit({ type: 'index_store', catch: node.isCatch || false }, node);
                    }
                }
                break;

            case "IfStatement":
                this.visit(node.condition);
                const jumpIfFalseIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, node);

                // Consequence is a Block, so it handles scope
                this.visit(node.consequence);

                const jumpToEndIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, node);

                (this.opcodes[jumpIfFalseIdx] as any).addr = this.opcodes.length;
                if (node.alternative) {
                    // alternative can be Block or IfStatement
                    // If Block, handles scope. If ifstatement, it's recursive.
                    this.visit(node.alternative);
                }
                (this.opcodes[jumpToEndIdx] as any).addr = this.opcodes.length;
                break;

            case "WhileStatement":
                const startAddr = this.opcodes.length;
                this.visit(node.condition);
                const whileJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, node);

                this.visit(node.body);
                this.emit({ type: 'jump', addr: startAddr }, node);
                (this.opcodes[whileJumpOutIdx] as any).addr = this.opcodes.length;
                break;

            case "ForInStatement":
                this.visit(node.collection);
                this.emit({ type: 'get_iter' }, node);
                const forStartAddr = this.opcodes.length;
                this.emit({ type: 'iter_next' }, node);
                const forJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, node);

                // Create a scope for the loop variable?
                // The body is a Block, so it creates a scope.
                // But the 'item' is declared for the loop.
                // Ideally, 'item' should be in the block's scope or a wrapping scope?
                // Let's create a scope for the loop variable + body
                this.enter_scope();
                this.declare_var(node.item, node);
                this.emit({ type: 'init', name: node.item, catch: false }, node);

                // We must handle the body manually to avoid double scope creation if we just call visit(Block)
                // But the parser guarantees body is a Block.
                // If we call visit(Block), it creates ANOTHER scope.
                // That's fine, nested scopes are OK.
                this.visit(node.body);

                this.exit_scope();

                this.emit({ type: 'jump', addr: forStartAddr }, node);
                (this.opcodes[forJumpOutIdx] as any).addr = this.opcodes.length;
                break;

            case "ReturnStatement":
                if (node.argument) {
                    this.visit(node.argument);
                } else {
                    this.emit({ type: 'push', imm: new perc_nil() }, node);
                }
                this.emit({ type: 'ret' }, node);
                break;

            case "DebuggerStatement":
                this.emit({ type: 'debugger' }, node);
                break;

            case "ExpressionStatement":
                this.visit(node.expression);
                this.emit({ type: 'pop' }, node);
                break;

            case "BinaryExpression":
                this.visit(node.left);
                this.visit(node.right);
                this.emit({ type: 'binary_op', op: node.operator }, node);
                break;

            case "UnaryExpression":
                this.visit(node.operand);
                this.emit({ type: 'unary_op', op: node.operator }, node);
                break;

            case "CallExpression":
                // Special handling for 'typeof' intrinsic
                if (node.callee.type === "Identifier" && node.callee.name === "typeof") {
                    if (node.arguments.length !== 1) {
                        throw new Error("typeof expects exactly 1 argument");
                    }
                    this.visit(node.arguments[0]);
                    this.emit({ type: 'typeof' }, node);
                    break;
                }

                // If callee is an identifier and is a known foreign function, emit call_foreign
                if (node.callee.type === "Identifier" && this.foreign_funcs.has(node.callee.name)) {
                    node.arguments.forEach((arg: any) => this.visit(arg));
                    this.emit({ type: 'call_foreign', name: node.callee.name, nargs: node.arguments.length }, node);
                } else {
                    node.arguments.forEach((arg: any) => this.visit(arg));
                    this.visit(node.callee);
                    this.emit({ type: 'call', nargs: node.arguments.length }, node);
                }
                break;

            case "MemberExpression":
                this.visit(node.object);
                if (node.propertyType === "dot") {
                    this.emit({ type: 'member_load', name: node.property }, node);
                } else {
                    this.visit(node.index);
                    this.emit({ type: 'index_load' }, node);
                }
                break;

            case "InstantiationExpression":
                this.visit(node.expression);
                break;

            case "ArrayLiteral":
                node.elements.forEach((el: any) => this.visit(el));
                this.emit({ type: 'new_array', size: node.elements.length }, node);
                break;

            case "MapLiteral":
                node.pairs.forEach((p: any) => {
                    this.visit(p.key);
                    this.visit(p.value);
                });
                this.emit({ type: 'new_map', size: node.pairs.length }, node);
                break;

            case "TupleLiteral":
                node.elements.forEach((el: any) => this.visit(el));
                this.emit({ type: 'new_tuple', size: node.elements.length }, node);
                break;

            case "FunctionDeclaration":
            case "FunctionLiteral":
                const jumpOverFuncIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, node);
                const funcStartAddr = this.opcodes.length;

                // Function creates a new scope for arguments
                this.enter_scope();

                // Parameters are pushed to stack by 'call', we just need to 'init' them
                // parameters is just string array from grammar
                const params = node.parameters || [];
                // Parameters are pushed in order, but 'init' will pop them.
                // Wait, if I have f(a, b). Call pushes a, then b.
                // Stack: [..., a, b]
                // Need to pop b, then a.
                params.slice().reverse().forEach((p: string) => {
                    this.declare_var(p, node);
                    this.emit({ type: 'init', name: p, catch: false }, node);
                });

                // Body is a Block, but we opened a scope for params.
                // We should reuse this scope or enter a new one?
                // The 'Block' visit will enter a NEW scope.
                // This means 'params' are in outer scope of 'body'.
                // If I declare 'a' in 'body', it shadows param 'a'.
                // Standard JS prevents `let a` if param `a` exists?
                // "Duplicate parameter name not allowed in this context"
                // But here, if visit(Block) pushes new scope, then `init a` inside block is valid shadowing.
                // Is that desired? Usually params are in the function scope, and var declarations in top level of function are in same scope.
                // But our language treats Block as scope.
                // If I just call visit(node.body), it creates a child scope.
                // I think that's acceptable for now unless user complains.

                // wait, "body" is a Block node.
                // if I manually visit children of block without `enter_scope`?
                // Let's stick to standard behavior: params are in function scope. Body block is a child scope.
                this.visit(node.body);

                this.exit_scope(); // Close function scope

                // Ensure every function returns nil if it doesn't have an explicit return
                this.emit({ type: 'push', imm: new perc_nil() }, node);
                this.emit({ type: 'ret' }, node);

                (this.opcodes[jumpOverFuncIdx] as any).addr = this.opcodes.length;

                // TODO: Captured variables analysis
                this.emit({
                    type: 'make_closure',
                    addr: funcStartAddr,
                    captured: [],
                    name: node.type === "FunctionDeclaration" ? node.name : "anonymous"
                }, node);
                if (node.type === "FunctionDeclaration") {
                    this.declare_var(node.name, node);
                    this.emit({ type: 'init', name: node.name, catch: false }, node);
                }
                break;

            case "Identifier":
                this.emit({ type: 'load', name: node.name }, node);
                break;

            case "IntegerLiteral":
                this.emit({ type: 'push', imm: new perc_number(parseInt(node.value.replace(/_/g, '')), 'i32') }, node);
                break;
            case "FloatLiteral":
                this.emit({ type: 'push', imm: new perc_number(parseFloat(node.value.replace(/_/g, '')), 'f64') }, node);
                break;
            case "StringLiteral":
                this.emit({ type: 'push', imm: new perc_string(node.value) }, node);
                break;
            case "BooleanLiteral":
                this.emit({ type: 'push', imm: new perc_bool(node.value) }, node);
                break;
            case "NilLiteral":
                this.emit({ type: 'push', imm: new perc_nil() }, node);
                break;

            default:
                console.warn(`Unknown node type: ${node.type}`, node);
        }
    }
}
