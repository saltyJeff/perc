import { perc_type } from "../vm/perc_types";
import { renderValue } from "../ui/perc_value_renderer";
import $ from "jquery";

export class Debugger {
    private element: JQuery<HTMLElement>;
    public onVariableHover?: (range: [number, number] | null) => void;

    constructor(elementId: string) {
        this.element = $(`#${elementId}`);
        if (this.element.length === 0) throw new Error(`Debugger element ${elementId} not found`);
        this.render();
    }

    private render() {
        this.element.empty().append(
            $('<div>', { class: 'debug-section', id: 'current-expression' }).append(
                $('<h4>', { text: 'Current Expression' }),
                $('<div>', { class: 'expr-content' }).append(
                    this.createDebugTable(['Value', 'Type'])
                )
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

    private createDebugTable(headers: string[]): JQuery<HTMLElement> {
        const $table = $('<table>', { class: 'debug-table' });

        // PER REQUEST: No headers emitted to DOM
        // Fix column widths using colgroup since headers are gone
        const $colgroup = $('<colgroup>');
        if (headers.length === 3) {
            // Variables / Stack: Name, Value, Type
            $colgroup.append($('<col>', { style: 'width: 30%' }));
            $colgroup.append($('<col>', { style: 'width: 50%' }));
            $colgroup.append($('<col>', { style: 'width: 20%' }));
        } else {
            // Current Expression: Value, Type
            $colgroup.append($('<col>', { style: 'width: 70%' }));
            $colgroup.append($('<col>', { style: 'width: 30%' }));
        }
        $table.append($colgroup);

        $table.append($('<tbody>'));
        return $table;
    }

    private createRow(cells: (string | JQuery<HTMLElement>)[]): JQuery<HTMLElement> {
        const $tr = $('<tr>');
        cells.forEach((content, i) => {
            let $td: JQuery<HTMLElement>;

            // If content is already a TD (from renderer), use it directly
            if (typeof content !== 'string' && content.is('td')) {
                $td = content;
            } else {
                $td = $('<td>');
                if (typeof content === 'string') $td.text(content);
                else $td.append(content);
            }

            // Add a class for centering text as requested
            $td.css('text-align', 'center');
            $tr.append($td);
        });
        return $tr;
    }

    public updateCurrentExpression(val: perc_type | null) {
        const $tbody = this.element.find('#current-expression table tbody');
        $tbody.empty();

        if (val) {
            $tbody.append(this.createRow([
                renderValue(val),
                val.type
            ]));
        } else {
            $tbody.append(this.createRow(['nil', '-']));
        }
    }

    public pushFrame(name: string, args: string[]) {
        const stackEl = this.element.find('#call-stack .stack-content');
        if (stackEl.length) {
            if (stackEl.text() === "Empty") stackEl.empty();

            const frameId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create details with summary
            const details = $('<details>', { id: frameId, open: true })
                .append($('<summary>', { text: `${name}(${args.join(', ')})` }))
                .append(this.createDebugTable(['Name', 'Value', 'Type'])); // 3 cols

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

    public updateVariable(name: string, value: perc_type, range: [number, number] | null) {
        // Update Global Variables pane always
        this.updateGlobalVariable(name, value, range);

        // Update current frame if active
        // Find top-most frame details
        const stackEl = this.element.find('#call-stack .stack-content');
        if (stackEl.children().length > 0 && stackEl.text() !== "Empty") {
            const frameDetails = stackEl.children().first();
            const tbody = frameDetails.find('tbody');
            if (tbody.length) {
                this.upsertTableRow(tbody, name, value, range);
            }
        }
    }

    private updateGlobalVariable(name: string, value: perc_type, range: [number, number] | null) {
        const varsEl = this.element.find('#variables .vars-content');
        if (varsEl.length) {
            if (varsEl.text() === "None" || !varsEl.find('table').length) {
                varsEl.empty().append(this.createDebugTable(['Name', 'Value', 'Type']));
            }
            const tbody = varsEl.find('tbody');
            this.upsertTableRow(tbody, name, value, range);
        }
    }

    private upsertTableRow(tbody: JQuery<HTMLElement>, name: string, value: perc_type, range: [number, number] | null) {
        let found = false;
        const newValContent = renderValue(value);
        const newTypeContent = value.type;

        // Create interactive name element
        const $nameSpan = $('<span>', { class: 'debug-var-name', text: name });
        if (range) {
            $nameSpan.on('mouseenter touchstart', (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                this.onVariableHover?.(range);
            });
            $nameSpan.on('mouseleave touchend', () => {
                this.onVariableHover?.(null);
            });
        }

        // Iterate rows to find match by Name (1st column text)
        tbody.children('tr').each(function () {
            const row = $(this);
            // 1st td is Name
            if (row.find('td:first').text() === name) {
                // Update Name Cell (to refresh interactivity/range)
                row.find('td:first').empty().append($nameSpan);
                // Update Value (2nd td)
                row.find('td:eq(1)').empty().append(newValContent);
                // Update Type (3rd td)
                row.find('td:eq(2)').text(newTypeContent);
                found = true;
                return false; // break loop
            }
        });

        if (!found) {
            tbody.append(this.createRow([$nameSpan, newValContent, newTypeContent]));
        }
    }

    public clearVariables() {
        this.element.find('#variables .vars-content').text("None");
    }

    public updateVariables(vars: Record<string, { value: perc_type, range: [number, number] | null }>) {
        const varsEl = this.element.find('#variables .vars-content');
        if (varsEl.length) {
            if (Object.keys(vars).length === 0) {
                varsEl.text("None");
                return;
            }

            // Always recreate table for full update (simplest consistency)
            const $table = this.createDebugTable(['Name', 'Value', 'Type']);
            const $tbody = $table.find('tbody');

            for (const [k, data] of Object.entries(vars)) {

                // Create interactive name
                const $nameSpan = $('<span>', { class: 'debug-var-name', text: k });
                if (data.range) {
                    $nameSpan.on('mouseenter touchstart', (e) => {
                        if (e.type === 'touchstart') e.preventDefault();
                        this.onVariableHover?.(data.range);
                    });
                    $nameSpan.on('mouseleave touchend', () => {
                        this.onVariableHover?.(null);
                    });
                }

                $tbody.append(this.createRow([
                    $nameSpan,
                    renderValue(data.value),
                    data.value.type
                ]));
            }
            varsEl.empty().append($table);
        }
    }

    public setStatus(status: string) {
        $('#vm-state .state-content').text(status);
    }
}
