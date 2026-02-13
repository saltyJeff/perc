import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-one_dark';
import 'ace-builds/src-noconflict/theme-chrome';
import './perc-theme';
import { Mode as PercMode } from './perc-mode';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-text';

// Configure Ace path for resources if needed - often required for workers
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict');

/**
 * Editor class wrapping Ace Editor functionality
 */
export class Editor {
    private editor: ace.Ace.Editor;

    constructor(containerId: string) {
        this.editor = ace.edit(containerId);
        this.setup();
    }

    private setup() {
        // Basic configuration
        this.editor.setTheme("ace/theme/perc-dark");
        this.editor.session.setMode(new PercMode() as any);

        // Options as per requirements
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            // Enable live autocompletion for a better user experience while typing
            enableLiveAutocompletion: true,
            enableSnippets: false,
            fontSize: "14px",
            showPrintMargin: false,
            wrap: true,
            tabSize: 4,
            useSoftTabs: true
        });

        // Basic keyword completion setup from PerC grammar
        const staticWordCompleter = {
            getCompletions: (_editor: ace.Ace.Editor, _session: ace.Ace.EditSession, _pos: ace.Ace.Point, _prefix: string, callback: any) => {
                const keywords = [
                    "init", "change", "function", "if", "then", "else", "while", "for", "in",
                    "return", "break", "continue", "new", "true", "false", "nil", "not",
                    "is", "and", "or", "clone"
                ];
                const builtins = ["print"]; // Common built-in functions

                const completions = [
                    ...keywords.map(word => ({ caption: word, value: word, meta: "keyword" })),
                    ...builtins.map(word => ({ caption: word, value: word, meta: "builtin" }))
                ];

                callback(null, completions);
            }
        };

        const langTools = (ace as any).require("ace/ext/language_tools");
        this.editor.completers = [
            langTools.textCompleter, // Suggestions from current document
            langTools.keyWordCompleter, // Suggestions from mode keywords
            staticWordCompleter // Custom PerC keywords
        ];
    }

    public setValue(content: string) {
        this.editor.setValue(content, -1); // -1 moves cursor to start
    }

    public getValue(): string {
        return this.editor.getValue();
    }

    public resize() {
        this.editor.resize();
    }

    public setFontSize(size: number) {
        this.editor.setFontSize(`${size}px`);
    }

    public setTheme(theme: 'dark' | 'light') {
        this.editor.setTheme(theme === 'dark' ? "ace/theme/perc-dark" : "ace/theme/chrome");
    }

    public setWordWrap(wrap: boolean) {
        this.editor.session.setUseWrapMode(wrap);
    }

    public setReadOnly(readOnly: boolean) {
        this.editor.setReadOnly(readOnly);
    }
}
