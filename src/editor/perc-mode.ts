import ace from "ace-builds";

// We use the internal Ace require to get base classes
const TextHighlightRules = (ace as any).require("ace/mode/text_highlight_rules").TextHighlightRules;
const TextMode = (ace as any).require("ace/mode/text").Mode;



export class PercHighlightRules extends TextHighlightRules {
    constructor(builtins: string[] = ["print", "println"]) {
        super();
        const keywords = (
            "init|change|function|if|then|else|while|for|in|return|break|continue|debugger|new|true|false|nil|not|is|and|or|clone|typeof"
        );

        const buildinConstants = builtins.join("|");

        this.$rules = {
            "start": [
                {
                    token: "comment",
                    regex: /\/\/.*$/
                },
                {
                    token: "comment",
                    start: /\/\*/,
                    end: /\*\//
                },
                {
                    token: "string", // single line
                    regex: /"(?:[^"\\]|\\.)*"/
                },
                {
                    token: "string", // char literal
                    regex: /'(?:[^'\\]|\\.)*'/
                },
                {
                    token: "constant.numeric", // float
                    regex: /[+-]?\d+(?:_\d+)*\.(?:\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?|[+-]?\.\d+(?:_\d+)*(?:[eE][+-]?\d+(?:_\d+)*)?|[+-]?\d+(?:_\d+)*[eE][+-]?\d+(?:_\d+)*/
                },
                {
                    token: "constant.numeric", // integer
                    regex: /0x[0-9a-fA-F]+(?:_[0-9a-fA-F]+)*|0b[01]+(?:_[01]+)*|0o[0-7]+(?:_[0-7]+)*|\d+(?:_\d+)*/
                },
                {
                    token: "keyword",
                    regex: "\\b(" + keywords + ")\\b"
                },
                {
                    token: "support.function",
                    regex: "\\b(" + buildinConstants + ")\\b"
                },
                {
                    token: "variable.parameter",
                    regex: /[a-zA-Z_][a-zA-Z0-9_]*/
                },
                {
                    token: "keyword.operator",
                    regex: /==|!=|<=|>=|<|>|<=>|&&|\|\||!|\+|-|\*|\/|%|\*\*|&|\||\^|<<|>>|=/
                },
                {
                    token: "punctuation.operator",
                    regex: /\.|,|:|;|\(|\)|\[|\]|\{|\}|\|\)|\|\(/
                },
                {
                    token: "text",
                    regex: /\s+/
                }
            ]
        };
    }
}

class MatchingBraceOutdent {
    checkOutdent(line: string, input: string) {
        if (!/^\s+$/.test(line))
            return false;
        return /^\s*\}/.test(input);
    }

    autoOutdent(doc: any, row: number) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({ row: row, column: column });

        if (!openBracePos || openBracePos.row == row) return 0;

        const Range = (ace as any).require("ace/range").Range;
        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column - 1), indent);
    }

    $getIndent(line: string) {
        return line.match(/^\s*/)?.[0] || "";
    }
}

export class Mode extends TextMode {
    $outdent: MatchingBraceOutdent;

    constructor(builtins: string[] = ["print", "println"]) {
        super();
        this.HighlightRules = function () { return new PercHighlightRules(builtins); } as any;
        this.$outdent = new MatchingBraceOutdent();
        this.$id = "ace/mode/perc";
    }

    getNextLineIndent(state: string, line: string, tab: string) {
        let indent = this.$getIndent(line);

        const tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        const tokens = tokenizedLine.tokens;

        if (tokens.length && tokens[tokens.length - 1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            const match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    }

    checkOutdent(_state: string, line: string, input: string) {
        return this.$outdent.checkOutdent(line, input);
    }

    autoOutdent(_state: string, doc: any, row: number) {
        this.$outdent.autoOutdent(doc, row);
    }

    getKeywords() {
        return [
            "init", "change", "function", "if", "then", "else", "while", "for", "in",
            "return", "break", "continue", "debugger", "new", "true", "false", "nil", "not",
            "is", "and", "or", "clone", "typeof"
        ];
    }
}

// Register for string-based access if needed
(ace as any).define("ace/mode/perc", ["require", "exports", "module"], function (_require: any, exports: any, _module: any) {
    exports.Mode = Mode;
});
