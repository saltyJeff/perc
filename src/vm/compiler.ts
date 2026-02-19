import type { opcode } from "./opcodes.ts";
import { perc_number, perc_string, perc_bool, perc_nil } from "./perc_types.ts";
import { Tree, TreeCursor } from "@lezer/common";
import { PercCompileError, SourceLocation } from "../errors";

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

    private getLocation(start: number, end: number): SourceLocation {
        const startPos = this.getLineCol(start);
        const endPos = this.getLineCol(end);
        return {
            start: { offset: start, line: startPos.line, column: startPos.column },
            end: { offset: end, line: endPos.line, column: endPos.column }
        };
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
            throw new PercCompileError(
                `Variable '${name}' already declared in this scope`,
                this.getLocation(location.start, location.end)
            );
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
            // ... (keep existing implementation of getIdentifierName logic if I was replacing it, but I am inserting expect)
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

    private expect(cursor: TreeCursor, expected: string, context: string, contextLoc: { start: number, end: number }) {
        const name = cursor.name as string;
        if (name === expected) return;

        // If we found an error node, let's look at the location
        if (name === "⚠") {
            throw new PercCompileError(
                `Expected '${expected}' in ${context}, but found syntax error (unexpected token)`,
                this.getLocation(cursor.from, cursor.to)
            );
        }

        // If we found something else, report it
        throw new PercCompileError(
            `Expected '${expected}' in ${context}, but found '${name}'`,
            this.getLocation(cursor.from, cursor.to)
        );
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
                    // Check for opening brace if Block
                    if (type === "Block") {
                        if ((cursor.name as string) !== "{") {
                            // This is weird, Block should start with {
                            // But Lezer might be resilient.
                        }
                    }

                    do {
                        const n = cursor.name as string;
                        if (n === "⚠") {
                            // Syntax error inside block/file
                            // Check if it's likely a missing semicolon or brace
                            throw new PercCompileError(
                                `Unexpected syntax in ${type}. check for missing ';' or '}'`,
                                this.getLocation(cursor.from, cursor.to)
                            );
                        }
                        if (n !== "{" && n !== "}" && n !== ";" && n !== "LineComment" && n !== "BlockComment") {
                            this.visit(cursor);
                        }
                    } while (cursor.nextSibling());

                    // If Block, verify last child was "}"
                    if (type === "Block") {
                        if ((cursor.name as string) !== "}") {
                            throw new PercCompileError(
                                "Missing closing '}' for block",
                                this.getLocation(end, end) // Point to end of block
                            );
                        }
                    }

                    cursor.parent();
                } else {
                    // Empty block without children? 
                    // {} -> firstChild is { ...
                }

                if (type === "Block") {
                    this.emit({ type: 'exit_scope' }, loc);
                    this.exit_scope();
                }
                break;

            // ... (Variable declarations seem fine, mostly sequence of children)
            // But let's check IfStatement carefully
            case "IfStatement":
                cursor.firstChild(); // if
                if (!cursor.nextSibling()) throw new PercCompileError("Unexpected end of IfStatement", this.getLocation(end, end)); // Should not happen with validation

                this.expect(cursor, "(", "if statement", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in if statement", this.getLocation(end, end));
                // Expression
                this.visit(cursor);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing closing ')' in if statement", this.getLocation(end, end));
                this.expect(cursor, ")", "if statement", loc);

                const jumpIfFalseIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in if statement", this.getLocation(end, end));
                this.expect(cursor, "then", "if statement", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing block in if statement", this.getLocation(end, end));
                // Block
                this.visit(cursor);

                const jumpToEndIdx = this.opcodes.length;
                this.emit({ type: 'jump', addr: 0 }, loc);
                (this.opcodes[jumpIfFalseIdx] as any).addr = this.opcodes.length;

                if (cursor.nextSibling()) {
                    if ((cursor.name as string) === "else") {
                        if (!cursor.nextSibling()) throw new PercCompileError("Missing block after else", this.getLocation(end, end));
                        // Block or IfStatement
                        this.visit(cursor);
                    }
                }
                (this.opcodes[jumpToEndIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            case "WhileStatement":
                const whileStartAddr = this.opcodes.length;
                cursor.firstChild(); // while

                if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in while loop", this.getLocation(end, end));
                this.expect(cursor, "(", "while loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in while loop", this.getLocation(end, end));
                this.visit(cursor); // Expression

                const whileJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in while loop", this.getLocation(end, end));
                this.expect(cursor, ")", "while loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in while loop", this.getLocation(end, end));
                this.expect(cursor, "then", "while loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing block in while loop", this.getLocation(end, end));
                this.visit(cursor); // Block

                this.emit({ type: 'jump', addr: whileStartAddr }, loc);
                (this.opcodes[whileJumpOutIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            case "ForInStatement":
                cursor.firstChild(); // for
                if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in for loop", this.getLocation(end, end));
                this.expect(cursor, "(", "for loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing 'init' in for loop", this.getLocation(end, end));
                this.expect(cursor, "init", "for loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing identifier in for loop", this.getLocation(end, end));
                const iterItem = this.source.slice(cursor.from, cursor.to);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing 'in' in for loop", this.getLocation(end, end));
                this.expect(cursor, "in", "for loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing iterable expression in for loop", this.getLocation(end, end));
                this.visit(cursor); // Expression

                this.emit({ type: 'get_iter' }, loc);
                const forStartAddr = this.opcodes.length;
                this.emit({ type: 'iter_next' }, loc);
                const forJumpOutIdx = this.opcodes.length;
                this.emit({ type: 'jump_if_false', addr: 0 }, loc);
                this.enter_scope();
                this.declare_var(iterItem, loc);
                this.emit({ type: 'init', name: iterItem, catch: false }, loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in for loop", this.getLocation(end, end));
                this.expect(cursor, ")", "for loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in for loop", this.getLocation(end, end));
                this.expect(cursor, "then", "for loop", loc);

                if (!cursor.nextSibling()) throw new PercCompileError("Missing block in for loop", this.getLocation(end, end));
                this.visit(cursor); // Block

                this.exit_scope();
                this.emit({ type: 'jump', addr: forStartAddr }, loc);
                (this.opcodes[forJumpOutIdx] as any).addr = this.opcodes.length;
                cursor.parent();
                break;

            // Rest can roughly stay the same for now, except generic error handler
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
                    if (count !== 1) throw new PercCompileError("typeof expects exactly 1 argument", this.getLocation(start, end));
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
                throw new PercCompileError(
                    `Unexpected token or expression.`,
                    this.getLocation(start, end)
                );

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
