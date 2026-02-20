import { createStore } from "solid-js/store";

export interface LogEntry {
    msg: string;
    type: 'log' | 'error' | 'status' | 'input';
    location?: [number, number];
    id: string;
    color?: string;
}

export interface ConsoleState {
    entries: LogEntry[];
    history: string[];
    historyIndex: number;
    tempInput: string;
    textColor: string;
}

function createConsoleStore() {
    const [state, setState] = createStore<ConsoleState>({
        entries: [],
        history: [],
        historyIndex: -1,
        tempInput: "",
        textColor: 'var(--fg-color)'
    });

    const actions = {
        addEntry: (msg: string, type: LogEntry['type'], location?: [number, number]) => {
            setState("entries", e => [...e, {
                msg,
                type,
                location,
                id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                color: type === 'log' ? state.textColor : undefined
            }]);
        },
        setTextColor: (color: string) => {
            setState("textColor", color);
        },
        clear: () => {
            setState("entries", []);
        },
        pushHistory: (cmd: string) => {
            if (!cmd.trim()) return;
            setState(s => {
                const newHistory = [...s.history];
                if (newHistory.length > 0 && newHistory[newHistory.length - 1] === cmd) {
                    return { historyIndex: newHistory.length, tempInput: "" };
                }
                newHistory.push(cmd);
                if (newHistory.length > 20) newHistory.shift();
                return { history: newHistory, historyIndex: newHistory.length, tempInput: "" };
            });
        },
        navigateHistory: (direction: 'up' | 'down', currentInput: string): string | null => {
            let result: string | null = null;
            setState(s => {
                let idx = s.historyIndex;
                let temp = s.tempInput;

                if (idx === s.history.length) {
                    temp = currentInput;
                }

                if (direction === 'up') {
                    if (idx > 0) {
                        idx--;
                        result = s.history[idx];
                    }
                } else {
                    if (idx < s.history.length) {
                        idx++;
                        if (idx === s.history.length) {
                            result = temp;
                        } else {
                            result = s.history[idx];
                        }
                    }
                }
                return { historyIndex: idx, tempInput: temp };
            });
            return result;
        },
        reset: () => {
            setState({
                entries: [],
                history: [],
                historyIndex: -1,
                tempInput: "",
                textColor: 'var(--fg-color)'
            });
        }
    };

    return { state, actions };
}

export const consoleStore = createConsoleStore();
export type ConsoleStore = typeof consoleStore;
