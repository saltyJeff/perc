import { createSignal } from 'solid-js';
import { Switch, Match } from "solid-js";
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
        <div class={`${styles.menuBar} menu-bar`}>
            <div class={styles.logo}>PerC IDE</div>

            <div class={styles.menuActions}>
                <Switch>
                    <Match when={props.menuState === 'idle'}>
                        <button class={`${styles.menuBtn} ${styles.runBtn}`} onClick={props.onRun}><span>▶</span>Run</button>
                        <button class={styles.menuBtn} onClick={props.onBuild}>🔨 Build</button>
                    </Match>
                    <Match when={props.menuState === 'running'}>
                        <button class={`${styles.menuBtn} ${styles.stopBtn}`} onClick={props.onStop}>🛑 Stop</button>
                    </Match>
                    <Match when={props.menuState === 'debugging'}>
                        <button class={`${styles.menuBtn} ${styles.stopBtn}`} onClick={props.onStop}>🛑 Stop</button>
                        <button class={styles.menuBtn} onClick={props.onStep}>⏯ Step</button>
                        <button class={styles.menuBtn} onClick={props.onContinue}>⏩ Continue</button>
                    </Match>
                </Switch>
            </div>

            <div class={styles.menuSpacer}></div>

            <div class={styles.menuOptions}>
                <button class={styles.menuBtn} onClick={toggleTheme}>Theme: {theme() === 'light' ? "☀️" : "🌙"}</button>
                <button class={styles.menuBtn} onClick={toggleWrap}>Wrap: {wrap() === 'on' ? "On" : "Off"}</button>
            </div>
        </div>
    )
}
