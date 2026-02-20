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
import { SourceLocation } from "../errors";

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
            state: this.createState(
                `// PerC GUI Kitchen Sink
init x = 100;
init y = 100;
init msg = "Click me!";
init val = 50;

while(true) then {
    window(800, 600);
    
    fill(rgb(255, 255, 255));
    rect(0, 0, 800, 600);
    
    fill(rgb(0, 0, 0));
    text("Welcome to PerC GUI!", 320, 30, "center");
    
    if (button(msg, 10, 50)) then {
        change msg = "Clicked!";
        change x = x + 10;
    }
    
    fill(rgb(200, 100, 100));
    circle(x, 150, 50);
    
    stroke(rgb(100, 200, 100), 5);
    line(10, 250, 300, 250);
    
    text("Slider Value: " + val, 10, 280, "left");
    change val = slider(10, 300);
    
    fill(rgb(100, 100, 255));
    polygon(400, 100, new [new {"x": 0, "y": 0}, new {"x": 50, "y": 0}, new {"x": 25, "y": 50}]);
    
    // Grouped transformations - will be reset after end_group
    group();
    translate(500, 300);
    rotate(0.1);
    fill(rgb(255, 255, 0));
    rect(0, 0, 100, 50);
    end_group();
    
    // Draw a smiley face using sprite (8x8 pixels) - scaled up 10x
    init yellow = rgb(255, 255, 0);
    init black = rgb(0, 0, 0);
    init faceData = new [
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, black, yellow, yellow, yellow, yellow, black, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, black, black, yellow, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow
    ];
    group();
    translate(600, 50);
    scale(10, 10);
    sprite(0, 0, 8, 8, faceData);
    end_group();
    
    // Textbox widget
    fill(rgb(0, 0, 0));
    text("Enter text:", 10, 350, "left");
    init userText = textbox(10, 370);
    text("You typed: " + userText, 10, 410, "left");
    
    // Checkbox widget (green check on black border)
    fill(rgb(0, 255, 0));
    stroke(rgb(0, 0, 0));
    init isChecked = checkbox(10, 430);
    text("Checkbox: " + isChecked, 40, 440, "left");
    
    // Radio button group "Colors"
    fill(rgb(128, 0, 128));
    stroke(rgb(0, 0, 255));
    init isRed = radio("Colors", 10, 460);
    text("Red: " + isRed, 40, 470, "left");
    
    init isBlue = radio("Colors", 30, 460);
    text("Blue: " + isBlue, 40, 500, "left");
    
    // Transparency demonstration (drawing blue on top of red)
    fill(rgba(0, 0, 255, 0.5));
    rect(400, 400, 100, 100);
    
    fill(rgba(255, 0, 0, 0.5));
    rect(350, 350, 100, 100);
    
    end_window();
            }`
            ),
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

    public setFontSize(pct: number) {
        this.fontSize = Math.round(pct * 14 / 100);
        this.view.dispatch({
            effects: this.fontSizeCompartment.reconfigure(EditorView.theme({
                "&": { height: "100%" },
                ".cm-scroller": { overflow: "auto" },
                ".cm-content, .cm-gutters": { minHeight: "100%" },
                ".cm-content": { fontSize: `${this.fontSize}px` },
                ".cm-gutters": { fontSize: `${this.fontSize}px` }
            }))
        });
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

    public highlightAndScroll(loc: SourceLocation | { start: number, end: number } | { line: number, column: number }, type: 'error' | 'debug' | 'info' = 'info') {
        let from, to;
        try {
            if ('line' in loc && !('start' in loc)) {
                const line = this.view.state.doc.line(loc.line);
                from = line.from + loc.column - 1;
                to = Math.min(from + 1, line.to);
            } else {
                const sloc = loc as SourceLocation;
                if (sloc.start && typeof sloc.start === 'object' && 'offset' in sloc.start) {
                    from = sloc.start.offset;
                    to = sloc.end.offset;
                } else if ('start' in loc && typeof (loc as any).start === 'number') {
                    from = (loc as any).start;
                    to = (loc as any).end;
                } else {
                    from = 0;
                    to = 0;
                }
            }

            if (from === undefined || to === undefined) return;
            if (from > to) [from, to] = [to, from];

            const docLength = this.view.state.doc.length;
            from = Math.max(0, Math.min(from, docLength));
            to = Math.max(0, Math.min(to, docLength));

            if (from === to) {
                if (to < docLength) {
                    to++;
                } else if (from > 0) {
                    from--;
                }
            }

            if (from === to) return;

            const effect = type === 'error' ? errorEffect : debugEffect;
            this.view.dispatch({
                effects: [
                    effect.of({ from, to }),
                    EditorView.scrollIntoView(from, { y: 'center' })
                ]
            });
        } catch (e: any) {
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
