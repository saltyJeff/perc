import type { opcode } from "./opcodes.ts";
import { Tree, TreeCursor } from "@lezer/common";
import { ICompiler } from "./compiler/types";
import { getLocation } from "./compiler/utils";
import { PercCompileError } from "../errors";
import {
    compileBinaryExpression,
    compileUnaryExpression,
    compileCallExpression,
    compileMemberExpression,
    compileInstantiationExpression,
    compileArrayLiteral,
    compileTupleLiteral,
    compileMapLiteral,
    compileFunction,
    compileLiteral
} from "./compiler/expressions";
import {
    compileSourceFileOrBlock,
    compileIfStatement,
    compileWhileStatement,
    compileForInStatement,
    compileVarInit,
    compileVarChange,
    compileVarRef,
    compileReturnStatement,
    compileDebuggerStatement,
    compileExpressionStatement
} from "./compiler/statements";

export class Compiler implements ICompiler {
    public opcodes: opcode[] = [];
    public foreign_funcs: Set<string>;
    public source: string = "";

    constructor(foreign_funcs: string[] = []) {
        this.foreign_funcs = new Set(foreign_funcs);
    }

    private scopes: Set<string>[] = [];

    public enter_scope() {
        this.scopes.push(new Set());
    }

    public exit_scope() {
        this.scopes.pop();
    }

    public declare_var(name: string, location: { start: number, end: number }) {
        const current = this.scopes[this.scopes.length - 1];
        if (current.has(name)) {
            throw new PercCompileError(
                `Variable '${name}' already declared in this scope`,
                getLocation(this.source, location.start, location.end)
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

    public emit(op: any, location: { start: number, end: number }) {
        this.opcodes.push({
            ...op,
            src_start: location.start,
            src_end: location.end,
        } as opcode);
    }

    public visit(cursor: TreeCursor) {
        const type = cursor.name as string;

        switch (type) {
            case "SourceFile":
            case "Block":
                compileSourceFileOrBlock(this, cursor);
                break;

            case "IfStatement":
                compileIfStatement(this, cursor);
                break;

            case "WhileStatement":
                compileWhileStatement(this, cursor);
                break;

            case "ForInStatement":
                compileForInStatement(this, cursor);
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
                compileVarInit(this, cursor);
                break;

            case "VarChange":
                compileVarChange(this, cursor);
                break;

            case "VarRef":
                compileVarRef(this, cursor);
                break;

            case "ReturnStatement":
                compileReturnStatement(this, cursor);
                break;

            case "DebuggerStatement":
                compileDebuggerStatement(this, cursor);
                break;

            case "ExpressionStatement":
                compileExpressionStatement(this, cursor);
                break;

            case "BinaryExpression":
                compileBinaryExpression(this, cursor);
                break;

            case "UnaryExpression":
                compileUnaryExpression(this, cursor);
                break;

            case "CallExpression":
                compileCallExpression(this, cursor);
                break;

            case "MemberExpression":
                compileMemberExpression(this, cursor);
                break;

            case "InstantiationExpression":
                compileInstantiationExpression(this, cursor);
                break;

            case "ArrayLiteral":
                compileArrayLiteral(this, cursor);
                break;

            case "TupleLiteral":
                compileTupleLiteral(this, cursor);
                break;

            case "MapLiteral":
                compileMapLiteral(this, cursor);
                break;

            case "FunctionDeclaration":
            case "FunctionLiteral":
                compileFunction(this, cursor, type);
                break;

            case "Identifier":
                this.emit({ type: 'load', name: this.source.slice(cursor.from, cursor.to) }, { start: cursor.from, end: cursor.to });
                break;

            case "IntegerLiteral":
            case "FloatLiteral":
            case "StringLiteral":
            case "BooleanLiteral":
            case "NilLiteral":
                compileLiteral(this, cursor);
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
                    getLocation(this.source, cursor.from, cursor.to)
                );

            default:
                break;
        }
    }

    public visitArgumentList(cursor: TreeCursor): number {
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
