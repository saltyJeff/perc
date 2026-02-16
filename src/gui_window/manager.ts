import type { Group } from "./gui_cmds";

export class GUIManager {
    private subwindow: Window | null = null;
    private inputState: Record<string, any> = {};
    private hasShownPopupWarning: boolean = false;

    private clickBuffer: Set<string> = new Set();

    private hasOpenedIntentional: boolean = false;

    constructor() {
        window.addEventListener('message', (event) => {
            if (event.source !== this.subwindow) return;
            if (event.data && event.data.type === 'input_update') {
                this.inputState = event.data.state;
            } else if (event.data && event.data.type === 'gui_event') {
                this.clickBuffer.add(event.data.id);
            }
        });

        // Cleanup: close GUI window when main window closes/refreshes
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    openWindow(width: number = 640, height: number = 480): boolean {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.focus();
            this.subwindow.postMessage({ type: 'resize_window', width, height }, '*');
            return true;
        }

        // If it was already opened and is now closed, don't reopen it automatically
        if (this.hasOpenedIntentional) {
            return false;
        }

        this.subwindow = window.open('gui.html', 'PerC_GUI', `width=${width},height=${height}`);

        if (this.subwindow) {
            this.hasOpenedIntentional = true;
        } else if (!this.hasShownPopupWarning) {
            alert("Please allow popups to use the GUI system.");
            this.hasShownPopupWarning = true;
        }

        // Send initial resize just in case window.open settings aren't perfectly respected or for runtime setup
        setTimeout(() => {
            if (this.subwindow && !this.subwindow.closed) {
                this.subwindow.postMessage({ type: 'resize_window', width, height }, '*');
            }
        }, 500);

        return !!this.subwindow;
    }

    resetIntentional() {
        this.hasOpenedIntentional = false;
        this.clickBuffer.clear();
    }

    private lastUpdate = 0;
    private pendingUpdate: Group | null = null;
    private updateTimer: any = null;

    sendWindowUpdate(group: Group) {
        if (!this.subwindow || this.subwindow.closed) return;

        const now = Date.now();
        const timeSinceLast = now - this.lastUpdate;
        const TARGET_FPS = 60;
        const INTERVAL = 1000 / TARGET_FPS;

        if (timeSinceLast >= INTERVAL) {
            this.subwindow.postMessage({ type: 'render_batch', batch: group }, '*');
            this.lastUpdate = now;
            this.pendingUpdate = null;
        } else {
            this.pendingUpdate = group;
            if (!this.updateTimer) {
                this.updateTimer = setTimeout(() => {
                    if (this.pendingUpdate) {
                        this.subwindow?.postMessage({ type: 'render_batch', batch: this.pendingUpdate }, '*');
                        this.lastUpdate = Date.now();
                        this.pendingUpdate = null;
                    }
                    this.updateTimer = null;
                }, INTERVAL - timeSinceLast);
            }
        }
    }

    getInput(id: string): any {
        return this.inputState[id];
    }

    setInput(id: string, val: any) {
        this.inputState[id] = val;
    }

    getAllInputs(): Record<string, any> {
        return this.inputState;
    }

    isClicked(id: string): boolean {
        if (this.clickBuffer.has(id)) {
            this.clickBuffer.delete(id);
            return true;
        }
        return !!this.inputState[id + '_clicked'];
    }

    cleanup() {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.close();
            this.subwindow = null;
        }
    }
}
