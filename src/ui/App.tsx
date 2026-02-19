import { onMount, onCleanup, createEffect, createMemo, createSignal } from 'solid-js';
import { MenuBar } from './MenuBar';
import { EditorPane } from '../editor/EditorPane';
import { DebuggerPane } from '../debugger/DebuggerPane';
import { ConsolePane } from '../console/ConsolePane';
import { appStore, VMState } from './AppStore';
import styles from './App.module.css';

import { VM } from '../vm';
import { ConsoleState } from '../console/ConsoleStore';

interface AppProps {
    vm: VM;
    consoleState: ConsoleState;
    onConsoleClear: () => void;
    onConsoleInput: (text: string) => void;
    onConsoleNavigateHistory: (direction: 'up' | 'down', current: string) => string | null;
    onRun: () => void;
    onStop: () => void;
    onStep: () => void;
    onContinue: () => void;
    onBuild: () => void;
    onTheme: (theme: 'light' | 'dark' | 'contrast') => void;
    onWrap: (wrap: 'on' | 'off') => void;
    onEditorZoom: (size: number) => void;
    onDebuggerZoom: (size: number) => void;
    onConsoleZoom: (size: number) => void;
}

export const App = (props: AppProps) => {
    let mainLayoutRef: HTMLDivElement | undefined;
    let verticalContainerRef: HTMLDivElement | undefined;

    const [isDragging, setIsDragging] = createSignal(false);

    // Expose layout actions to window for any legacy glue code
    (window as any).setMenuState = (state: string) => appStore.setVM(state as VMState);
    (window as any).setPaneState = (pane: string, state: string) => {
        if (pane === 'debugger') {
            appStore.updateSize('dc', state === 'min' ? 0.01 : 0.5);
        }
    };

    // Resizing logic
    let isDraggingV = false;
    let isDraggingH = false;

    const startDraggingV = (e: MouseEvent) => {
        isDraggingV = true;
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.classList.add(styles.noSelect);
        e.preventDefault();
    };

    const startDraggingH = (e: MouseEvent) => {
        isDraggingH = true;
        setIsDragging(true);
        document.body.style.cursor = 'row-resize';
        document.body.classList.add(styles.noSelect);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingV && mainLayoutRef) {
            const rect = mainLayoutRef.getBoundingClientRect();
            // Calculate ratio but keep it within bounds to ensure 32px minimum visibility for BOTH sides
            const minRatio = 32 / rect.width;
            const ratio = (e.clientX - rect.left) / rect.width;
            appStore.updateSize('editor_dc', Math.max(minRatio, Math.min(1 - minRatio, ratio)));
        }
        if (isDraggingH && verticalContainerRef) {
            const rect = verticalContainerRef.getBoundingClientRect();
            const minRatio = 32 / rect.height;
            const ratio = (e.clientY - rect.top) / rect.height;
            appStore.updateSize('dc', Math.max(minRatio, Math.min(1 - minRatio, ratio)));
        }
    };

    const handleMouseUp = () => {
        if (isDraggingV || isDraggingH) {
            isDraggingV = false;
            isDraggingH = false;
            setIsDragging(false);
            document.body.style.cursor = 'default';
            document.body.classList.remove(styles.noSelect);
        }
    };

    let resizeFrame: number | null = null;
    const triggerResize = () => {
        if (resizeFrame) return;
        resizeFrame = requestAnimationFrame(() => {
            if ((window as any).editor && typeof (window as any).editor.resize === 'function') {
                (window as any).editor.resize();
            }
            resizeFrame = null;
        });
    };

    createEffect(() => {
        appStore.layout.editorSplit;
        appStore.layout.dcSplit;
        triggerResize();
    });

    onMount(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    // Ratio-based orientation: Vertical only if the pane is really skinny strictly width-wise
    const editorOrientation = createMemo(() => appStore.layout.editorSplit < 0.1 ? 'vertical' : 'horizontal');

    // The DC container width determines if its children (Debugger/Console) are skinny width-wise.
    const dcOrientation = createMemo(() => (1 - appStore.layout.editorSplit) < 0.1 ? 'vertical' : 'horizontal');

    // Debugger and Console only need to be vertical if their parent container (DC) is vertical.
    // Their own "minimized" state is height-based, which should NOT trigger vertical text orientation.
    const debugOrientation = dcOrientation;
    const consoleOrientation = dcOrientation;

    return (
        <div id="app-root" class={`${styles.app} ${isDragging() ? styles.isDragging : ''}`} style={{
            "--pane-transition-dur": isDragging() ? "0s" : "0.4s"
        }}>
            <a href="#editor" class={styles.skipLink}>Skip to Editor</a>
            <MenuBar
                menuState={appStore.vm.state}
                onRun={props.onRun}
                onStop={props.onStop}
                onStep={props.onStep}
                onContinue={props.onContinue}
                onBuild={props.onBuild}
                onTheme={props.onTheme}
                onWrap={props.onWrap}
            />
            <main id="main-layout" class={styles.mainLayout} ref={mainLayoutRef}>
                <EditorPane
                    onZoom={props.onEditorZoom}
                    orientation={editorOrientation()}
                    style={{ flex: `${appStore.layout.editorSplit} 1 0px` }}
                />

                <div
                    class={`${styles.splitter} ${styles.vSplit}`}
                    onMouseDown={startDraggingV}
                    role="separator"
                    aria-orientation="vertical"
                    aria-valuenow={Math.round(appStore.layout.editorSplit * 100)}
                    aria-label="Editor and side panel resizer"
                    tabindex="0"
                ></div>

                <div id="vertical-container"
                    ref={verticalContainerRef}
                    class={styles.verticalContainer}
                    style={{
                        flex: `${1 - appStore.layout.editorSplit} 1 0px`,
                        "--pane-transition-dur": isDragging() ? "0s" : "0.4s"
                    }}
                >
                    <DebuggerPane
                        vm={props.vm}
                        onZoom={props.onDebuggerZoom}
                        orientation={debugOrientation()}
                        style={{ flex: `${appStore.layout.dcSplit} 1 0px` }}
                    />

                    <div
                        class={`${styles.splitter} ${styles.hSplit}`}
                        onMouseDown={startDraggingH}
                        role="separator"
                        aria-orientation="horizontal"
                        aria-valuenow={Math.round(appStore.layout.dcSplit * 100)}
                        aria-label="Debugger and console resizer"
                        tabindex="0"
                    ></div>

                    <ConsolePane
                        state={props.consoleState}
                        onZoom={props.onConsoleZoom}
                        onClear={props.onConsoleClear}
                        onInput={props.onConsoleInput}
                        onNavigateHistory={props.onConsoleNavigateHistory}
                        orientation={consoleOrientation()}
                        style={{ flex: `${1 - appStore.layout.dcSplit} 1 0px` }}
                    />
                </div>
            </main>
        </div>
    );
};
