import { createSignal } from 'solid-js';
import { Switch, Match } from "solid-js"

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
        <div class="menu-bar">
            <div class="logo">PerC IDE</div>
            <div class="menu-actions">
                <Switch>
                    <Match when={props.menuState == 'idle'}>
                        <button class="menu-btn run-btn" onClick={props.onRun}><span>▶</span>Run</button>
                        <button class="menu-btn" onClick={props.onBuild}>🔨 Build</button>
                    </Match>
                    <Match when={props.menuState == 'running' || props.menuState == 'debugging'}>
                        <button class="menu-btn stop-btn" onClick={props.onStop}>🛑 Stop</button>
                    </Match>
                    <Match when={props.menuState == 'debugging'}>
                        <button class="menu-btn" onClick={props.onStep}>⏯ Step</button>
                        <button class="menu-btn" onClick={props.onContinue}>⏩ Continue</button>
                    </Match>
                </Switch>
            </div>
            <div class="menu-spacer"></div>
            <div class="menu-options">
                <button class="menu-btn" onClick={toggleTheme}>Theme: {theme() == 'light' ? "☀️" : "🌙"}</button>
                <button class="menu-btn" onClick={toggleWrap}>Wrap: {wrap() == 'on' ? "On" : "Off"}</button>
            </div>
        </div>
    )
}