import $ from 'jquery';

export class Console {
    private element: JQuery<HTMLElement>;
    private inputElement: JQuery<HTMLElement>;
    private currentTextColor: string | null = null;
    private currentLogEntry: JQuery<HTMLElement> | null = null;
    public onErrorClick: ((loc: any) => void) | null = null;

    constructor(outputId: string, inputId: string) {
        this.element = $(`#${outputId}`);
        this.inputElement = $(`#${inputId}`);
        if (this.element.length === 0) throw new Error(`Console output element ${outputId} not found`);
        if (this.inputElement.length === 0) throw new Error(`Console input element ${inputId} not found`);

        this.element.on('click', '.console-error-link', (e) => {
            const data = $(e.currentTarget).data('loc');
            if (data && this.onErrorClick) {
                this.onErrorClick(data);
            }
        });
    }

    private log(msg: string, type: 'log' | 'error' | 'status' | 'input', location?: any) {
        const $entry = $('<div>').addClass('console-entry').addClass(type).text(msg);
        if (type === 'error' && location) {
            $entry.addClass('console-error-link');
            $entry.attr('title', 'Click to show error location');
            $entry.data('loc', location);
            $entry.css('cursor', 'pointer');
        }
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

    public error(msg: string, location?: any) {
        // Finalize any pending log entry before error
        this.currentLogEntry = null;
        this.log(msg, 'error', location);
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

    // History Logic
    private history: string[] = [];
    private historyIndex: number = 0;
    private tempInput: string = "";

    public pushHistory(cmd: string) {
        if (!cmd.trim()) return;

        // Remove duplicates if same as last
        if (this.history.length > 0 && this.history[this.history.length - 1] === cmd) {
            this.historyIndex = this.history.length;
            this.tempInput = "";
            return;
        }

        this.history.push(cmd);
        if (this.history.length > 20) {
            this.history.shift();
        }
        this.historyIndex = this.history.length;
        this.tempInput = "";
    }

    public navigateHistory(direction: 'up' | 'down', currentInput: string): string | null {
        if (this.history.length === 0) return null;

        // If we are at the end (new input), save current input
        if (this.historyIndex === this.history.length) {
            this.tempInput = currentInput;
        }

        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                return this.history[this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex < this.history.length) {
                this.historyIndex++;
                if (this.historyIndex === this.history.length) {
                    return this.tempInput;
                }
                return this.history[this.historyIndex];
            }
        }

        return null;
    }
}
