import { styleTags, tags as t } from "@lezer/highlight"

export const highlighting = styleTags({
    "function init change if then else while for in return break continue debugger new true false nil not is and or": t.keyword,
    Identifier: t.variableName,
    StringLiteral: t.string,
    IntegerLiteral: t.number,
    FloatLiteral: t.number,
    BooleanLiteral: t.bool,
    NilLiteral: t.null,
    LineComment: t.lineComment,
    BlockComment: t.blockComment,
    "(": t.paren, ")": t.paren,
    "[": t.squareBracket, "]": t.squareBracket,
    "{": t.brace, "}": t.brace,
    ", ; : .": t.punctuation,

    "PlusOp MinusOp MultOp DivOp ModOp PowerOp AssignOp CatchAssignOp EqOp NeqOp LtOp GtOp LteOp GteOp CompareOp BitAndOp BitOrOp BitXorOp ShiftLeftOp ShiftRightOp LogicAndOp LogicOrOp LogicNotOp": t.operator,

    "init": t.definitionKeyword,
    "change": t.definitionKeyword
})
