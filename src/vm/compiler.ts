import type { opcode } from "./opcodes.ts";
import { perc_number, perc_string, perc_bool, perc_nil } from "./perc_types.ts";

export class Compiler {
    private opcodes: opcode[] = [];
    private foreign_funcs: Set<string>;

    constructor(foreign_funcs: string[] = ['print', 'println', 'text_color_rgb', 'text_color_hsl', 'i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'f32', 'f64', 'int', 'float', 'input']) {
        this.foreign_funcs = new Set(foreign_funcs);
    }

    compile(ast: any): opcode[] {
        this.opcodes = [];
        this.visit(ast);
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
            case "Block":
                node.body.forEach((s: any) => this.visit(s));
                break;

            case "VarInit":
                this.visit(node.value);
                this.emit({ type: 'init', name: node.name }, node);
                break;

            case "VarChange":
                if (node.target.type === "Identifier") {
                    this.visit(node.value);
                    this.emit({ type: 'store', name: node.target.name }, node);
                } else if (node.target.type === "MemberExpression") {
                    this.visit(node.target.object);
                    if (node.target.propertyType === "dot") {
                        this.visit(node.value);
                        this.emit({ type: 'member_store', name: node.target.property }, node);
                    } else {
                        this.visit(node.target.index);
                        this.visit(node.value);
                        this.emit({ type: 'index_store' }, node);
                    }
                }
                break;

            case "IfStatement":
                this.visit(node.condition);
                const jumpIfFalseIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, node);

                this.visit(node.consequence);
                const jumpToEndIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, node);

                (this.opcodes[jumpIfFalseIdx] as any).addr = this.opcodes.length;
                if (node.alternative) {
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

                this.emit({ type: 'init', name: node.item }, node);
                this.visit(node.body);
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

            case "FunctionDeclaration":
            case "FunctionLiteral":
                const jumpOverFuncIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, node);
                const funcStartAddr = this.opcodes.length;

                // Parameters are pushed to stack by 'call', we just need to 'init' them
                // parameters is just string array from grammar
                const params = node.parameters || [];
                // Parameters are pushed in order, but 'init' will pop them.
                // Wait, if I have f(a, b). Call pushes a, then b.
                // Stack: [..., a, b]
                // Need to pop b, then a.
                params.slice().reverse().forEach((p: string) => {
                    this.emit({ type: 'init', name: p }, node);
                });

                this.visit(node.body);
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
                    this.emit({ type: 'init', name: node.name }, node);
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
            case "CharLiteral":
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
