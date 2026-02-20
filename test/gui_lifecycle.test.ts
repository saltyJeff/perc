import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GUIManager } from '../src/gui_window/manager'; // Adjust path if needed

describe('GUIManager Lifecycle', () => {
    let gui: GUIManager;
    let mockWindow: any;
    let openSpy: any;

    beforeEach(() => {
        // Mock window.open
        mockWindow = {
            closed: false,
            focus: vi.fn(),
            postMessage: vi.fn(),
            close: vi.fn(),
            addEventListener: vi.fn(),
        };
        openSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow);

        // Mock window.addEventListener for the manager constructor
        vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'message') {
                // Store handler to invoke later if needed
                (window as any)._messageHandler = handler;
            }
        });

        gui = new GUIManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should open a window successfully', () => {
        const success = gui.openWindow();
        expect(openSpy).toHaveBeenCalled();
        expect(success).toBe(true);
    });

    it('should not reopen if intentionally opened but now closed (lockout)', () => {
        gui.openWindow(); // Open first time

        // Simulate closure
        mockWindow.closed = true;

        // Try to open again without reset
        const success = gui.openWindow();
        expect(success).toBe(false);
    });

    it('should reopen after resetIntentional is called', () => {
        gui.openWindow();
        mockWindow.closed = true;

        gui.resetIntentional();

        // Should be able to open again (mocking a new window instance for clarity)
        const newMockWindow = { ...mockWindow, closed: false };
        openSpy.mockReturnValue(newMockWindow);

        const success = gui.openWindow();
        expect(success).toBe(true);
    });

    it('should trigger onClose callback when gui_closed message is received', () => {
        const onCloseSpy = vi.fn();
        gui.setOnClose(onCloseSpy);

        gui.openWindow(); // Ensure subwindow is set

        // Simulate receiving 'gui_closed' message
        // We need to trigger the message handler registered in constructor
        const handler = (window as any)._messageHandler;
        if (handler) {
            handler({
                source: mockWindow,
                data: { type: 'gui_closed' }
            });
        }

        expect(onCloseSpy).toHaveBeenCalled();
        // Also should have called cleanup (window.close)
        expect(mockWindow.close).toHaveBeenCalled();
    });
});
