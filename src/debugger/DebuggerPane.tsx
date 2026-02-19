import { ZoomControl } from '../ui/ZoomControl';
import styles from './DebuggerPane.module.css';

interface DebuggerPaneProps {
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const DebuggerPane = (props: DebuggerPaneProps) => {
    return (
        <section
            id="debugger-pane"
            class={`${styles.debuggerPane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            aria-labelledby="debugger-title"
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <h2 id="debugger-title" class={styles.title}>Debugger</h2>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                </div>
            </div>
            <div class={styles.content}>
                <div id="debugger-content" class="pane-content" role="region" aria-live="polite" aria-label="Debugger State"></div>
            </div>
        </section>
    );
};
