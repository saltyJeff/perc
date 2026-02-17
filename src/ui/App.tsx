import { createSignal, onMount, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { MenuBar } from './MenuBar';
import { EditorPane } from '../editor/EditorPane';
import { DebuggerPane } from '../debugger/DebuggerPane';
import { ConsolePane } from '../console/ConsolePane';
import $ from 'jquery';
import styles from './App.module.css';

interface AppProps {
    onRun: () => void;
    onStop: () => void;
    onStep: () => void;
    onContinue: () => void;
    onBuild: () => void;
    onTheme: (theme: 'light' | 'dark') => void;
    onWrap: (wrap: 'on' | 'off') => void;
    onEditorZoom: (size: number) => void;
    onDebuggerZoom: (size: number) => void;
    onConsoleZoom: (size: number) => void;
}

type PaneState = 'min' | 'max' | 'restore';

export const App = (props: AppProps) => {
    const [menuState, setMenuState] = createSignal<'idle' | 'running' | 'debugging'>('idle');

    const [paneStates, setPaneStates] = createStore({
        editor: 'restore' as PaneState,
        debugger: 'restore' as PaneState,
        console: 'restore' as PaneState
    });

    // These will be used to expose the state setters to index.tsx
    (window as any).setMenuState = setMenuState;
    (window as any).setPaneState = (name: 'editor' | 'debugger' | 'console', state: PaneState) => {
        handlePaneStateChange(name, state);
    };

    const handlePaneStateChange = (name: 'editor' | 'debugger' | 'console', state: PaneState) => {
        if (state === 'max') {
            setPaneStates({
                editor: name === 'editor' ? 'max' : 'min',
                debugger: name === 'debugger' ? 'max' : 'min',
                console: name === 'console' ? 'max' : 'min'
            });
        } else if (state === 'restore') {
            setPaneStates({
                editor: 'restore',
                debugger: 'restore',
                console: 'restore'
            });
        } else {
            setPaneStates(name, 'min');
        }

        // Trigger editor resize (legacy)
        if ((window as any).editor) {
            setTimeout(() => (window as any).editor.resize(), 0);
        }
    };

    // Resizing logic
    let isDraggingV = false;
    let isDraggingH = false;

    const onMouseDownV = (e: MouseEvent) => {
        isDraggingV = true;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    };

    const onMouseDownH = (e: MouseEvent) => {
        isDraggingH = true;
        document.body.style.cursor = 'row-resize';
        e.preventDefault();
    };

    let resizeFrame: number | null = null;
    const triggerResize = () => {
        if (resizeFrame) return;
        resizeFrame = requestAnimationFrame(() => {
            if ((window as any).editor) (window as any).editor.resize();
            resizeFrame = null;
        });
    };

    const onMouseMove = (e: MouseEvent) => {
        if (isDraggingV) {
            const $mainLayout = $('#main-layout');
            const totalWidth = $mainLayout.width() || 0;
            const newEditorWidth = e.clientX;

            const $editor = $('#editor-pane');
            if (newEditorWidth < 60) {
                if (paneStates.editor !== 'min') handlePaneStateChange('editor', 'min');
                $editor.css('width', '32px');
                $editor.css('flex', '0 0 32px');
            } else if (totalWidth - newEditorWidth < 60) {
                // Too far right, don't allow
            } else {
                if (paneStates.editor === 'min') handlePaneStateChange('editor', 'restore');
                $editor.css('width', newEditorWidth + 'px');
                $editor.css('flex', '0 0 ' + newEditorWidth + 'px');
            }
            triggerResize();
        }
        if (isDraggingH) {
            const $vContainer = $('#vertical-container');
            const totalHeight = $vContainer.height() || 0;
            const menubarHeight = $('.menu-bar').height() || 0; // Note: menu-bar is outside vertical-container but above it in flow
            // Actually, clientY is relative to viewport. menubarHeight is correct if it's top:0.
            const localY = e.clientY - menubarHeight;
            const newDebugHeight = localY;

            const $debugger = $('#debugger-pane');
            if (newDebugHeight < 60) {
                if (paneStates.debugger !== 'min') handlePaneStateChange('debugger', 'min');
                $debugger.css('height', '32px');
                $debugger.css('flex', '0 0 32px');
            } else if (totalHeight - newDebugHeight < 60) {
                if (paneStates.console !== 'min') handlePaneStateChange('console', 'min');
                // $debugger stays full height minus console strip
            } else {
                if (paneStates.debugger === 'min') handlePaneStateChange('debugger', 'restore');
                if (paneStates.console === 'min') handlePaneStateChange('console', 'restore');
                $debugger.css('height', newDebugHeight + 'px');
                $debugger.css('flex', '0 0 ' + newDebugHeight + 'px');
            }
            triggerResize();
        }
    };

    const onMouseUp = () => {
        isDraggingV = false;
        isDraggingH = false;
        document.body.style.cursor = 'default';
    };

    onMount(() => {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    onCleanup(() => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    });

    return (
        <div id="app-root" class={styles.app}>
            <MenuBar
                menuState={menuState()}
                onRun={props.onRun}
                onStop={props.onStop}
                onStep={props.onStep}
                onContinue={props.onContinue}
                onBuild={props.onBuild}
                onTheme={props.onTheme}
                onWrap={props.onWrap}
            />
            <div id="main-layout" class={styles.mainLayout}>
                <EditorPane
                    state={paneStates.editor}
                    onStateChange={(s) => handlePaneStateChange('editor', s)}
                    onZoom={props.onEditorZoom}
                />

                <div
                    class={`${styles.splitter} ${styles.vSplit}`}
                    id="v-split"
                    onMouseDown={onMouseDownV}
                    style={{ display: (paneStates.editor === 'max' || paneStates.editor === 'min') ? 'none' : 'block' }}
                ></div>

                <div id="vertical-container"
                    class={styles.verticalContainer}
                    style={{
                        flex: paneStates.editor === 'max' ? '0 0 32px' : '1'
                    }}
                >
                    <DebuggerPane
                        state={paneStates.debugger}
                        onStateChange={(s) => handlePaneStateChange('debugger', s)}
                        onZoom={props.onDebuggerZoom}
                        orientation={paneStates.editor === 'max' ? 'vertical' : 'horizontal'}
                    />

                    <div
                        class={`${styles.splitter} ${styles.hSplit}`}
                        id="h-split"
                        onMouseDown={onMouseDownH}
                        style={{ display: (paneStates.console === 'max' || paneStates.console === 'min' || paneStates.debugger === 'max' || paneStates.editor === 'max') ? 'none' : 'block' }}
                    ></div>

                    <ConsolePane
                        state={paneStates.console}
                        onStateChange={(s) => handlePaneStateChange('console', s)}
                        onZoom={props.onConsoleZoom}
                        orientation={paneStates.editor === 'max' ? 'vertical' : 'horizontal'}
                    />
                </div>
            </div>
        </div>
    );
};
