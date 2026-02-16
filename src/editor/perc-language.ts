import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language";
import { CompletionContext, completeAnyWord } from "@codemirror/autocomplete";
import { parser } from "../lang.grammar";

export const keywords = "init change function if then else while for in return break continue debugger new true false nil not is and or clone typeof".split(" ");

export const percLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                Block: delimitedIndent({ closing: "}" }),
                MapLiteral: delimitedIndent({ closing: "}" }),
                ArrayLiteral: delimitedIndent({ closing: "]" }),
                TupleLiteral: delimitedIndent({ closing: "|)" }), // Lezer might struggle with 2-char token closing?
                // delimitedIndent expects a string for close token.
            }),
            foldNodeProp.add({
                Block: foldInside,
                MapLiteral: foldInside,
                ArrayLiteral: foldInside
            })
        ]
    }),
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        indentOnInput: /^\s*(\}|\]|\)|else|then)$/,
        closeBrackets: { brackets: ["(", "[", "{", "'", '"'] }
    }
});

export function percAutocomplete(builtins: string[] = [], variableProvider: () => string[] = () => []) {
    return (context: CompletionContext) => {
        let word = context.matchBefore(/\w*/);
        if (!word || (word.from == word.to && !context.explicit)) return null;

        if (/^\d/.test(word.text)) return null;

        const generatedVars = new Set<string>();
        // Using regex for vars is still simpler than traversing tree for now, 
        // though traversing tree would be more accurate for scoping.
        const content = context.state.doc.toString();
        const initRegex = /\binit\s+([a-zA-Z_]\w*)/g;
        let match;
        while ((match = initRegex.exec(content)) !== null) {
            generatedVars.add(match[1]);
        }

        variableProvider().forEach(v => generatedVars.add(v));
        keywords.forEach(k => generatedVars.delete(k));

        const options: any[] = [
            ...keywords.map(w => ({ label: w, type: "keyword", boost: 1 })),
            ...builtins.map(w => ({ label: w, type: "function", boost: 2 })),
            ...Array.from(generatedVars).map(w => ({ label: w, type: "variable", boost: 3 }))
        ];

        const anyWord = completeAnyWord(context);
        if (anyWord && !(anyWord instanceof Promise) && anyWord.options) {
            anyWord.options.forEach((opt: any) => {
                const label = typeof opt === 'string' ? opt : opt.label;
                if (!keywords.includes(label) && !builtins.includes(label) && !generatedVars.has(label)) {
                    options.push({ label: label, type: "text", boost: 0 });
                }
            });
        }

        return {
            from: word.from,
            options: options,
            validFor: /^\w*$/
        };
    };
}

export function perc(builtins: string[] = [], variableProvider: () => string[] = () => []) {
    return new LanguageSupport(percLanguage, [
        percLanguage.data.of({
            autocomplete: percAutocomplete(builtins, variableProvider)
        })
    ]);
}
