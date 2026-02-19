import { basicSetup, EditorView } from "codemirror";
import { keymap, Decoration } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { EditorState, StateEffect, StateField, Compartment } from "@codemirror/state";
import type { StateEffectType } from "@codemirror/state";
import { githubDark } from "@fsegurai/codemirror-theme-github-dark";
import { githubLight } from "@fsegurai/codemirror-theme-github-light";
import { monokai } from "@fsegurai/codemirror-theme-monokai";
import { perc } from "./perc-language";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";

type HighlightRange = { from: number, to: number };

const debugEffect = StateEffect.define<HighlightRange | null>();
const errorEffect = StateEffect.define<HighlightRange | null>();
const varDefEffect = StateEffect.define<HighlightRange | null>();

const createHighlightField = (effect: StateEffectType<HighlightRange | null>, className: string) => {
    return StateField.define<DecorationSet>({
        create() { return Decoration.none; },
        update(highlights, tr) {
            highlights = highlights.map(tr.changes);
            for (let e of tr.effects) {
                if (e.is(effect)) {
                    if (e.value === null) {
                        highlights = Decoration.none;
                    } else if (e.value) {
                        highlights = Decoration.set([
                            Decoration.mark({ class: className }).range(e.value.from, e.value.to)
                        ]);
                    }
                }
            }
            return highlights;
        },
        provide: f => EditorView.decorations.from(f)
    });
};

const debugHighlightField = createHighlightField(debugEffect, "eval-marker");
const errorHighlightField = createHighlightField(errorEffect, "error-marker");
const varDefHighlightField = createHighlightField(varDefEffect, "variable-def-highlight");

/**
 * Editor class wrapping CodeMirror 6 Editor functionality
 */
export class Editor {
    private view: EditorView;
    private container: HTMLElement;
    private variableProvider: () => string[] = () => [];
    private builtins: string[] = ["print", "println"];
    private readOnly = false;
    private fontSize = 14;
    private theme: 'dark' | 'light' | 'contrast' = 'dark';
    private wordWrap = true;
    private fontSizeCompartment = new Compartment();

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container #${containerId} not found`);
        this.container = container;

        this.view = new EditorView({
            state: this.createState(""),
            parent: container
        });
    }

    private createState(content: string) {
        return EditorState.create({
            doc: content,
            extensions: [
                basicSetup,
                keymap.of([indentWithTab]),
                indentUnit.of("    "),
                autocompletion({ activateOnTyping: true }),
                perc(this.builtins, this.variableProvider),
                this.theme === 'dark' ? githubDark : (this.theme === 'contrast' ? monokai : githubLight),
                EditorState.readOnly.of(this.readOnly),
                this.wordWrap ? EditorView.lineWrapping : [],
                debugHighlightField,
                errorHighlightField,
                varDefHighlightField,
                this.fontSizeCompartment.of(EditorView.theme({
                    "&": { height: "100%" },
                    ".cm-scroller": { overflow: "auto" },
                    ".cm-content, .cm-gutters": { minHeight: "100%" },
                    ".cm-content": { fontSize: `${this.fontSize}px` },
                    ".cm-gutters": { fontSize: `${this.fontSize}px` }
                })),
            ]
        });
    }

    private updateExtensions() {
        this.view.setState(this.createState(this.view.state.doc.toString()));
    }

    public setVariableProvider(provider: () => string[]) {
        this.variableProvider = provider;
        this.updateExtensions();
    }

    public setBuiltins(builtins: string[]) {
        this.builtins = builtins;
        this.updateExtensions();
    }

    public setValue(content: string) {
        this.view.dispatch({
            changes: { from: 0, to: this.view.state.doc.length, insert: content },
            selection: { anchor: 0 }
        });
    }

    public getValue(): string {
        return this.view.state.doc.toString();
    }

    public resize() {
        // CodeMirror 6 usually handles resize automatically
    }

    public setFontSize(pct: number) {
        // TODO: update font compartment instead of the whole thing.
        this.fontSize = Math.round(pct * 14 / 100);
        this.updateExtensions();
    }

    public setTheme(theme: 'dark' | 'light' | 'contrast') {
        this.theme = theme;
        this.updateExtensions();
    }

    public setWordWrap(wrap: boolean) {
        this.wordWrap = wrap;
        this.updateExtensions();
    }

    public setReadOnly(readOnly: boolean) {
        this.readOnly = readOnly;
        this.updateExtensions();
    }

    public highlightAndScroll(loc: { start: number, end: number } | { line: number, column: number }, type: 'error' | 'debug' | 'info' = 'info') {
        let from, to;
        try {
            if ('line' in loc) {
                const line = this.view.state.doc.line(loc.line);
                from = line.from + loc.column - 1;
                to = Math.min(from + 1, line.to);
            } else {
                from = Math.max(0, loc.start);
                to = Math.min(loc.end, this.view.state.doc.length);
            }

            if (from > to) [from, to] = [to, from];

            const effect = type === 'error' ? errorEffect : debugEffect;
            this.view.dispatch({
                effects: [
                    effect.of({ from, to }),
                    EditorView.scrollIntoView(from, { y: 'center' })
                ]
            });
        } catch (e) {
            console.error("Failed to highlight:", e, loc);
        }
    }

    public highlightRange(start: number, end: number) {
        this.highlightAndScroll({ start, end }, 'debug');
    }

    public highlightError(line: number, column: number) {
        this.highlightAndScroll({ line, column }, 'error');
    }

    public clearHighlight() {
        this.view.dispatch({ effects: debugEffect.of(null) });
    }

    public clearErrorHighlight() {
        this.view.dispatch({ effects: errorEffect.of(null) });
    }

    public enter_run_mode() {
        this.setReadOnly(true);
        this.clearErrorHighlight();
        this.container.classList.add('running-mode');
    }

    public enter_debug_mode() {
        this.container.classList.add('debug-mode');
    }

    public enter_idle_mode() {
        this.setReadOnly(false);
        this.clearHighlight();
        this.clearErrorHighlight();
        this.container.classList.remove('running-mode');
        this.container.classList.remove('debug-mode');
    }

    public highlightVariableDefinition(start: number, end: number) {
        const from = Math.max(0, start);
        const to = Math.min(end, this.view.state.doc.length);
        this.view.dispatch({
            effects: [
                varDefEffect.of({ from, to }),
                EditorView.scrollIntoView(from, { y: 'center' })
            ]
        });
    }

    public clearVariableDefinitionHighlight() {
        this.view.dispatch({ effects: varDefEffect.of(null) });
    }
}
