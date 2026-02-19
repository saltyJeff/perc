import { ZoomControl } from '../ui/ZoomControl';
import styles from './ConsolePane.module.css';

interface ConsolePaneProps {
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const ConsolePane = (props: ConsolePaneProps) => {
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
                    <button class="icon-btn" id="console-clear" title="Clear Console" aria-label="Clear Console Output">⊘</button>
                </div>
            </div>
            <div class={styles.content}>
                <div id="console-output" class="pane-content" role="log" aria-live="polite" aria-label="Console Output"></div>
                <div class={styles.consoleInputContainer}>
                    <label for="repl-input" class={styles.prompt} aria-hidden="true">{">"}</label>
                    <input type="text" id="repl-input" class={styles.replInput} aria-label="REPL Input" placeholder="Enter code here..." />
                </div>
            </div>
        </section>
    );
};
