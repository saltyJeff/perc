import { onMount } from 'solid-js';
import { ZoomControl } from '../ui/ZoomControl';
import styles from './EditorPane.module.css';
import { Editor } from './index';

interface EditorPaneProps {
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const EditorPane = (props: EditorPaneProps) => {
    onMount(() => {
        const editor = new Editor('editor');
        if ((window as any).setEditor) {
            (window as any).setEditor(editor);
        }
    });

    return (
        <section
            id="editor-pane"
            class={`${styles.editorPane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            aria-labelledby="editor-title"
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <h2 id="editor-title" class={styles.title}>Source Code</h2>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                </div>
            </div>
            <div class={styles.content}>
                <div id="editor" class="pane-content" role="textbox" aria-multiline="true" aria-label="Source Code Editor"></div>
            </div>
        </section>
    );
};
