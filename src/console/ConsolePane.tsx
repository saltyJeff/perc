import { PaneCtrl } from '../ui/PaneCtrl';
import { ZoomControl } from '../ui/ZoomControl';
import styles from './ConsolePane.module.css';

type PaneState = 'min' | 'max' | 'restore';

interface ConsolePaneProps {
    state: PaneState;
    onStateChange: (state: PaneState) => void;
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
}

export const ConsolePane = (props: ConsolePaneProps) => {
    return (
        <div
            id="console-pane"
            class={`${styles.consolePane} ${props.state === 'max' ? styles.maximized : ''} ${props.state === 'min' ? styles.collapsed : ''} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <PaneCtrl
                        orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'}
                        state={props.state}
                        onStateChange={props.onStateChange}
                    />
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
