import { ZoomControl } from '../ui/ZoomControl';
import styles from './ConsolePane.module.css';
import { For, createEffect } from 'solid-js';
import { ConsoleState } from './ConsoleStore';

interface ConsolePaneProps {
    state: ConsoleState;
    onZoom: (size: number) => void;
    onClear: () => void;
    onInput: (text: string) => void;
    onNavigateHistory: (direction: 'up' | 'down', current: string) => string | null;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const ConsolePane = (props: ConsolePaneProps) => {
    let outputRef: HTMLDivElement | undefined;
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        // Scroll to bottom when entries change
        if (props.state.entries.length > 0 && outputRef) {
            outputRef.scrollTop = outputRef.scrollHeight;
        }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            const val = inputRef?.value || "";
            props.onInput(val);
            if (inputRef) inputRef.value = "";
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const cmd = props.onNavigateHistory('up', inputRef?.value || "");
            if (cmd !== null && inputRef) inputRef.value = cmd;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const cmd = props.onNavigateHistory('down', inputRef?.value || "");
            if (cmd !== null && inputRef) inputRef.value = cmd;
        }
    };

    return (
        <section
            id="console-pane"
            class={`${styles.consolePane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            aria-labelledby="console-title"
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <h2 id="console-title" class={styles.title}>Console / REPL</h2>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                    <button class="icon-btn" onClick={props.onClear} title="Clear Console" aria-label="Clear Console Output">⊘</button>
                </div>
            </div>
            <div class={styles.content}>
                <div
                    id="console-output"
                    ref={outputRef}
                    class={`${styles.logArea} pane-content`}
                    role="log"
                    aria-live="polite"
                    aria-label="Console Output"
                >
                    <For each={props.state.entries}>
                        {(entry) => (
                            <div
                                class={`console-entry ${entry.type} ${entry.location ? 'console-error-link' : ''}`}
                                onClick={() => entry.location && (window as any).editor?.highlightAndScroll(entry.location, 'error')}
                                title={entry.location ? 'Click to show error location' : ''}
                                style={{
                                    cursor: entry.location ? 'pointer' : 'default',
                                    color: entry.color
                                }}
                            >
                                {entry.msg}
                            </div>
                        )}
                    </For>
                </div>
                <div class={styles.consoleInputContainer}>
                    <label for="repl-input" class={styles.prompt} aria-hidden="true">{">"}</label>
                    <input
                        type="text"
                        id="repl-input"
                        ref={inputRef}
                        class={styles.replInput}
                        aria-label="REPL Input"
                        placeholder="Enter code here..."
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>
        </section>
    );
};
