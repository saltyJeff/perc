import { describe, it, expect, beforeEach } from 'vitest';
import { consoleStore } from './ConsoleStore';

describe('Console History (via ConsoleStore)', () => {
    beforeEach(() => {
        // Reset store state
        consoleStore.actions.clear();
        // Since consoleStore is a singleton in the current implementation, 
        // we should ideally have a way to reset history. 
        // Looking at ConsoleStore.ts, clear() only clears entries.
        // Let's check ConsoleStore.ts again to see if we can reset history.
    });

    it('should push commands to history', () => {
        consoleStore.actions.pushHistory('cmd1');
        const res = consoleStore.actions.navigateHistory('up', '');
        expect(res).toBe('cmd1');
    });

    it('should not push duplicates sequentially', () => {
        consoleStore.actions.pushHistory('cmd1');
        consoleStore.actions.pushHistory('cmd1');

        // Should only have 1 entry in effect
        let res = consoleStore.actions.navigateHistory('up', '');
        expect(res).toBe('cmd1');

        res = consoleStore.actions.navigateHistory('up', '');
        expect(res).toBeNull();
    });

    it('should limit history to 20 entries', () => {
        for (let i = 1; i <= 25; i++) {
            consoleStore.actions.pushHistory(`cmd${i}`);
        }

        // Navigate up 20 times. The oldest should be cmd6.
        let lastCmd = '';
        for (let i = 0; i < 20; i++) {
            const res = consoleStore.actions.navigateHistory('up', '');
            if (res) lastCmd = res;
        }

        expect(lastCmd).toBe('cmd6');

        const res = consoleStore.actions.navigateHistory('up', '');
        expect(res).toBeNull();
    });

    it('should navigate up and down', () => {
        consoleStore.actions.pushHistory('cmd1');
        consoleStore.actions.pushHistory('cmd2');

        // Up -> index 1 ('cmd2')
        let res = consoleStore.actions.navigateHistory('up', 'current');
        expect(res).toBe('cmd2');

        // Up -> index 0 ('cmd1')
        res = consoleStore.actions.navigateHistory('up', 'cmd2');
        expect(res).toBe('cmd1');

        // Down -> index 1 ('cmd2')
        res = consoleStore.actions.navigateHistory('down', 'cmd1');
        expect(res).toBe('cmd2');

        // Down -> index 2 (restored tempInput 'current')
        res = consoleStore.actions.navigateHistory('down', 'cmd2');
        expect(res).toBe('current');
    });
});
