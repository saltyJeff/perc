import { TreeCursor } from "@lezer/common";
import { parser } from "./lang.grammar";

// Helper to compute line/column from offset
class SourceLocation {
    private lineOffsets: number[];
    public source: string;

    constructor(source: string) {
        this.source = source;
        this.lineOffsets = [0];
        for (let i = 0; i < source.length; i++) {
            if (source[i] === '\n') {
                this.lineOffsets.push(i + 1);
            }
        }
    }

    getLocation(offset: number) {
        let line = 0;
        let low = 0, high = this.lineOffsets.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (this.lineOffsets[mid] <= offset) {
                line = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        const column = offset - this.lineOffsets[line] + 1;
        return { offset, line: line + 1, column };
    }
}

export function parse(source: string) {
    const tree = parser.parse(source);
    const loc = new SourceLocation(source);
    const cursor = tree.cursor();
    return convertNode(cursor, loc, source);
}

function convertNode(cursor: TreeCursor, loc: SourceLocation, source: string): any {
    const type = cursor.name;
    const from = cursor.from;
    const to = cursor.to;
    const start = loc.getLocation(from);
    const end = loc.getLocation(to);
    const location = { start, end, source: "source" };

    const node: any = { type, location };

    switch (type) {
        case "Statement":
        case "Expression":
        case "PostfixExpression":
        case "PrimaryExpression":
        case "Literal":
            if (cursor.firstChild()) {
                const res = convertNode(cursor, loc, source);
                cursor.parent();
                return res;
            }
            return null;

        case "SourceFile":
            node.body = [];
            if (cursor.firstChild()) {
                do {
                    const child = convertNode(cursor, loc, source);
                    if (child) node.body.push(child);
                } while (cursor.nextSibling());
                cursor.parent();
            }
            return node;

        case "Block":
            node.body = [];
            if (cursor.firstChild()) {
                do {
                    const n = cursor.name;
                    if (n !== "{" && n !== "}" && n !== ";") {
                        const child = convertNode(cursor, loc, source);
                        if (child) node.body.push(child);
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
            return node;

        case "FunctionDeclaration":
            cursor.firstChild(); // function
            cursor.nextSibling(); // Identifier
            node.name = source.slice(cursor.from, cursor.to);
            cursor.nextSibling(); // ParameterList
            node.parameters = convertParameterList(cursor, source);
            cursor.nextSibling(); // Block
            node.body = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "VarInit":
            cursor.firstChild(); // init
            cursor.nextSibling(); // Identifier
            node.name = source.slice(cursor.from, cursor.to);
            cursor.nextSibling(); // Op
            node.isCatch = cursor.name === "CatchAssignOp";
            cursor.nextSibling(); // Expression
            node.value = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "VarChange":
            cursor.firstChild(); // change
            cursor.nextSibling(); // Target
            node.target = convertNode(cursor, loc, source);
            cursor.nextSibling(); // Op
            node.isCatch = cursor.name === "CatchAssignOp";
            cursor.nextSibling(); // Expression
            node.value = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "IfStatement":
            cursor.firstChild(); // if
            cursor.nextSibling(); // (
            cursor.nextSibling(); // Expression
            node.condition = convertNode(cursor, loc, source);
            cursor.nextSibling(); // )
            cursor.nextSibling(); // then
            cursor.nextSibling(); // Block
            node.consequence = convertNode(cursor, loc, source);
            if (cursor.nextSibling()) { // else token
                cursor.nextSibling(); // Block or IfStatement
                node.alternative = convertNode(cursor, loc, source);
            }
            cursor.parent();
            return node;

        case "WhileStatement":
            cursor.firstChild(); // while
            cursor.nextSibling(); // (
            cursor.nextSibling(); // Expression
            node.condition = convertNode(cursor, loc, source);
            cursor.nextSibling(); // )
            cursor.nextSibling(); // then
            cursor.nextSibling(); // Block
            node.body = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "ForInStatement":
            cursor.firstChild(); // for
            cursor.nextSibling(); // (
            cursor.nextSibling(); // init
            cursor.nextSibling(); // Identifier
            node.item = source.slice(cursor.from, cursor.to);
            cursor.nextSibling(); // in
            cursor.nextSibling(); // Expression
            node.collection = convertNode(cursor, loc, source);
            cursor.nextSibling(); // )
            cursor.nextSibling(); // then
            cursor.nextSibling(); // Block
            node.body = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "ReturnStatement":
            cursor.firstChild(); // return
            if (cursor.nextSibling()) {
                node.argument = convertNode(cursor, loc, source);
            } else {
                node.argument = null;
            }
            cursor.parent();
            return node;

        case "ExpressionStatement":
            cursor.firstChild();
            node.expression = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "BinaryExpression":
            cursor.firstChild();
            node.left = convertNode(cursor, loc, source);
            cursor.nextSibling();
            // Use source text for operator to match Peggy
            node.operator = source.slice(cursor.from, cursor.to);

            cursor.nextSibling();
            node.right = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "UnaryExpression":
            cursor.firstChild();
            node.operator = source.slice(cursor.from, cursor.to);

            cursor.nextSibling();
            node.operand = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "MemberExpression":
            cursor.firstChild(); // obj
            node.object = convertNode(cursor, loc, source);
            cursor.nextSibling(); // "." or "["
            if (cursor.name === ".") {
                cursor.nextSibling(); // Identifier
                node.property = source.slice(cursor.from, cursor.to);
                node.propertyType = "dot";
            } else {
                cursor.nextSibling(); // Expression
                node.index = convertNode(cursor, loc, source);
            }
            cursor.parent();
            return node;

        case "CallExpression":
            cursor.firstChild(); // callee
            node.callee = convertNode(cursor, loc, source);
            cursor.nextSibling(); // ArgumentList
            node.arguments = convertArgumentList(cursor, loc, source);
            cursor.parent();
            return node;

        case "Identifier":
            node.name = source.slice(cursor.from, cursor.to);
            return node;

        case "IntegerLiteral":
            node.value = source.slice(cursor.from, cursor.to);
            return node;
        case "FloatLiteral":
            node.value = source.slice(cursor.from, cursor.to);
            return node;
        case "StringLiteral":
            node.value = JSON.parse(source.slice(cursor.from, cursor.to));
            return node;
        case "BooleanLiteral":
            node.value = source.slice(cursor.from, cursor.to) === "true";
            return node;
        case "NilLiteral":
            return node;

        case "ArrayLiteral":
            node.elements = [];
            if (cursor.firstChild()) {
                do {
                    const n = cursor.name;
                    if (n !== "[" && n !== "]" && n !== ",") {
                        const child = convertNode(cursor, loc, source);
                        if (child) node.elements.push(child);
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
            return node;

        case "MapLiteral":
            node.pairs = [];
            if (cursor.firstChild()) {
                do {
                    if (cursor.name === "Pair") {
                        node.pairs.push(convertNode(cursor, loc, source));
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
            return node;

        case "Pair":
            cursor.firstChild();
            node.key = convertNode(cursor, loc, source);
            cursor.nextSibling(); // :
            cursor.nextSibling();
            node.value = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "TupleLiteral":
            node.elements = [];
            if (cursor.firstChild()) {
                do {
                    const n = cursor.name;
                    if (n !== "(|" && n !== "|)" && n !== ",") {
                        const child = convertNode(cursor, loc, source);
                        if (child) node.elements.push(child);
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
            return node;

        case "InstantiationExpression":
            cursor.firstChild(); // new
            cursor.nextSibling();
            node.expression = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "FunctionLiteral":
            cursor.firstChild(); // function
            cursor.nextSibling(); // ParameterList
            node.parameters = convertParameterList(cursor, source);
            cursor.nextSibling(); // Block
            node.body = convertNode(cursor, loc, source);
            cursor.parent();
            return node;

        case "ParenthesizedExpression":
            cursor.firstChild(); // (
            cursor.nextSibling(); // Expression
            const r = convertNode(cursor, loc, source);
            cursor.parent();
            return r;

        case "ParameterList":
        case "ArgumentList":
            // These should probably be handled by their parents, but if reached directly:
            return null;

        default:
            const n = cursor.name;
            if (n === "LineComment" || n === "BlockComment" || n === ";") return null;
            return { type: n, location };
    }
}

function convertParameterList(cursor: TreeCursor, source: string): string[] {
    const params: string[] = [];
    if (cursor.firstChild()) {
        do {
            if (cursor.name === "Identifier") {
                params.push(source.slice(cursor.from, cursor.to));
            }
        } while (cursor.nextSibling());
        cursor.parent();
    }
    return params;
}

function convertArgumentList(cursor: TreeCursor, loc: SourceLocation, source: string): any[] {
    const args: any[] = [];
    if (cursor.firstChild()) {
        do {
            const name = cursor.name;
            if (name !== "(" && name !== ")" && name !== ",") {
                const child = convertNode(cursor, loc, source);
                if (child) args.push(child);
            }
        } while (cursor.nextSibling());
        cursor.parent();
    }
    return args;
}
