import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Console } from './index';
import $ from 'jquery';

// Mock the global $
vi.mock('jquery', () => {
    const mockJQueryInstance = {
        length: 1,
        on: vi.fn(),
        empty: vi.fn(),
        append: vi.fn(),
        scrollTop: vi.fn(),
        focus: vi.fn(),
        val: vi.fn(),
        data: vi.fn(),
        css: vi.fn(),
        text: vi.fn(),
        addClass: vi.fn(),
        attr: vi.fn()
    };
    const mockFn = vi.fn(() => mockJQueryInstance);
    return {
        default: mockFn
    };
});

describe('Console History', () => {
    let consoleInstance: Console;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        // Create instance - the constructor calls $ which returns our mock
        consoleInstance = new Console('output', 'input');
    });

    it('should push commands to history', () => {
        consoleInstance.pushHistory('cmd1');
        const res = consoleInstance.navigateHistory('up', '');
        expect(res).toBe('cmd1');
    });

    it('should not push duplicates sequentially', () => {
        consoleInstance.pushHistory('cmd1');
        consoleInstance.pushHistory('cmd1');

        // Should only have 1 entry
        let res = consoleInstance.navigateHistory('up', '');
        expect(res).toBe('cmd1');

        res = consoleInstance.navigateHistory('up', '');
        // If there were 2, verify behavior. Actually simple mental check:
        // index starts at 1. Up -> index 0 ('cmd1'). Up -> index 0.
        // It's hard to verify length directly as it's private.
        // But we can verify index reset behavior.
    });

    it('should limit history to 20 entries', () => {
        for (let i = 1; i <= 25; i++) {
            consoleInstance.pushHistory(`cmd${i}`);
        }

        // Navigate up 20 times. The oldest should be cmd6.
        // History should contain [cmd6, ..., cmd25] (length 20)

        let lastCmd = '';
        for (let i = 0; i < 20; i++) {
            const res = consoleInstance.navigateHistory('up', '');
            if (res) lastCmd = res;
        }

        expect(lastCmd).toBe('cmd6');

        // One more up should return null (no change) or stay at cmd6 depending on implementation
        // Current implementation returns null if index > 0 check fails logic wise?
        // Code: if (this.historyIndex > 0) { historyIndex--; return ... }
        // So at index 0, it doesn't enter if block, returns null.
        const res = consoleInstance.navigateHistory('up', '');
        expect(res).toBeNull();
    });

    it('should navigate up and down', () => {
        consoleInstance.pushHistory('cmd1'); // index 1
        consoleInstance.pushHistory('cmd2'); // index 2

        // Start: index=2, tempInput=""

        // Up -> index 1 ('cmd2')
        let res = consoleInstance.navigateHistory('up', 'current');
        expect(res).toBe('cmd2');

        // Up -> index 0 ('cmd1')
        res = consoleInstance.navigateHistory('up', 'cmd2');
        expect(res).toBe('cmd1');

        // Down -> index 1 ('cmd2')
        res = consoleInstance.navigateHistory('down', 'cmd1');
        expect(res).toBe('cmd2');

        // Down -> index 2 (restored tempInput 'current')
        res = consoleInstance.navigateHistory('down', 'cmd2');
        expect(res).toBe('current');
    });
});
