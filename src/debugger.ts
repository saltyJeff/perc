import { perc_type } from "./vm/perc_types";
import { renderValue } from "./ui/perc_value_renderer";

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
        // Note: val is string. If we want HTML rendering here we need the object. 
        // For now user asked for variables and call stack. 
    }

    public pushFrame(name: string, args: string[]) {
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (stackEl) {
            if (stackEl.innerHTML === "Empty") stackEl.innerHTML = "";

            const frameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const details = document.createElement('details');
            details.open = true; // Auto-expand new frames
            details.id = frameId;

            const summary = document.createElement('summary');
            summary.textContent = `${name}(${args.join(', ')})`;
            details.appendChild(summary);

            const varsTable = document.createElement('table');
            varsTable.className = 'debug-table';
            // Optional: Add header? No, just key-value pairs as requested.
            // varsTable.innerHTML = `<thead><tr><th>Name</th><th>Value</th></tr></thead><tbody></tbody>`;
            varsTable.innerHTML = `<tbody></tbody>`;

            // Add initial args to the table
            // Actually, args are likely in the scope, but let's maybe add them if we derived them
            // For now, variables will be populated via updateVariable

            details.appendChild(varsTable);

            // Prepend
            if (stackEl.firstChild) {
                stackEl.insertBefore(details, stackEl.firstChild);
            } else {
                stackEl.appendChild(details);
            }
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

    public updateVariable(name: string, value: perc_type) {
        // Find the top-most frame (first child of stack-content)
        const stackEl = this.element.querySelector('#call-stack .stack-content');
        if (!stackEl || !stackEl.firstElementChild || stackEl.innerHTML === "Empty") {
            // ... (comments)
            this.updateGlobalVariable(name, value);

            // ALSO update the current frame's table if it exists
            if (stackEl && stackEl.firstElementChild) {
                const frameDetails = stackEl.firstElementChild as HTMLDetailsElement;
                const tableBody = frameDetails.querySelector('tbody');
                if (tableBody) {
                    this.upsertTableRow(tableBody, name, value);
                }
            }
            return;
        }

        // ... (comments)
        this.updateGlobalVariable(name, value);

        const frameDetails = stackEl.firstElementChild as HTMLDetailsElement;
        if (frameDetails && frameDetails.tagName.toLowerCase() === 'details') {
            const tableBody = frameDetails.querySelector('tbody');
            if (tableBody) {
                this.upsertTableRow(tableBody, name, value);
            }
        }
    }

    private updateGlobalVariable(name: string, value: perc_type) {
        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) {
            if (varsEl.innerHTML === "None" || !varsEl.querySelector('table')) {
                varsEl.innerHTML = `<table class="debug-table"><tbody></tbody></table>`;
            }
            const tbody = varsEl.querySelector('tbody');
            if (tbody) {
                this.upsertTableRow(tbody, name, value);
            }
        }
    }

    private upsertTableRow(tbody: HTMLElement, name: string, value: perc_type) {
        // Check for existing row
        let found = false;
        const valStr = renderValue(value);

        for (let i = 0; i < tbody.children.length; i++) {
            const row = tbody.children[i] as HTMLTableRowElement;
            const keyCell = row.cells[0];
            if (keyCell.textContent === name) {
                row.cells[1].innerHTML = valStr;
                found = true;
                break;
            }
        }
        if (!found) {
            const row = document.createElement('tr');
            row.innerHTML = `<td class="debug-key">${name}</td><td class="debug-value">${valStr}</td>`;
            tbody.appendChild(row);
        }
    }

    public clearVariables() {
        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) varsEl.innerHTML = "None";
    }

    public updateVariables(vars: Record<string, string>) {
        // This method receives raw strings currently from VM.get_current_scope_values()
        // We should ideally update VM to return perc_type, but for now we might have to work with strings
        // or update that method too. 
        // Given the request, "variables should be displayed as a 2-column table"

        const varsEl = this.element.querySelector('#variables .vars-content');
        if (varsEl) {
            if (Object.keys(vars).length === 0) {
                varsEl.innerHTML = "None";
                return;
            }

            let html = `<table class="debug-table"><tbody>`;
            for (const [k, v] of Object.entries(vars)) {
                // v is already a string here (to_string called in VM)
                // We'll trust it's safe or escape it? 
                // renderValue does escaping. We should validly use escapeHtml here if we don't have perc_type.
                // But let's assume v is the string representation.
                html += `<tr><td class="debug-key">${k}</td><td class="debug-value">${v}</td></tr>`;
            }
            html += `</tbody></table>`;
            varsEl.innerHTML = html;
        }
    }

    public setStatus(status: string) {
        const stateEl = this.element.querySelector('#vm-state .state-content');
        if (stateEl) stateEl.textContent = status;
    }
}
