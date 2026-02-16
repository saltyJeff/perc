import type { opcode } from "./opcodes.ts";
import { perc_number, perc_string, perc_bool, perc_nil } from "./perc_types.ts";
import { Tree, TreeCursor } from "@lezer/common";

export class Compiler {
    private opcodes: opcode[] = [];
    private foreign_funcs: Set<string>;
    private source: string = "";

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

    private getLineCol(offset: number) {
        const lines = this.source.slice(0, offset).split("\n");
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    private declare_var(name: string, location: { start: number, end: number }) {
        const current = this.scopes[this.scopes.length - 1];
        if (current.has(name)) {
            const startLoc = this.getLineCol(location.start);
            const endLoc = this.getLineCol(location.end);
            const err: any = new Error(`Variable '${name}' already declared in this scope`);
            err.location = {
                start: { offset: location.start, line: startLoc.line, column: startLoc.column },
                end: { offset: location.end, line: endLoc.line, column: endLoc.column }
            };
            throw err;
        }
        current.add(name);
    }

    compile(source: string, tree: Tree): opcode[] {
        this.opcodes = [];
        this.scopes = [];
        this.source = source;
        this.enter_scope(); // Global scope

        const cursor = tree.cursor();
        this.visit(cursor);

        this.exit_scope();
        return this.opcodes;
    }

    compile_repl(source: string, tree: Tree): opcode[] {
        this.opcodes = [];
        this.scopes = [];
        this.source = source;
        this.enter_scope(); // Global scope

        const cursor = tree.cursor();
        if ((cursor.name as string) === "SourceFile") {
            if (cursor.firstChild()) {
                do {
                    const isLast = !cursor.nextSibling();
                    if (!isLast) cursor.prevSibling();

                    let isExprStmt = false;
                    if ((cursor.name as string) === "ExpressionStatement") isExprStmt = true;
                    else if ((cursor.name as string) === "Statement") {
                        if (cursor.firstChild()) {
                            if ((cursor.name as string) === "ExpressionStatement") isExprStmt = true;
                            cursor.parent();
                        }
                    }

                    if (isLast && isExprStmt) {
                        // Dive into ExpressionStatement
                        let moved = false;
                        if ((cursor.name as string) === "Statement") {
                            cursor.firstChild();
                            moved = true;
                        }
                        cursor.firstChild(); // Expression
                        this.visit(cursor);
                        cursor.parent();
                        if (moved) cursor.parent();
                    } else {
                        this.visit(cursor);
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
        } else {
            this.visit(cursor);
        }

        this.exit_scope();
        return this.opcodes;
    }

    private emit(op: any, location: { start: number, end: number }) {
        this.opcodes.push({
            ...op,
            src_start: location.start,
            src_end: location.end,
        } as opcode);
    }

    private getIdentifierName(cursor: TreeCursor): string | null {
        let currentType = cursor.name as string;
        let depth = 0;
        // Traverse through wrapper nodes
        while (["PostfixExpression", "PrimaryExpression", "Expression", "Statement", "Literal"].includes(currentType)) {
            if (cursor.firstChild()) {
                depth++;
                currentType = cursor.name as string;
            } else {
                break;
            }
        }
        let name = null;
        if (currentType === "Identifier") {
            name = this.source.slice(cursor.from, cursor.to);
        }
        // Restore cursor
        while (depth > 0) {
            cursor.parent();
            depth--;
        }
        return name;
    }

    private visit(cursor: TreeCursor) {
        const type = cursor.name as string;
        const start = cursor.from;
        const end = cursor.to;
        const loc = { start, end };

        switch (type) {
            case "SourceFile":
            case "Block":
                if (type === "Block") {
                    this.enter_scope();
                    this.emit({ type: 'enter_scope' }, loc);
                }

                if (cursor.firstChild()) {
                    do {
                        const n = cursor.name as string;
                        if (n !== "{" && n !== "}" && n !== ";" && n !== "LineComment" && n !== "BlockComment") {
                            this.visit(cursor);
                        }
                    } while (cursor.nextSibling());
                    cursor.parent();
                }

                if (type === "Block") {
                    this.emit({ type: 'exit_scope' }, loc);
                    this.exit_scope();
                }
                break;

            case "Statement":
            case "Expression":
            case "PostfixExpression":
            case "PrimaryExpression":
            case "Literal":
                if (cursor.firstChild()) {
                    this.visit(cursor);
                    cursor.parent();
                }
                break;

            case "VarInit":
                cursor.firstChild(); // kw<"init">
                cursor.nextSibling(); // Identifier
                const varName = this.source.slice(cursor.from, cursor.to);
                cursor.nextSibling(); // Op
                const isCatchInit = (cursor.name as string) === "CatchAssignOp";
                cursor.nextSibling(); // Expression
                this.visit(cursor);

                this.declare_var(varName, loc);
                this.emit({ type: 'init', name: varName, catch: isCatchInit }, loc);

                cursor.parent();
                break;

            case "VarChange":
                cursor.firstChild(); // kw<"change">
                cursor.nextSibling(); // Target

                const targetIdName = this.getIdentifierName(cursor);
                if (targetIdName) {
                    cursor.nextSibling(); // Op
                    const isCatchChange = (cursor.name as string) === "CatchAssignOp";
                    cursor.nextSibling(); // Expression
                    this.visit(cursor);
                    this.emit({ type: 'store', name: targetIdName, catch: isCatchChange }, loc);
                } else if ((cursor.name as string) === "MemberExpression") {
                    cursor.firstChild(); // Object
                    this.visit(cursor);
                    cursor.nextSibling(); // "." or "["
                    if ((cursor.name as string) === ".") {
                        cursor.nextSibling(); // Identifier
                        const propName = this.source.slice(cursor.from, cursor.to);
                        cursor.parent();
                        cursor.nextSibling(); // Op
                        const isCatchChange = (cursor.name as string) === "CatchAssignOp";
                        cursor.nextSibling(); // Expression
                        this.visit(cursor);
                        this.emit({ type: 'member_store', name: propName, catch: isCatchChange }, loc);
                    } else { // "["
                        cursor.nextSibling(); // Index
                        this.visit(cursor);
                        cursor.nextSibling(); // "]"
                        cursor.parent();
                        cursor.nextSibling(); // Op
                        const isCatchChange = (cursor.name as string) === "CatchAssignOp";
                        cursor.nextSibling(); // Expression
                        this.visit(cursor);
                        this.emit({ type: 'index_store', catch: isCatchChange }, loc);
                    }
                }
                cursor.parent();
                break;

            case "IfStatement":
                cursor.firstChild(); // if
                cursor.nextSibling(); // (
                cursor.nextSibling(); // Expression
                this.visit(cursor);

                const jumpIfFalseIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);

                cursor.nextSibling(); // )
                cursor.nextSibling(); // then
                cursor.nextSibling(); // Block
                this.visit(cursor);

                const jumpToEndIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, loc);
                (this.opcodes[jumpIfFalseIdx] as any).addr = this.opcodes.length;

                if (cursor.nextSibling()) {
                    if ((cursor.name as string) === "else") {
                        cursor.nextSibling(); // Block or IfStatement
                        this.visit(cursor);
                    }
                }
                (this.opcodes[jumpToEndIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            case "WhileStatement":
                const whileStartAddr = this.opcodes.length;
                cursor.firstChild(); // while
                cursor.nextSibling(); // (
                cursor.nextSibling(); // Expression
                this.visit(cursor);
                const whileJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);
                cursor.nextSibling(); // )
                cursor.nextSibling(); // then
                cursor.nextSibling(); // Block
                this.visit(cursor);
                this.emit({ type: 'jump', addr: whileStartAddr }, loc);
                (this.opcodes[whileJumpOutIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            case "ForInStatement":
                cursor.firstChild(); // for
                cursor.nextSibling(); // (
                cursor.nextSibling(); // init
                cursor.nextSibling(); // Identifier
                const iterItem = this.source.slice(cursor.from, cursor.to);
                cursor.nextSibling(); // in
                cursor.nextSibling(); // Expression
                this.visit(cursor);
                this.emit({ type: 'get_iter' }, loc);
                const forStartAddr = this.opcodes.length;
                this.emit({ type: 'iter_next' }, loc);
                const forJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);
                this.enter_scope();
                this.declare_var(iterItem, loc);
                this.emit({ type: 'init', name: iterItem, catch: false }, loc);
                cursor.nextSibling(); // )
                cursor.nextSibling(); // then
                cursor.nextSibling(); // Block
                this.visit(cursor);
                this.exit_scope();
                this.emit({ type: 'jump', addr: forStartAddr }, loc);
                (this.opcodes[forJumpOutIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            case "ReturnStatement":
                cursor.firstChild(); // return
                if (cursor.nextSibling()) {
                    this.visit(cursor);
                } else {
                    this.emit({ type: 'push', imm: new perc_nil() }, loc);
                }
                this.emit({ type: 'ret' }, loc);
                cursor.parent();
                break;

            case "DebuggerStatement":
                this.emit({ type: 'debugger' }, loc);
                break;

            case "ExpressionStatement":
                cursor.firstChild(); // Expression
                this.visit(cursor);
                this.emit({ type: 'pop' }, loc);
                cursor.parent();
                break;

            case "BinaryExpression":
                cursor.firstChild(); // Left
                this.visit(cursor);
                cursor.nextSibling(); // Operator
                const binOp = this.source.slice(cursor.from, cursor.to);
                cursor.nextSibling(); // Right
                this.visit(cursor);
                this.emit({ type: 'binary_op', op: binOp }, loc);
                cursor.parent();
                break;

            case "UnaryExpression":
                cursor.firstChild(); // Op
                const unOp = this.source.slice(cursor.from, cursor.to);
                cursor.nextSibling(); // Operand
                this.visit(cursor);
                this.emit({ type: 'unary_op', op: unOp }, loc);
                cursor.parent();
                break;

            case "CallExpression":
                cursor.firstChild(); // Callee
                const calleeName = this.getIdentifierName(cursor);
                if (calleeName === "typeof") {
                    cursor.nextSibling(); // ArgumentList
                    const count = this.visitArgumentList(cursor);
                    if (count !== 1) throw new Error("typeof expects exactly 1 argument");
                    this.emit({ type: 'typeof' }, loc);
                    cursor.parent();
                    break;
                }
                if (calleeName && this.foreign_funcs.has(calleeName)) {
                    cursor.nextSibling(); // ArgumentList
                    const n = this.visitArgumentList(cursor);
                    this.emit({ type: 'call_foreign', name: calleeName, nargs: n }, loc);
                    cursor.parent();
                    break;
                }
                cursor.nextSibling(); // ArgumentList
                const gArgs = this.visitArgumentList(cursor);
                cursor.prevSibling(); // Callee
                this.visit(cursor);
                this.emit({ type: 'call', nargs: gArgs }, loc);
                cursor.parent();
                break;

            case "MemberExpression":
                cursor.firstChild(); // Object
                this.visit(cursor);
                cursor.nextSibling(); // "." or "["
                if ((cursor.name as string) === ".") {
                    cursor.nextSibling(); // Identifier
                    const pName = this.source.slice(cursor.from, cursor.to);
                    this.emit({ type: 'member_load', name: pName }, loc);
                } else {
                    cursor.nextSibling(); // Index
                    this.visit(cursor);
                    this.emit({ type: 'index_load' }, loc);
                }
                cursor.parent();
                break;

            case "InstantiationExpression":
                cursor.firstChild(); // new
                cursor.nextSibling(); // Literal
                this.visit(cursor);
                cursor.parent();
                break;

            case "ArrayLiteral":
                cursor.firstChild(); // "["
                let arrSize = 0;
                while (cursor.nextSibling() && (cursor.name as string) !== "]") {
                    if ((cursor.name as string) !== ",") {
                        this.visit(cursor);
                        arrSize++;
                    }
                }
                this.emit({ type: 'new_array', size: arrSize }, loc);
                cursor.parent();
                break;

            case "TupleLiteral":
                cursor.firstChild(); // "(|"
                let tupSize = 0;
                while (cursor.nextSibling() && (cursor.name as string) !== "|)") {
                    if ((cursor.name as string) !== ",") {
                        this.visit(cursor);
                        tupSize++;
                    }
                }
                this.emit({ type: 'new_tuple', size: tupSize }, loc);
                cursor.parent();
                break;

            case "MapLiteral":
                cursor.firstChild(); // "{"
                let mapSize = 0;
                while (cursor.nextSibling() && (cursor.name as string) !== "}") {
                    if ((cursor.name as string) === "Pair") {
                        cursor.firstChild(); // Key
                        this.visit(cursor);
                        cursor.nextSibling(); // :
                        cursor.nextSibling(); // Value
                        this.visit(cursor);
                        cursor.parent();
                        mapSize++;
                    }
                }
                this.emit({ type: 'new_map', size: mapSize }, loc);
                cursor.parent();
                break;

            case "FunctionDeclaration":
            case "FunctionLiteral":
                const funcJumpOverIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, loc);
                const funcStartAddr = this.opcodes.length;
                cursor.firstChild(); // function
                let fName = "anonymous";
                if (type === "FunctionDeclaration") {
                    cursor.nextSibling(); // Identifier
                    fName = this.source.slice(cursor.from, cursor.to);
                }
                cursor.nextSibling(); // ParameterList
                const params: string[] = [];
                if (cursor.firstChild()) { // (
                    while (cursor.nextSibling() && (cursor.name as string) !== ")") {
                        if ((cursor.name as string) === "Identifier") {
                            params.push(this.source.slice(cursor.from, cursor.to));
                        }
                    }
                    cursor.parent();
                }
                this.enter_scope();
                params.slice().reverse().forEach(p => {
                    this.declare_var(p, loc);
                    this.emit({ type: 'init', name: p, catch: false }, loc);
                });
                cursor.nextSibling(); // Block
                this.visit(cursor);
                this.exit_scope();
                this.emit({ type: 'push', imm: new perc_nil() }, loc);
                this.emit({ type: 'ret' }, loc);
                (this.opcodes[funcJumpOverIdx] as any).addr = this.opcodes.length;
                this.emit({
                    type: 'make_closure',
                    addr: funcStartAddr,
                    captured: [],
                    name: fName
                }, loc);
                if (type === "FunctionDeclaration") {
                    this.declare_var(fName, loc);
                    this.emit({ type: 'init', name: fName, catch: false }, loc);
                }
                cursor.parent();
                break;

            case "Identifier":
                this.emit({ type: 'load', name: this.source.slice(start, end) }, loc);
                break;

            case "IntegerLiteral":
                this.emit({ type: 'push', imm: new perc_number(parseInt(this.source.slice(start, end).replace(/_/g, '')), 'i32') }, loc);
                break;
            case "FloatLiteral":
                this.emit({ type: 'push', imm: new perc_number(parseFloat(this.source.slice(start, end).replace(/_/g, '')), 'f64') }, loc);
                break;
            case "StringLiteral":
                this.emit({ type: 'push', imm: new perc_string(JSON.parse(this.source.slice(start, end))) }, loc);
                break;
            case "BooleanLiteral":
                this.emit({ type: 'push', imm: new perc_bool(this.source.slice(start, end) === "true") }, loc);
                break;
            case "NilLiteral":
                this.emit({ type: 'push', imm: new perc_nil() }, loc);
                break;

            case "ParenthesizedExpression":
                cursor.firstChild(); // (
                cursor.nextSibling(); // Expression
                this.visit(cursor);
                cursor.parent();
                break;

            case "⚠":
                const errPos = this.getLineCol(start);
                const syntaxErr: any = new Error(`Unexpected token or expression`);
                syntaxErr.location = {
                    start: { offset: start, line: errPos.line, column: errPos.column },
                    end: { offset: end, line: errPos.line, column: errPos.column } // Best guess for end is start for single point error
                };
                throw syntaxErr;

            default:
                break;
        }
    }

    private visitArgumentList(cursor: TreeCursor): number {
        let count = 0;
        if (cursor.firstChild()) { // "("
            while (cursor.nextSibling() && (cursor.name as string) !== ")") {
                if ((cursor.name as string) !== ",") {
                    this.visit(cursor);
                    count++;
                }
            }
            cursor.parent();
        }
        return count;
    }
}
