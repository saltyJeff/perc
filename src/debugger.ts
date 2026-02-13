export class Debugger {
    private element: HTMLElement;

    constructor(elementId: string) {
        const el = document.getElementById(elementId);
        if (!el) throw new Error(`Debugger element ${elementId} not found`);
        this.element = el;
        this.render();
    }

    private render() {
        this.element.innerHTML = `
            <div class="debug-section" id="call-stack">
                <h4>Call Stack</h4>
                <div class="stack-content">Empty</div>
            </div>
            <div class="debug-section" id="variables">
                <h4>Variables</h4>
                <div class="vars-content">None</div>
            </div>
            <div class="debug-section" id="vm-state">
                <h4>VM State</h4>
                <div class="state-content">Idle</div>
            </div>
        `;
    }

    public updateCallStack(stack: string[]) {
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl) {
            stackEl.innerHTML = stack.map(s => `<div>${s}</div>`).join('') || "Empty";
        }
    }

    public updateVariables(vars: Record<string, any>) {
        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) {
            const items = Object.entries(vars).map(([k, v]) => `<div>${k}: ${v}</div>`).join('');
            varsEl.innerHTML = items || "None";
        }
    }

    public setStatus(status: string) {
        const stateEl = this.element.querySelector('#vm-state .state-content');
        if (stateEl) stateEl.textContent = status;
    }
}
