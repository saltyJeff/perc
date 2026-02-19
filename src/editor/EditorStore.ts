import { createRoot, createSignal } from "solid-js";
import { Editor } from "./index";
import { SourceLocation } from "../errors";

function createEditorStore() {
    const [editor, setEditor] = createSignal<Editor | null>(null);

    return {
        setInstance: (instance: Editor | null) => setEditor(instance),

        getValue: () => editor()?.getValue() || "",
        setValue: (content: string) => editor()?.setValue(content),

        highlightRange: (start: number, end: number) => editor()?.highlightRange(start, end),
        highlightError: (line: number, column: number) => editor()?.highlightError(line, column),
        clearHighlight: () => editor()?.clearHighlight(),
        clearErrorHighlight: () => editor()?.clearErrorHighlight(),

        highlightVariableDefinition: (start: number, end: number) => editor()?.highlightVariableDefinition(start, end),
        clearVariableDefinitionHighlight: () => editor()?.clearVariableDefinitionHighlight(),

        enter_run_mode: () => editor()?.enter_run_mode(),
        enter_debug_mode: () => editor()?.enter_debug_mode(),
        enter_idle_mode: () => editor()?.enter_idle_mode(),

        setTheme: (theme: 'dark' | 'light' | 'contrast') => editor()?.setTheme(theme),
        setFontSize: (size: number) => editor()?.setFontSize(size),
        setWordWrap: (wrap: boolean) => editor()?.setWordWrap(wrap),

        setVariableProvider: (provider: () => string[]) => editor()?.setVariableProvider(provider),
        setBuiltins: (builtins: string[]) => editor()?.setBuiltins(builtins),

        highlightAndScroll: (loc: SourceLocation | { start: number, end: number } | { line: number, column: number }, type: 'error' | 'debug' | 'info' = 'info') =>
            editor()?.highlightAndScroll(loc, type),
    };
}

export const editorStore = createRoot(createEditorStore);
