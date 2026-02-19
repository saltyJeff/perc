import { TreeCursor } from "@lezer/common";
import { ICompiler } from "./types";
import { getIdentifierName, getLocation, expect } from "./utils";
import { perc_nil } from "../perc_types";
import { PercCompileError } from "../../errors";

export function compileSourceFileOrBlock(compiler: ICompiler, cursor: TreeCursor) {
    const type = cursor.name as string;
    const loc = { start: cursor.from, end: cursor.to };
    const end = cursor.to;

    if (type === "Block") {
        compiler.enter_scope();
        compiler.emit({ type: 'enter_scope' }, loc);
    }

    if (cursor.firstChild()) {
        do {
            const n = cursor.name as string;
            if (n === "⚠") {
                throw new PercCompileError(
                    `Unexpected syntax in ${type}. check for missing ';' or '}'`,
                    getLocation(compiler.source, cursor.from, cursor.to)
                );
            }
            if (n !== "{" && n !== "}" && n !== ";" && n !== "LineComment" && n !== "BlockComment") {
                compiler.visit(cursor);
            }
        } while (cursor.nextSibling());

        if (type === "Block") {
            if ((cursor.name as string) !== "}") {
                throw new PercCompileError(
                    "Missing closing '}' for block",
                    getLocation(compiler.source, end, end)
                );
            }
        }
        cursor.parent();
    }

    if (type === "Block") {
        compiler.emit({ type: 'exit_scope' }, loc);
        compiler.exit_scope();
    }
}

export function compileIfStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    const end = cursor.to;

    cursor.firstChild(); // if
    if (!cursor.nextSibling()) throw new PercCompileError("Unexpected end of IfStatement", getLocation(compiler.source, end, end));

    expect(compiler.source, cursor, "(", "if statement");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in if statement", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    if (!cursor.nextSibling()) throw new PercCompileError("Missing closing ')' in if statement", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, ")", "if statement");

    const jumpIfFalseIdx = compiler.opcodes.length;
    compiler.emit({ type: 'jump_if_false', addr: 0 }, loc);

    if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in if statement", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "then", "if statement");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing block in if statement", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    const jumpToEndIdx = compiler.opcodes.length;
    compiler.emit({ type: 'jump', addr: 0 }, loc);
    (compiler.opcodes[jumpIfFalseIdx] as any).addr = compiler.opcodes.length;

    if (cursor.nextSibling()) {
        if ((cursor.name as string) === "else") {
            if (!cursor.nextSibling()) throw new PercCompileError("Missing block after else", getLocation(compiler.source, end, end));
            compiler.visit(cursor);
        }
    }
    (compiler.opcodes[jumpToEndIdx] as any).addr = compiler.opcodes.length;
    cursor.parent();
}

export function compileWhileStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    const end = cursor.to;
    const whileStartAddr = compiler.opcodes.length;

    cursor.firstChild(); // while

    if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in while loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "(", "while loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing condition in while loop", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    const whileJumpOutIdx = compiler.opcodes.length;
    compiler.emit({ type: 'jump_if_false', addr: 0 }, loc);

    if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in while loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, ")", "while loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in while loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "then", "while loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing block in while loop", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    compiler.emit({ type: 'jump', addr: whileStartAddr }, loc);
    (compiler.opcodes[whileJumpOutIdx] as any).addr = compiler.opcodes.length;
    cursor.parent();
}

export function compileVarRef(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // kw<"ref">
    cursor.nextSibling(); // Identifier
    const varName = compiler.source.slice(cursor.from, cursor.to);
    cursor.nextSibling(); // Op
    const isCatchRef = (cursor.name as string) === "CatchAssignOp";
    cursor.nextSibling(); // Expression
    compiler.visit(cursor);

    compiler.declare_var(varName, loc);
    compiler.emit({ type: 'ref', name: varName, catch: isCatchRef }, loc);

    cursor.parent();
}

export function compileForInStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    const end = cursor.to;

    cursor.firstChild(); // for
    if (!cursor.nextSibling()) throw new PercCompileError("Missing '(' in for loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "(", "for loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing 'init' in for loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "init", "for loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing identifier in for loop", getLocation(compiler.source, end, end));
    const iterItem = compiler.source.slice(cursor.from, cursor.to);

    if (!cursor.nextSibling()) throw new PercCompileError("Missing 'in' in for loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "in", "for loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing iterable expression in for loop", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    compiler.emit({ type: 'get_iter' }, loc);
    const forStartAddr = compiler.opcodes.length;
    compiler.emit({ type: 'iter_next' }, loc);
    const forJumpOutIdx = compiler.opcodes.length;
    compiler.emit({ type: 'jump_if_false', addr: 0 }, loc);
    compiler.enter_scope();
    compiler.declare_var(iterItem, loc);
    compiler.emit({ type: 'init', name: iterItem, catch: false }, loc);

    if (!cursor.nextSibling()) throw new PercCompileError("Missing ')' in for loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, ")", "for loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing 'then' in for loop", getLocation(compiler.source, end, end));
    expect(compiler.source, cursor, "then", "for loop");

    if (!cursor.nextSibling()) throw new PercCompileError("Missing block in for loop", getLocation(compiler.source, end, end));
    compiler.visit(cursor);

    compiler.exit_scope();
    compiler.emit({ type: 'jump', addr: forStartAddr }, loc);
    (compiler.opcodes[forJumpOutIdx] as any).addr = compiler.opcodes.length;
    cursor.parent();
}

export function compileVarInit(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // kw<"init">
    cursor.nextSibling(); // Identifier
    const varName = compiler.source.slice(cursor.from, cursor.to);
    cursor.nextSibling(); // Op
    const isCatchInit = (cursor.name as string) === "CatchAssignOp";
    cursor.nextSibling(); // Expression
    compiler.visit(cursor);

    compiler.declare_var(varName, loc);
    compiler.emit({ type: 'init', name: varName, catch: isCatchInit }, loc);

    cursor.parent();
}

export function compileVarChange(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // kw<"change">
    cursor.nextSibling(); // Target

    const targetIdName = getIdentifierName(compiler.source, cursor);
    if (targetIdName) {
        if (!compiler.resolve_var(targetIdName)) {
            compiler.errors.push(new PercCompileError(
                `Variable '${targetIdName}' is not defined`,
                getLocation(compiler.source, cursor.from, cursor.to)
            ));
        }
        cursor.nextSibling(); // Op
        const isCatchChange = (cursor.name as string) === "CatchAssignOp";
        cursor.nextSibling(); // Expression
        compiler.visit(cursor);
        compiler.emit({ type: 'store', name: targetIdName, catch: isCatchChange }, loc);
    } else if ((cursor.name as string) === "MemberExpression") {
        cursor.firstChild(); // Object
        compiler.visit(cursor);
        cursor.nextSibling(); // "." or "["
        if ((cursor.name as string) === ".") {
            cursor.nextSibling(); // Identifier
            const propName = compiler.source.slice(cursor.from, cursor.to);
            cursor.parent();
            cursor.nextSibling(); // Op
            const isCatchChange = (cursor.name as string) === "CatchAssignOp";
            cursor.nextSibling(); // Expression
            compiler.visit(cursor);
            compiler.emit({ type: 'member_store', name: propName, catch: isCatchChange }, loc);
        } else { // "["
            cursor.nextSibling(); // Index
            compiler.visit(cursor);
            cursor.nextSibling(); // "]"
            cursor.parent();
            cursor.nextSibling(); // Op
            const isCatchChange = (cursor.name as string) === "CatchAssignOp";
            cursor.nextSibling(); // Expression
            compiler.visit(cursor);
            compiler.emit({ type: 'index_store', catch: isCatchChange }, loc);
        }
    }
    cursor.parent();
}

export function compileReturnStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // return
    if (cursor.nextSibling()) {
        compiler.visit(cursor);
    } else {
        compiler.emit({ type: 'push', imm: new perc_nil() }, loc);
    }
    compiler.emit({ type: 'ret' }, loc);
    cursor.parent();
}

export function compileDebuggerStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    compiler.emit({ type: 'debugger' }, loc);
}

export function compileExpressionStatement(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // Expression
    compiler.visit(cursor);
    compiler.emit({ type: 'pop' }, loc);
    cursor.parent();
}
