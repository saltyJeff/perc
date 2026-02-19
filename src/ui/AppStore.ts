import { createStore } from "solid-js/store";

export type PaneId = 'editor' | 'debugger' | 'console';
export type DividerId = 'editor_dc' | 'dc';
export type VMState = 'idle' | 'running' | 'debugging' | 'input';

export interface AppStore {
    layout: {
        // editorSplit is the fraction of width given to Editor.
        // Range [0, 1]. 
        // 0 means Editor is 32px bar. 1 means DC is 32px bar.
        editorSplit: number;
        // dcSplit is the fraction of height given to Debugger within the DC container.
        // 0 means Debugger is 32px bar. 1 means Console is 32px bar.
        dcSplit: number;
    };
    vm: {
        state: VMState;
    };
}

function createAppStore() {
    const [store, setStore] = createStore<AppStore>({
        layout: {
            editorSplit: 0.5,
            dcSplit: 0.5,
        },
        vm: {
            state: 'idle'
        }
    });

    const actions = {
        get layout() { return store.layout; },
        get vm() { return store.vm; },

        updateSize: (divider: DividerId, ratio: number) => {
            if (divider === 'editor_dc') {
                setStore('layout', 'editorSplit', ratio);
            } else if (divider === 'dc') {
                setStore('layout', 'dcSplit', ratio);
            }
        },

        setVM: (state: VMState) => {
            setStore('vm', 'state', state);
        },

        resetLayout: () => {
            setStore('layout', 'editorSplit', 0.5);
            setStore('layout', 'dcSplit', 0.5);
        }
    };

    return actions;
}

export const appStore = createAppStore();
