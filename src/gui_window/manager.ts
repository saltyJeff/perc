// No imports needed for now as we use any/Window types

export interface GUICommand {
    type: string;
    args: any;
    zIndex: number;
}

export class GUIManager {
    private subwindow: Window | null = null;
    private commandQueue: GUICommand[] = [];
    private inputState: Record<string, any> = {};
    private hasShownPopupWarning: boolean = false;

    constructor() {
        window.addEventListener('message', (event) => {
            if (event.source !== this.subwindow) return;
            if (event.data && event.data.type === 'input_update') {
                this.inputState = event.data.state;
            }
        });

        // Cleanup: close GUI window when main window closes/refreshes
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    openWindow() {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.focus();
            return;
        }

        // We'll point this to a route or a blank page that we then inject content into
        // For Vite development, we'll create a gui.html
        this.subwindow = window.open('gui.html', 'PerC_GUI', 'width=800,height=600');

        if (!this.subwindow && !this.hasShownPopupWarning) {
            alert("Please allow popups to use the GUI system.");
            this.hasShownPopupWarning = true;
        }
    }

    clearCommands() {
        this.commandQueue = [];
    }

    pushCommand(type: string, args: any, zIndex: number = 0) {
        this.commandQueue.push({ type, args, zIndex });
    }

    flushCommands() {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.postMessage({
                type: 'render_batch',
                batch: this.commandQueue,
                state: this.inputState // Authoritative state sync
            }, '*');
        }
        this.clearCommands();
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
        return !!this.inputState[id + '_clicked'];
    }

    cleanup() {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.close();
            this.subwindow = null;
        }
    }
}
