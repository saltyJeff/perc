import { perc_type } from "../vm/perc_types";
import { renderValue } from "../ui/perc_value_renderer";
import $ from "jquery";

export class Debugger {
    private element: JQuery<HTMLElement>;
    public onVariableHover?: (range: [number, number] | null) => void;

    // Widths in percentages
    private colWidths3: number[] = [33.33, 33.34, 33.33];
    private colWidths2: number[] = [50, 50];

    private isResizing = false;
    private resizeStartIndex = -1;
    private resizeStartWidths: number[] = [];
    private resizeStartX = 0;
    private resizeTable: JQuery<HTMLElement> | null = null;

    constructor(elementId: string) {
        this.element = $(`#${elementId}`);
        if (this.element.length === 0) throw new Error(`Debugger element ${elementId} not found`);
        this.render();
        this.setupResizing();
    }

    private render() {
        this.element.empty().append(
            $('<div>', { class: 'debug-section', id: 'current-expression' }).append(
                $('<h4>', { text: 'Current Expression' }),
                $('<div>', { class: 'expr-content' }).append(
                    this.createDebugTable(['Value', 'Type'])
                )
            ),
            // Variables pane removed - using Call Stack frames instead
            $('<div>', { class: 'debug-section', id: 'call-stack' }).append(
                $('<h4>', { text: 'Call Stack' }),
                $('<div>', { class: 'stack-content', text: 'Empty' })
            )
        );
    }

    private createDebugTable(headers: string[]): JQuery<HTMLElement> {
        const $table = $('<table>', { class: 'debug-table' });
        // Store headers as an attribute to identify column count/widths
        $table.attr('data-cols', headers.length);

        const $colgroup = $('<colgroup>');
        const widths = headers.length === 3 ? this.colWidths3 : this.colWidths2;

        widths.forEach(w => {
            $colgroup.append($('<col>', { style: `width: ${w}%` }));
        });

        $table.append($colgroup);

        const $thead = $('<thead>', { class: 'sr-only' });
        const $headerRow = $('<tr>');
        headers.forEach(h => {
            $headerRow.append($('<th>', { text: h, scope: 'col' }));
        });
        $thead.append($headerRow);
        $table.append($thead);

        $table.append($('<tbody>'));
        return $table;
    }

    private setupResizing() {
        $(document).on('mousedown', '.col-resizer', (e) => {
            e.preventDefault();
            this.isResizing = true;
            this.resizeStartX = e.pageX;
            const $resizer = $(e.currentTarget);
            const $td = $resizer.closest('td');
            this.resizeStartIndex = $td.index();
            this.resizeTable = $resizer.closest('table');

            const colCount = parseInt(this.resizeTable.attr('data-cols') || '0');
            this.resizeStartWidths = [...(colCount === 3 ? this.colWidths3 : this.colWidths2)];

            $resizer.addClass('resizing');
            $('body').css('cursor', 'col-resize');
        });

        $(document).on('mousemove', (e) => {
            if (!this.isResizing || !this.resizeTable) return;

            const diffX = e.pageX - this.resizeStartX;
            const tableWidth = this.resizeTable.width() || 1;
            const diffPercent = (diffX / tableWidth) * 100;

            const colCount = parseInt(this.resizeTable.attr('data-cols') || '0');
            const widths = colCount === 3 ? this.colWidths3 : this.colWidths2;

            // Adjust current column and next column
            const idx = this.resizeStartIndex;
            if (idx >= 0 && idx < widths.length - 1) {
                const newLeftWidth = Math.max(10, this.resizeStartWidths[idx] + diffPercent);
                const newRightWidth = Math.max(10, (this.resizeStartWidths[idx] + this.resizeStartWidths[idx + 1]) - newLeftWidth);

                // If we can't shrink the right one anymore, cap the left one
                if (newRightWidth <= 10) {
                    // Stay at 10 for right, adjust left to take the rest of the sum
                    // But for simplicity let's just apply if both > 10
                } else {
                    widths[idx] = newLeftWidth;
                    widths[idx + 1] = newRightWidth;

                    // Update all tables with the same column count
                    this.updateAllTableWidths(colCount);
                }
            }
        });

        $(document).on('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                $('.col-resizer').removeClass('resizing');
                $('body').css('cursor', '');
            }
        });
    }

    private updateAllTableWidths(colCount: number) {
        const widths = colCount === 3 ? this.colWidths3 : this.colWidths2;
        $(`.debug-table[data-cols="${colCount}"] colgroup`).each(function () {
            const $colgroup = $(this);
            $colgroup.find('col').each((i, col) => {
                if (i < widths.length) {
                    $(col).css('width', `${widths[i]}%`);
                }
            });
        });
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

            const cellsInRow = cells.length;

            // Assign columns classes based on index and column count
            // 2 cols: Value, Type
            // 3 cols: Name, Value, Type
            if (cellsInRow === 2) {
                if (i === 0) $td.addClass('col-value');
                else if (i === 1) $td.addClass('col-type');
            } else {
                if (i === 0) $td.addClass('col-name');
                else if (i === 1) $td.addClass('col-value');
                else if (i === 2) $td.addClass('col-type');
            }

            // Add resizer if not the last column
            if (i < cellsInRow - 1) {
                $td.append($('<div>', {
                    class: 'col-resizer',
                    role: 'separator',
                    'aria-label': 'Column resizer',
                    tabindex: '0'
                }));
            }

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
            const displayName = name === 'global' ? name : `${name}(${args.join(', ')})`;
            const details = $('<details>', { id: frameId, open: true })
                .append($('<summary>', { text: displayName }))
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
        this.addVariableToTopFrame(name, value, range);
    }

    public addVariableToTopFrame(name: string, value: perc_type, range: [number, number] | null) {
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

        // Iterate rows to find match by Name
        tbody.children('tr').each(function () {
            const row = $(this);
            // 1st td is Name
            if (row.find('td:first').text() === name) {
                // Update Name Cell
                const nameTd = row.find('td:first');
                nameTd.empty().append($nameSpan);
                if (range) nameTd.addClass('has-link'); // Helper class if needed

                // Update Value (2nd td)
                row.find('td:eq(1)').empty().append(newValContent);
                // Update Type (3rd td)
                row.find('td:eq(2)').text(newTypeContent);
                found = true;
                return false; // break loop
            }
        });

        if (!found) {
            const $row = this.createRow([$nameSpan, newValContent, newTypeContent]);
            tbody.append($row);
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

    // Renamed/Repurposed to update top frame variables in bulk
    public updateTopFrameVariables(vars: Record<string, { value: perc_type, range: [number, number] | null }>) {
        if (Object.keys(vars).length === 0) return;

        const stackEl = this.element.find('#call-stack .stack-content');
        if (stackEl.children().length > 0 && stackEl.text() !== "Empty") {
            const frameDetails = stackEl.children().first();
            const tbody = frameDetails.find('tbody');
            if (tbody.length) {
                for (const [k, data] of Object.entries(vars)) {
                    this.upsertTableRow(tbody, k, data.value, data.range);
                }
            }
        }
    }

    public setStatus(status: string) {
        $('#vm-state .state-content').text(status);
    }
}
