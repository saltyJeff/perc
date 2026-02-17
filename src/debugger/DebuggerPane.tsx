import { PaneCtrl } from '../ui/PaneCtrl';
import { ZoomControl } from '../ui/ZoomControl';
import styles from './DebuggerPane.module.css';

type PaneState = 'min' | 'max' | 'restore';

interface DebuggerPaneProps {
    state: PaneState;
    onStateChange: (state: PaneState) => void;
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
}

export const DebuggerPane = (props: DebuggerPaneProps) => {
    return (
        <div
            id="debugger-pane"
            class={`${styles.debuggerPane} ${props.state === 'max' ? styles.maximized : ''} ${props.state === 'min' ? styles.collapsed : ''} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <PaneCtrl
                        orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'}
                        state={props.state}
                        onStateChange={props.onStateChange}
                    />
                    <span>Debugger</span>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                </div>
            </div>
            <div class={styles.content}>
                <div id="debugger-content" class="pane-content"></div>
            </div>
        </div>
    );
};
