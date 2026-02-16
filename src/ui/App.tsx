import { createSignal } from 'solid-js';
import { MenuBar } from './MenuBar';

interface AppProps {
    onRun: () => void;
    onStop: () => void;
    onStep: () => void;
    onContinue: () => void;
    onBuild: () => void;
    onTheme: (theme: 'light' | 'dark') => void;
    onWrap: (wrap: 'on' | 'off') => void;
}

export const App = (props: AppProps) => {
    const [menuState, setMenuState] = createSignal<'idle' | 'running' | 'debugging'>('idle');

    // These will be used to expose the state setters to index.tsx
    (window as any).setMenuState = setMenuState;

    return (
        <div id="app-root" style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
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
            <div id="main-layout" style="flex: 1; display: flex; overflow: hidden; position: relative;">
                <div id="vertical-container" style="display: flex; flex: 1; flex-direction: column; overflow: hidden;">
                    <div id="top-container" style="display: flex; flex: 1; flex-direction: row; overflow: hidden;">
                        <div id="editor-pane" class="pane">
                            <div class="pane-header">
                                <div class="pane-title-area">
                                    <div class="pane-toggle-group">
                                        <button class="pane-btn btn-min" title="Minimize" data-action="minimize"></button>
                                        <button class="pane-btn btn-restore" title="Restore" data-action="restore"></button>
                                        <button class="pane-btn btn-max" title="Maximize" data-action="maximize"></button>
                                    </div>
                                    <span>Source Code</span>
                                </div>
                                <div class="pane-controls" id="editor-zoom-root"></div>
                            </div>
                            <div id="editor" class="pane-content"></div>
                        </div>
                        <div class="splitter horizontal" id="v-split"></div>
                        <div id="debugger-pane" class="pane">
                            <div class="pane-header">
                                <div class="pane-title-area">
                                    <div class="pane-toggle-group">
                                        <button class="pane-btn btn-min" title="Minimize" data-action="minimize"></button>
                                        <button class="pane-btn btn-restore" title="Restore" data-action="restore"></button>
                                        <button class="pane-btn btn-max" title="Maximize" data-action="maximize"></button>
                                    </div>
                                    <span>Debugger</span>
                                </div>
                                <div class="pane-controls" id="debugger-zoom-root"></div>
                            </div>
                            <div id="debugger-content" class="pane-content"></div>
                        </div>
                    </div>
                    <div class="splitter vertical" id="h-split"></div>
                    <div id="console-pane" class="pane">
                        <div class="pane-header">
                            <div class="pane-title-area">
                                <div class="pane-toggle-group">
                                    <button class="pane-btn btn-min" title="Minimize" data-action="minimize"></button>
                                    <button class="pane-btn btn-restore" title="Restore" data-action="restore"></button>
                                    <button class="pane-btn btn-max" title="Maximize" data-action="maximize"></button>
                                </div>
                                <span>Console / REPL</span>
                            </div>
                            <div class="pane-controls">
                                <div id="console-zoom-root"></div>
                                <button class="icon-btn" id="console-clear" title="Clear Console">⊘</button>
                            </div>
                        </div>
                        <div id="console-output" class="pane-content"></div>
                        <div class="console-input-container" style="padding: 5px; border-top: 1px solid var(--border-color);">
                            <span style="color: var(--accent-color);">{">"}</span>
                            <input type="text" id="repl-input" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
