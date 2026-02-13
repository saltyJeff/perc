import { perc_type } from "../vm/perc_types";
import { renderValue } from "../ui/perc_value_renderer";
import $ from "jquery";

export class Debugger {
    private element: JQuery<HTMLElement>;

    constructor(elementId: string) {
        this.element = $(`#${elementId}`);
        if (this.element.length === 0) throw new Error(`Debugger element ${elementId} not found`);
        this.render();
    }

    private render() {
        this.element.empty().append(
            $('<div>', { class: 'debug-section', id: 'current-expression' }).append(
                $('<h4>', { text: 'Current Expression' }),
                $('<div>', { class: 'expr-content', style: 'font-family: monospace; color: var(--accent-color);', text: 'nil' })
            ),
            $('<div>', { class: 'debug-section', id: 'variables' }).append(
                $('<h4>', { text: 'Variables' }),
                $('<div>', { class: 'vars-content', text: 'None' })
            ),
            $('<div>', { class: 'debug-section', id: 'call-stack' }).append(
                $('<h4>', { text: 'Call Stack' }),
                $('<div>', { class: 'stack-content', text: 'Empty' })
            )
        );
    }

    public updateCurrentExpression(val: perc_type | null) {
        const container = this.element.find('#current-expression .expr-content');
        container.empty();
        if (val) {
            container.append(renderValue(val));
            container.addClass('current-val-highlight');
        } else {
            container.text('nil');
            container.removeClass('current-val-highlight');
        }
    }

    public pushFrame(name: string, args: string[]) {
        const stackEl = this.element.find('#call-stack .stack-content');
        if (stackEl.length) {
            if (stackEl.text() === "Empty") stackEl.empty();

            const frameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const details = $('<details>', { id: frameId, open: true })
                .append($('<summary>', { text: `${name}(${args.join(', ')})` }))
                .append($('<table>', { class: 'debug-table' }).append($('<tbody>')));

            // Prepend new frame
            stackEl.prepend(details);
        }
    }

    public popFrame() {
        const stackEl = this.element.find('#call-stack .stack-content');
        stackEl.children().first().remove();
        if (stackEl.children().length === 0) stackEl.text("Empty");
    }

    public clearCallStack() {
        this.element.find('#call-stack .stack-content').text("Empty");
    }

    public updateVariable(name: string, value: perc_type) {
        // Find scope to update: top-most frame if exists, else Global (Variables pane)
        const stackEl = this.element.find('#call-stack .stack-content');

        // Update Global Variables pane always
        this.updateGlobalVariable(name, value);

        // Update current frame if active
        if (stackEl.children().length > 0 && stackEl.text() !== "Empty") {
            const frameDetails = stackEl.children().first();
            const tbody = frameDetails.find('tbody');
            if (tbody.length) {
                this.upsertTableRow(tbody, name, value);
            }
        }
    }

    private updateGlobalVariable(name: string, value: perc_type) {
        const varsEl = this.element.find('#variables .vars-content');
        if (varsEl.length) {
            if (varsEl.text() === "None" || !varsEl.find('table').length) {
                varsEl.empty().append($('<table>', { class: 'debug-table' }).append($('<tbody>')));
            }
            const tbody = varsEl.find('tbody');
            this.upsertTableRow(tbody, name, value);
        }
    }

    private upsertTableRow(tbody: JQuery<HTMLElement>, name: string, value: perc_type) {
        let found = false;
        const newValContent = renderValue(value);

        tbody.children('tr').each(function () {
            const row = $(this);
            if (row.find('.debug-key').text() === name) {
                row.find('.debug-value').empty().append(newValContent);
                found = true;
                return false; // break loop
            }
        });

        if (!found) {
            $('<tr>')
                .append($('<td>', { class: 'debug-key', text: name }))
                .append($('<td>', { class: 'debug-value' }).append(newValContent))
                .appendTo(tbody);
        }
    }

    public clearVariables() {
        this.element.find('#variables .vars-content').text("None");
    }

    public updateVariables(vars: Record<string, string>) {
        // This receives strings from VM.get_current_scope_values().
        // For partial compatibility until VM provides types, we render as strings.
        const varsEl = this.element.find('#variables .vars-content');
        if (varsEl.length) {
            if (Object.keys(vars).length === 0) {
                varsEl.text("None");
                return;
            }

            const tbody = $('<tbody>');
            for (const [k, v] of Object.entries(vars)) {
                $('<tr>')
                    .append($('<td>', { class: 'debug-key', text: k }))
                    .append($('<td>', { class: 'debug-value', text: v }))
                    .appendTo(tbody);
            }
            varsEl.empty().append($('<table>', { class: 'debug-table' }).append(tbody));
        }
    }

    public setStatus(status: string) {
        $('#vm-state .state-content').text(status);
    }
}
