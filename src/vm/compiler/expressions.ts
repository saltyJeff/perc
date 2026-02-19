import { TreeCursor } from "@lezer/common";
import { ICompiler } from "./types";
import { getIdentifierName, getLocation } from "./utils";
import { perc_number, perc_string, perc_bool, perc_nil } from "../perc_types";
import { PercCompileError } from "../../errors";

export function compileBinaryExpression(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // Left
    compiler.visit(cursor);
    cursor.nextSibling(); // Operator
    const binOp = compiler.source.slice(cursor.from, cursor.to);
    cursor.nextSibling(); // Right
    compiler.visit(cursor);
    compiler.emit({ type: 'binary_op', op: binOp }, loc);
    cursor.parent();
}

export function compileUnaryExpression(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // Op
    const unOp = compiler.source.slice(cursor.from, cursor.to);
    cursor.nextSibling(); // Operand
    compiler.visit(cursor);
    compiler.emit({ type: 'unary_op', op: unOp }, loc);
    cursor.parent();
}

export function compileCallExpression(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    const start = cursor.from;
    const end = cursor.to;

    cursor.firstChild(); // Callee
    const calleeName = getIdentifierName(compiler.source, cursor);

    if (calleeName === "typeof") {
        cursor.nextSibling(); // ArgumentList
        const count = compiler.visitArgumentList(cursor);
        if (count !== 1) throw new PercCompileError("typeof expects exactly 1 argument", getLocation(compiler.source, start, end));
        compiler.emit({ type: 'typeof' }, loc);
        cursor.parent();
        return;
    }

    if (calleeName && compiler.foreign_funcs.has(calleeName)) {
        cursor.nextSibling(); // ArgumentList
        const n = compiler.visitArgumentList(cursor);
        compiler.emit({ type: 'call_foreign', name: calleeName, nargs: n }, loc);
        cursor.parent();
        return;
    }

    cursor.nextSibling(); // ArgumentList
    const gArgs = compiler.visitArgumentList(cursor);
    cursor.prevSibling(); // Callee
    compiler.visit(cursor);
    compiler.emit({ type: 'call', nargs: gArgs }, loc);
    cursor.parent();
}

export function compileMemberExpression(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // Object
    compiler.visit(cursor);
    cursor.nextSibling(); // "." or "["
    if ((cursor.name as string) === ".") {
        cursor.nextSibling(); // Identifier
        const pName = compiler.source.slice(cursor.from, cursor.to);
        compiler.emit({ type: 'member_load', name: pName }, loc);
    } else {
        cursor.nextSibling(); // Index
        compiler.visit(cursor);
        compiler.emit({ type: 'index_load' }, loc);
    }
    cursor.parent();
}

export function compileInstantiationExpression(compiler: ICompiler, cursor: TreeCursor) {
    cursor.firstChild(); // new
    cursor.nextSibling(); // Literal (ArrayLiteral | MapLiteral)
    compiler.visit(cursor);
    cursor.parent();
}

export function compileArrayLiteral(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // "["
    let arrSize = 0;
    while (cursor.nextSibling() && (cursor.name as string) !== "]") {
        if ((cursor.name as string) !== ",") {
            compiler.visit(cursor);
            arrSize++;
        }
    }
    compiler.emit({ type: 'new_array', size: arrSize }, loc);
    cursor.parent();
}

export function compileTupleLiteral(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // "(|"
    let tupSize = 0;
    while (cursor.nextSibling() && (cursor.name as string) !== "|)") {
        if ((cursor.name as string) !== ",") {
            compiler.visit(cursor);
            tupSize++;
        }
    }
    compiler.emit({ type: 'new_tuple', size: tupSize }, loc);
    cursor.parent();
}

export function compileMapLiteral(compiler: ICompiler, cursor: TreeCursor) {
    const loc = { start: cursor.from, end: cursor.to };
    cursor.firstChild(); // "{"
    let mapSize = 0;
    while (cursor.nextSibling() && (cursor.name as string) !== "}") {
        if ((cursor.name as string) === "Pair") {
            cursor.firstChild(); // Key
            compiler.visit(cursor);
            cursor.nextSibling(); // :
            cursor.nextSibling(); // Value
            compiler.visit(cursor);
            cursor.parent();
            mapSize++;
        }
    }
    compiler.emit({ type: 'new_map', size: mapSize }, loc);
    cursor.parent();
}

export function compileFunction(compiler: ICompiler, cursor: TreeCursor, type: "FunctionDeclaration" | "FunctionLiteral") {
    const loc = { start: cursor.from, end: cursor.to };
    const funcJumpOverIdx = compiler.opcodes.length;
    compiler.emit({ type: 'jump', addr: 0 }, loc);
    const funcStartAddr = compiler.opcodes.length;
    cursor.firstChild(); // function
    let fName = "anonymous";
    if (type === "FunctionDeclaration") {
        cursor.nextSibling(); // Identifier
        fName = compiler.source.slice(cursor.from, cursor.to);
    }
    cursor.nextSibling(); // ParameterList
    const params: string[] = [];
    if (cursor.firstChild()) { // (
        while (cursor.nextSibling() && (cursor.name as string) !== ")") {
            if ((cursor.name as string) === "Identifier") {
                params.push(compiler.source.slice(cursor.from, cursor.to));
            }
        }
        cursor.parent();
    }
    compiler.enter_scope();
    params.slice().reverse().forEach(p => {
        compiler.declare_var(p, loc);
        compiler.emit({ type: 'init', name: p, catch: false }, loc);
    });
    cursor.nextSibling(); // Block
    compiler.visit(cursor);
    compiler.exit_scope();
    compiler.emit({ type: 'push', imm: new perc_nil() }, loc);
    compiler.emit({ type: 'ret' }, loc);
    (compiler.opcodes[funcJumpOverIdx] as any).addr = compiler.opcodes.length;
    compiler.emit({
        type: 'make_closure',
        addr: funcStartAddr,
        captured: [],
        name: fName
    }, loc);
    if (type === "FunctionDeclaration") {
        compiler.declare_var(fName, loc);
        compiler.emit({ type: 'init', name: fName, catch: false }, loc);
    }
    cursor.parent();
}

export function compileLiteral(compiler: ICompiler, cursor: TreeCursor) {
    const type = cursor.name as string;
    const start = cursor.from;
    const end = cursor.to;
    const loc = { start, end };

    switch (type) {
        case "IntegerLiteral":
            compiler.emit({ type: 'push', imm: new perc_number(parseInt(compiler.source.slice(start, end).replace(/_/g, '')), 'i32') }, loc);
            break;
        case "FloatLiteral":
            compiler.emit({ type: 'push', imm: new perc_number(parseFloat(compiler.source.slice(start, end).replace(/_/g, '')), 'f64') }, loc);
            break;
        case "StringLiteral":
            compiler.emit({ type: 'push', imm: new perc_string(JSON.parse(compiler.source.slice(start, end))) }, loc);
            break;
        case "BooleanLiteral":
            compiler.emit({ type: 'push', imm: new perc_bool(compiler.source.slice(start, end) === "true") }, loc);
            break;
        case "NilLiteral":
            compiler.emit({ type: 'push', imm: new perc_nil() }, loc);
            break;
    }
}
