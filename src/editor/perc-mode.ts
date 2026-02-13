import ace from "ace-builds";

// We use the internal Ace require to get base classes
const TextHighlightRules = (ace as any).require("ace/mode/text_highlight_rules").TextHighlightRules;
const TextMode = (ace as any).require("ace/mode/text").Mode;

export class PercHighlightRules extends TextHighlightRules {
    constructor() {
        super();
        const keywords = (
            "init|change|function|if|then|else|while|for|in|return|break|continue|new|true|false|nil|not|is|and|or|clone"
        );

        const buildinConstants = (
            "print"
        );

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

export class Mode extends TextMode {
    constructor() {
        super();
        this.HighlightRules = PercHighlightRules;
        this.$id = "ace/mode/perc";
    }

    getKeywords() {
        return [
            "init", "change", "function", "if", "then", "else", "while", "for", "in",
            "return", "break", "continue", "new", "true", "false", "nil", "not",
            "is", "and", "or", "clone"
        ];
    }
}

// Register for string-based access if needed
(ace as any).define("ace/mode/perc", ["require", "exports", "module"], function (_require: any, exports: any, _module: any) {
    exports.Mode = Mode;
});
