import { TreeCursor } from "@lezer/common";
import { PercCompileError, SourceLocation } from "../../errors";

export function getLineCol(source: string, offset: number) {
    const lines = source.slice(0, offset).split("\n");
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

export function getLocation(source: string, start: number, end: number): SourceLocation {
    const startPos = getLineCol(source, start);
    const endPos = getLineCol(source, end);
    return {
        start: { offset: start, line: startPos.line, column: startPos.column },
        end: { offset: end, line: endPos.line, column: endPos.column }
    };
}

export function getIdentifierName(source: string, cursor: TreeCursor): string | null {
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
        name = source.slice(cursor.from, cursor.to);
    }
    // Restore cursor
    while (depth > 0) {
        cursor.parent();
        depth--;
    }
    return name;
}

export function expect(source: string, cursor: TreeCursor, expected: string, context: string) {
    const name = cursor.name as string;
    if (name === expected) return;

    // If we found an error node, let's look at the location
    if (name === "⚠") {
        throw new PercCompileError(
            `Expected '${expected}' in ${context}, but found syntax error (unexpected token)`,
            getLocation(source, cursor.from, cursor.to)
        );
    }

    // If we found something else, report it
    throw new PercCompileError(
        `Expected '${expected}' in ${context}, but found '${name}'`,
        getLocation(source, cursor.from, cursor.to)
    );
}
