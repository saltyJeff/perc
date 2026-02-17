import { PaneCtrl } from '../ui/PaneCtrl';
import { ZoomControl } from '../ui/ZoomControl';
import styles from './EditorPane.module.css';

type PaneState = 'min' | 'max' | 'restore';

interface EditorPaneProps {
    state: PaneState;
    onStateChange: (state: PaneState) => void;
    onZoom: (size: number) => void;
}

export const EditorPane = (props: EditorPaneProps) => {
    return (
        <div
            id="editor-pane"
            class={`${styles.editorPane} ${props.state === 'max' ? styles.maximized : ''} ${props.state === 'min' ? styles.collapsed : ''}`}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <PaneCtrl
                        orientation={props.state === 'min' ? 'vertical' : 'horizontal'}
                        state={props.state}
                        onStateChange={props.onStateChange}
                    />
                    <span>Source Code</span>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                </div>
            </div>
            <div class={styles.content}>
                <div id="editor" class="pane-content"></div>
            </div>
        </div>
    );
};
