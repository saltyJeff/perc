// No imports needed for now as we use any/Window types

export interface GUICommand {
    type: string;
    args: any;
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

    pushCommand(type: string, args: any) {
        this.commandQueue.push({ type, args });
    }

    flushCommands() {
        if (this.subwindow && !this.subwindow.closed) {
            this.subwindow.postMessage({ type: 'render_batch', batch: this.commandQueue }, '*');
        }
        this.clearCommands();
    }

    getInput(id: string): any {
        return this.inputState[id];
    }

    isClicked(id: string): boolean {
        return !!this.inputState[id + '_clicked'];
    }
}
