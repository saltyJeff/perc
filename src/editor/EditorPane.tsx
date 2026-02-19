import { ZoomControl } from '../ui/ZoomControl';
import styles from './EditorPane.module.css';

interface EditorPaneProps {
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const EditorPane = (props: EditorPaneProps) => {
    return (
        <div
            id="editor-pane"
            class={`${styles.editorPane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
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
