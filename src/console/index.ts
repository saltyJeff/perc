import $ from 'jquery';

export class Console {
    private element: JQuery<HTMLElement>;
    private inputElement: JQuery<HTMLElement>;

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
        this.log(msg, 'log');
    }

    public error(msg: string) {
        this.log(msg, 'error');
    }

    public status(msg: string) {
        this.log(msg, 'status');
    }

    public input(msg: string) {
        this.log(msg, 'input');
    }

    public clear() {
        this.element.empty();
    }

    public focusInput() {
        this.inputElement.focus();
    }
}
