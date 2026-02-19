import { ZoomControl } from '../ui/ZoomControl';
import styles from './ConsolePane.module.css';

interface ConsolePaneProps {
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const ConsolePane = (props: ConsolePaneProps) => {
    return (
        <div
            id="console-pane"
            class={`${styles.consolePane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <span>Console / REPL</span>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                    <button class="icon-btn" id="console-clear" title="Clear Console">⊘</button>
                </div>
            </div>
            <div class={styles.content}>
                <div id="console-output" class="pane-content"></div>
                <div class={styles.consoleInputContainer}>
                    <span class={styles.prompt}>{">"}</span>
                    <input type="text" id="repl-input" class={styles.replInput} />
                </div>
            </div>
        </div>
    );
};
