import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Console } from './index';
import $ from 'jquery';

describe('Console', () => {
    let consoleInstance: Console;
    let outputElement: JQuery<HTMLElement>;
    let inputElement: JQuery<HTMLElement>;

    beforeEach(() => {
        // Setup DOM elements
        $('body').append('<div id="test-output"></div>');
        $('body').append('<input id="test-input" />');

        outputElement = $('#test-output');
        inputElement = $('#test-input');

        consoleInstance = new Console('test-output', 'test-input');
    });

    afterEach(() => {
        $('#test-output').remove();
        $('#test-input').remove();
    });

    it('should print without newline', () => {
        consoleInstance.print('Hello ');
        consoleInstance.print('World');

        const entries = outputElement.find('.console-entry');
        expect(entries.length).toBe(1); // Should be on same line
        expect(entries.text()).toBe('Hello World');
    });

    it('should println with newline', () => {
        consoleInstance.println('Line 1');
        consoleInstance.println('Line 2');

        const entries = outputElement.find('.console-entry');
        expect(entries.length).toBe(2); // Should be on different lines
        expect(entries.eq(0).text()).toBe('Line 1');
        expect(entries.eq(1).text()).toBe('Line 2');
    });

    it('should apply text color to print', () => {
        consoleInstance.setTextColor('rgb(255, 0, 0)');
        consoleInstance.print('Red text');

        const span = outputElement.find('span').first();
        expect(span.css('color')).toBe('rgb(255, 0, 0)');
    });

    it('should maintain color across multiple prints', () => {
        consoleInstance.setTextColor('rgb(0, 255, 0)');
        consoleInstance.print('Green ');
        consoleInstance.print('Text');

        const spans = outputElement.find('span');
        expect(spans.length).toBe(2);
        expect(spans.eq(0).css('color')).toBe('rgb(0, 255, 0)');
        expect(spans.eq(1).css('color')).toBe('rgb(0, 255, 0)');
    });

    it('should reset text color', () => {
        consoleInstance.setTextColor('rgb(255, 0, 0)');
        consoleInstance.print('Red ');
        consoleInstance.resetTextColor();
        consoleInstance.print('Normal');

        const spans = outputElement.find('span');
        expect(spans.eq(0).css('color')).toBe('rgb(255, 0, 0)');
        // Second span should not have explicit color set
        expect(spans.eq(1).attr('style')).toBeUndefined();
    });

    it('should not apply color to status messages', () => {
        consoleInstance.setTextColor('rgb(255, 0, 0)');
        consoleInstance.status('Status message');

        const entry = outputElement.find('.console-entry.status');
        expect(entry.length).toBe(1);
        // Status should not have colored spans
        expect(entry.find('span').length).toBe(0);
    });

    it('should not apply color to error messages', () => {
        consoleInstance.setTextColor('rgb(255, 0, 0)');
        consoleInstance.error('Error message');

        const entry = outputElement.find('.console-entry.error');
        expect(entry.length).toBe(1);
        // Error should not have colored spans
        expect(entry.find('span').length).toBe(0);
    });

    it('should finalize log entry before status message', () => {
        consoleInstance.print('User text');
        consoleInstance.status('Status');
        consoleInstance.print('More user text');

        const entries = outputElement.find('.console-entry');
        expect(entries.length).toBe(3);
        expect(entries.eq(0).hasClass('log')).toBe(true);
        expect(entries.eq(1).hasClass('status')).toBe(true);
        expect(entries.eq(2).hasClass('log')).toBe(true);
    });

    it('should clear all state on clear', () => {
        consoleInstance.setTextColor('rgb(255, 0, 0)');
        consoleInstance.print('Text');
        consoleInstance.clear();

        expect(outputElement.children().length).toBe(0);

        // Color should be reset
        consoleInstance.print('New text');
        const span = outputElement.find('span').first();
        expect(span.attr('style')).toBeUndefined();
    });
});
