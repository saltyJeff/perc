import { createStore } from "solid-js/store";
import { Console } from "../console";

export enum PaneState {
    MIN = "min",
    MAX = "max",
    RESTORE = "restore"
}

export enum ChildPaneState {
    DEBUGGER = "debugger",
    CONSOLE = "console",
    BOTH = "both"
}

export enum VMState {
    IDLE = "idle",
    RUNNING = "running",
    DEBUGGING = "debugging"
}

export enum PaneId {
    EDITOR = "editor",
    DEBUG = "debug",
    CONSOLE = "console"
}

export enum PaneAction {
    MIN = "min",
    MAX = "max",
    RESTORE = "restore"
}

export enum DividerId {
    EDITOR_DC = "editor_dc",
    DC = "dc"
}

function createAppStore() {
    const [layout, setLayout] = createStore({
        editor: PaneState.RESTORE,
        dc: {
            state: PaneState.RESTORE,
            child: ChildPaneState.BOTH
        },
        // hold the state of the divider positions as percentages (0-1)
        editorSplit: 0.5,
        dcSplit: 0.5,
    });

    const [vm, setVM] = createStore<{ state: VMState }>({
        state: VMState.IDLE,
    });

    return {
        layout,
        vm,
        setVM: (state: VMState) => setVM("state", state),

        paneAction: (pane: PaneId, action: PaneAction) => {
            // --- THE LAYOUT RULES (mirrored from demo.html) ---
            if (action === PaneAction.MAX) {
                if (pane === PaneId.EDITOR) {
                    setLayout({
                        editor: PaneState.MAX,
                        dc: { state: PaneState.MIN, child: layout.dc.child }
                    });
                } else if (pane === PaneId.DEBUG) {
                    setLayout({
                        editor: PaneState.MIN,
                        dc: { state: PaneState.MAX, child: ChildPaneState.DEBUGGER }
                    });
                } else if (pane === PaneId.CONSOLE) {
                    setLayout({
                        editor: PaneState.MIN,
                        dc: { state: PaneState.MAX, child: ChildPaneState.CONSOLE }
                    });
                }
            } else if (action === PaneAction.MIN) {
                if (pane === PaneId.EDITOR) {
                    setLayout({
                        editor: PaneState.MIN,
                        dc: { state: PaneState.MAX, child: layout.dc.child }
                    });
                } else if (pane === PaneId.DEBUG) {
                    setLayout({
                        editor: layout.editor === PaneState.MAX ? PaneState.MAX : PaneState.RESTORE,
                        dc: {
                            state: layout.editor === PaneState.MAX ? PaneState.MIN : PaneState.RESTORE,
                            child: ChildPaneState.CONSOLE
                        }
                    });
                } else if (pane === PaneId.CONSOLE) {
                    setLayout({
                        editor: layout.editor === PaneState.MAX ? PaneState.MAX : PaneState.RESTORE,
                        dc: {
                            state: layout.editor === PaneState.MAX ? PaneState.MIN : PaneState.RESTORE,
                            child: ChildPaneState.DEBUGGER
                        }
                    });
                }
            } else if (action === PaneAction.RESTORE) {
                if (pane === PaneId.EDITOR) {
                    setLayout({
                        editor: PaneState.RESTORE,
                        dc: { state: PaneState.RESTORE, child: layout.dc.child }
                    });
                } else {
                    // Restoring Debug or Console restores the internal split and the top level
                    setLayout({
                        editor: PaneState.RESTORE,
                        dc: { state: PaneState.RESTORE, child: ChildPaneState.BOTH }
                    });
                }
            }
        },

        updateSize: (divider: DividerId, ratio: number) => {
            if (divider === DividerId.EDITOR_DC) {
                setLayout("editorSplit", ratio);
                // If we are dragging, we should move to restore state to allow the size to take effect
                if (layout.editor !== PaneState.RESTORE || layout.dc.state !== PaneState.RESTORE) {
                    setLayout({ editor: PaneState.RESTORE, dc: { ...layout.dc, state: PaneState.RESTORE } });
                }
            } else {
                setLayout("dcSplit", ratio);
                // internal split restore
                if (layout.dc.child !== ChildPaneState.BOTH) {
                    setLayout("dc", "child", ChildPaneState.BOTH);
                }
            }
        }
    }
}

export const appStore = createAppStore();
