import { createSignal } from 'solid-js';
import { Switch, Match } from "solid-js";
import { appStore } from './AppStore';
import styles from './MenuBar.module.css';

interface MenuBarProps {
    menuState: 'idle' | 'running' | 'debugging';
    onRun: () => void;
    onBuild: () => void;
    onStep: () => void;
    onContinue: () => void;
    onStop: () => void;
    onTheme: (theme: 'light' | 'dark') => void;
    onWrap: (wrap: 'on' | 'off') => void;
}

export const MenuBar = (props: MenuBarProps) => {
    const [theme, setTheme] = createSignal<'light' | 'dark'>('dark');
    function toggleTheme() {
        const newTheme = theme() === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        props.onTheme(newTheme);
    }
    const [wrap, setWrap] = createSignal<'on' | 'off'>('on');
    function toggleWrap() {
        const newWrap = wrap() === 'on' ? 'off' : 'on';
        setWrap(newWrap);
        props.onWrap(newWrap);
    }
    return (
        <header class={`${styles.menuBar} menu-bar`}>
            <nav class={styles.menuBar} aria-label="Main Toolbar">
                <div class={styles.logo} aria-hidden="true">PerC IDE</div>

                <div class={styles.menuActions}>
                    <Switch>
                        <Match when={props.menuState === 'idle'}>
                            <button class={`${styles.menuBtn} ${styles.runBtn}`} onClick={props.onRun} aria-label="Run Code">
                                <span aria-hidden="true">▶</span> Run
                            </button>
                            <button class={styles.menuBtn} onClick={props.onBuild} aria-label="Build Project">
                                <span aria-hidden="true">🔨</span> Build
                            </button>
                        </Match>
                        <Match when={props.menuState === 'running'}>
                            <button class={`${styles.menuBtn} ${styles.stopBtn}`} onClick={props.onStop} aria-label="Stop Execution">
                                <span aria-hidden="true">🛑</span> Stop
                            </button>
                        </Match>
                        <Match when={props.menuState === 'debugging'}>
                            <button class={`${styles.menuBtn} ${styles.stopBtn}`} onClick={props.onStop} aria-label="Stop Debugging">
                                <span aria-hidden="true">🛑</span> Stop
                            </button>
                            <button class={styles.menuBtn} onClick={props.onStep} aria-label="Step Into">
                                <span aria-hidden="true">⏯</span> Step
                            </button>
                            <button class={styles.menuBtn} onClick={props.onContinue} aria-label="Continue Execution">
                                <span aria-hidden="true">⏩</span> Continue
                            </button>
                        </Match>
                    </Switch>
                </div>

                <div class={styles.menuSpacer}></div>

                <div class={styles.menuOptions}>
                    <button class={styles.menuBtn} onClick={() => appStore.resetLayout()}>Restore Layout</button>
                    <button class={styles.menuBtn} onClick={toggleTheme} aria-label={`Switch to ${theme() === 'light' ? 'dark' : 'light'} theme`}>
                        Theme: <span aria-hidden="true">{theme() === 'light' ? "☀️" : "🌙"}</span>
                    </button>
                    <button class={styles.menuBtn} onClick={toggleWrap} aria-label={`Turn word wrap ${wrap() === 'on' ? 'off' : 'on'}`}>
                        Wrap: {wrap() === 'on' ? "On" : "Off"}
                    </button>
                </div>
            </nav>
        </header>
    )
}
