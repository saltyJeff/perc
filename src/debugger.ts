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
            <div class="debug-section" id="current-expression">
                <h4>Current Expression</h4>
                <div class="expr-content" style="font-family: monospace; color: var(--accent-color);">nil</div>
            </div>
            <div class="debug-section" id="variables">
                <h4>Variables</h4>
                <div class="vars-content">None</div>
            </div>
            <div class="debug-section" id="call-stack">
                <h4>Call Stack</h4>
                <div class="stack-content">Empty</div>
            </div>
        `;
    }

    public updateCurrentExpression(val: string) {
        const exprEl = this.element.querySelector('#current-expression .expr-content');
        if (exprEl) exprEl.textContent = val;
    }

    public pushFrame(name: string) {
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl) {
            // If empty text node is present, clear it
            if (stackEl.innerHTML === "Empty") stackEl.innerHTML = "";
            const div = document.createElement('div');
            div.textContent = name;
            // Prepend because stack is traditionally top-down
            stackEl.insertBefore(div, stackEl.firstChild);
        }
    }

    public popFrame() {
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl && stackEl.firstChild) {
            stackEl.removeChild(stackEl.firstChild);
            if (!stackEl.hasChildNodes()) stackEl.innerHTML = "Empty";
        }
    }

    public clearCallStack() {
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl) stackEl.innerHTML = "Empty";
    }

    public updateCallStack(stack: string[]) {
        // Fallback for full update if needed
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl) {
            stackEl.innerHTML = stack.map(s => `<div>${s}</div>`).join('') || "Empty";
        }
    }

    public updateVariable(name: string, value: string) {
        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) {
            if (varsEl.innerHTML === "None") varsEl.innerHTML = "";

            // Check if variable exists to update, else append
            // This simplest "append" logic works for 'init'. For 'change', we might need to find it.
            // But since 'on_var_update' in VM is generic, we'll implement a simple lookup.
            let found = false;
            for (let i = 0; i < varsEl.children.length; i++) {
                const child = varsEl.children[i];
                if (child.textContent?.startsWith(name + ":")) {
                    child.textContent = `${name}: ${value}`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const div = document.createElement('div');
                div.textContent = `${name}: ${value}`;
                varsEl.appendChild(div);
            }
        }
    }

    public clearVariables() {
        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) varsEl.innerHTML = "None";
    }

    public updateVariables(vars: Record<string, any>) {
        // Full refresh fallback
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
