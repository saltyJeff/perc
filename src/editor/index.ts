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
    private currentMarkerId: number | null = null;
    private currentErrorMarkerId: number | null = null;

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

    public highlightRange(start: number, end: number) {
        const session = this.editor.session;
        const doc = session.getDocument();

        // Convert character offsets to row/column
        const startPos = doc.indexToPosition(start, 0);
        const endPos = doc.indexToPosition(end, 0);

        // Clear previous highlight
        this.clearHighlight();

        // Create Ace Range
        // Create Ace Range
        const Range = (ace as any).require("ace/range").Range;
        const range = new Range(startPos.row, startPos.column, endPos.row, endPos.column);

        // Add marker. "text" means it stays with the text. 
        // true means it's in the foreground
        this.currentMarkerId = session.addMarker(range, "eval-marker", "text", true);

        // Scroll to the highlight if not visible
        this.editor.scrollToLine(startPos.row, true, true, () => { });
    }

    public clearHighlight() {
        if (this.currentMarkerId !== null) {
            this.editor.session.removeMarker(this.currentMarkerId);
            this.currentMarkerId = null;
        }
    }

    public highlightError(line: number, column: number) {
        const session = this.editor.session;
        this.clearErrorHighlight();

        // Ace ranges are 0-indexed rows/cols
        // Peggy usually returns 1-indexed lines and columns
        const row = line - 1;
        const col = column - 1;

        const Range = (ace as any).require("ace/range").Range;

        // Highlight the specific character or a safe fallback range
        const range = new Range(row, col, row, col + 1);

        this.currentErrorMarkerId = session.addMarker(range, "error-marker", "text", true);
        this.editor.scrollToLine(row, true, true, () => { });
    }

    public clearErrorHighlight() {
        if (this.currentErrorMarkerId !== null) {
            this.editor.session.removeMarker(this.currentErrorMarkerId);
            this.currentErrorMarkerId = null;
        }
    }

    public enter_run_mode() {
        this.setReadOnly(true);
        this.clearErrorHighlight();
        this.editor.container.classList.add('running-mode');
    }

    public enter_debug_mode() {
        // Debug mode assumes we are already in running mode (read-only)
        // But we might want to add a specific class for debug visuals if needed
        this.editor.container.classList.add('debug-mode');
    }

    public enter_idle_mode() {
        this.setReadOnly(false);
        this.clearHighlight();
        this.clearErrorHighlight();
        this.editor.container.classList.remove('running-mode');
        this.editor.container.classList.remove('debug-mode');
    }
}
