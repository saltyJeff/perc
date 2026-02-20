import { describe, it, expect, beforeEach } from 'vitest';
import { consoleStore } from './ConsoleStore';

describe('ConsoleStore (via ConsoleStore)', () => {
    beforeEach(() => {
        consoleStore.actions.reset();
    });

    it('should add log entries', () => {
        consoleStore.actions.addEntry('Hello World', 'log');

        expect(consoleStore.state.entries.length).toBe(1);
        expect(consoleStore.state.entries[0].msg).toBe('Hello World');
        expect(consoleStore.state.entries[0].type).toBe('log');
    });

    it('should handle printing with specific colors', () => {
        const testColor = 'rgb(255, 0, 0)';
        consoleStore.actions.setTextColor(testColor);
        consoleStore.actions.addEntry('Red text', 'log');

        expect(consoleStore.state.entries[0].color).toBe(testColor);
    });

    it('should reset text color when requested', () => {
        consoleStore.actions.setTextColor('rgb(255, 0, 0)');
        consoleStore.actions.reset(); // reset clears color too
        consoleStore.actions.addEntry('Default text', 'log');

        expect(consoleStore.state.entries[0].color).toBe('var(--fg-color)');
    });

    it('should handle status and error entries', () => {
        consoleStore.actions.addEntry('Status message', 'status');
        consoleStore.actions.addEntry('Error message', 'error', [10, 20]);

        expect(consoleStore.state.entries[0].type).toBe('status');
        expect(consoleStore.state.entries[1].type).toBe('error');
        expect(consoleStore.state.entries[1].location).toEqual([10, 20]);
    });

    it('should clear entries on clear()', () => {
        consoleStore.actions.addEntry('Test', 'log');
        consoleStore.actions.clear();

        expect(consoleStore.state.entries.length).toBe(0);
    });
});
