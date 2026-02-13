import $ from 'jquery';

export class Console {
    private element: JQuery<HTMLElement>;
    private inputElement: JQuery<HTMLElement>;
    private currentTextColor: string | null = null;
    private currentLogEntry: JQuery<HTMLElement> | null = null;

    constructor(outputId: string, inputId: string) {
        this.element = $(`#${outputId}`);
        this.inputElement = $(`#${inputId}`);
        if (this.element.length === 0) throw new Error(`Console output element ${outputId} not found`);
        if (this.inputElement.length === 0) throw new Error(`Console input element ${inputId} not found`);
    }

    private log(msg: string, type: 'log' | 'error' | 'status' | 'input') {
        const $entry = $('<div>').addClass('console-entry').addClass(type).text(msg);
        this.element.append($entry);
        this.element.scrollTop(this.element[0].scrollHeight);
    }

    public print(msg: string) {
        // Print without newline - append to current log entry or create new one
        if (!this.currentLogEntry) {
            this.currentLogEntry = $('<div>').addClass('console-entry').addClass('log');
            this.element.append(this.currentLogEntry);
        }

        const $span = $('<span>').text(msg);
        if (this.currentTextColor) {
            $span.css('color', this.currentTextColor);
        }
        this.currentLogEntry.append($span);
        this.element.scrollTop(this.element[0].scrollHeight);
    }

    public println(msg: string) {
        // Print with newline - append to current entry then finalize it
        this.print(msg);
        this.currentLogEntry = null; // Force new entry on next print
    }

    public setTextColor(color: string) {
        this.currentTextColor = color;
    }

    public resetTextColor() {
        this.currentTextColor = null;
    }

    public error(msg: string) {
        // Finalize any pending log entry before error
        this.currentLogEntry = null;
        this.log(msg, 'error');
    }

    public status(msg: string) {
        // Finalize any pending log entry before status
        this.currentLogEntry = null;
        this.log(msg, 'status');
    }

    public input(msg: string) {
        // Finalize any pending log entry before input
        this.currentLogEntry = null;
        this.log(msg, 'input');
    }

    public clear() {
        this.element.empty();
        this.currentLogEntry = null;
        this.currentTextColor = null;
    }

    public focusInput() {
        this.inputElement.focus();
    }
}
