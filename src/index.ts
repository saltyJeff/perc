import $ from 'jquery';
import { Editor } from './editor/index';
import { Debugger } from './debugger';
import { VM } from './vm/index';
import { perc_nil } from './vm/perc_types';
// @ts-ignore
import parser from './perc-grammar.pegjs';
import './style.css';

console.log('PerC IDE initializing...');

$(() => {
    // Initialize Theme
    $('body').addClass('dark-theme');

    // Initialize Components
    const editor = new Editor('editor');
    const debug = new Debugger('debugger-content');
    const vm = new VM();

    // Wiring VM to Debugger
    let currentRunner: Generator<void, void, void> | null = null;
    let isRunning = false;
    let isPaused = false;
    let executionInterval: any = null;

    const stopVM = () => {
        isRunning = false;
        isPaused = false;
        if (executionInterval) clearInterval(executionInterval);
        executionInterval = null;
        currentRunner = null;
        editor.setReadOnly(false);
        editor.clearHighlight();
        $('#editor').removeClass('running-mode'); // Remove execution highlight
        $('#btn-stop').hide();
        $('#btn-step').hide();
        $('#btn-run').show();
        $('#btn-build').show();
        debug.setStatus('Idle');
        debug.clearCallStack();
        debug.clearVariables();
        debug.updateCurrentExpression("nil");
    };

    const runVM = async () => {
        if (!currentRunner) return;

        isRunning = true;
        isPaused = false;
        editor.setReadOnly(true);
        editor.clearErrorHighlight();
        $('#editor').addClass('running-mode'); // Add execution highlight
        $('#btn-run').hide();
        $('#btn-stop').show();
        $('#btn-step').hide();
        $('#btn-build').hide();
        debug.setStatus('Running...');

        executionInterval = setInterval(() => {
            if (!isRunning || isPaused) {
                clearInterval(executionInterval);
                return;
            }

            // Run a batch of instructions
            const BATCH_SIZE = 100;
            for (let i = 0; i < BATCH_SIZE; i++) {
                const result = currentRunner!.next();
                if (result.done) {
                    stopVM();
                    return;
                }
                if (isPaused) return; // Hit a breakpoint during batch
            }
        }, 0);
    };

    const stepVM = () => {
        if (!currentRunner) return;
        isPaused = true;
        const result = currentRunner.next();
        if (result.done) {
            stopVM();
        } else {
            debug.setStatus('Paused (Breakpoint)');
        }
    };

    vm.set_events({
        on_error: (msg) => {
            logToConsole(`Error: ${msg}`, 'error');
            debug.setStatus('Error');
            stopVM();
        },
        on_var_update: (name, value) => {
            debug.updateVariable(name, value.to_string());
        },
        on_frame_push: (frame) => {
            debug.pushFrame(`${frame.name}(${frame.args.join(', ')})`);
            debug.clearVariables(); // New frame means new scope shown
            // We might want to show globals too, but for now just current scope
        },
        on_frame_pop: () => {
            debug.popFrame();
            debug.clearVariables();
            debug.updateVariables(vm.get_current_scope_values()); // Full refresh for parent frame
        },
        on_stack_top_update: (val) => {
            debug.updateCurrentExpression(val ? val.to_string() : "nil");
        },
        on_node_eval: (range) => {
            editor.highlightRange(range[0], range[1]);
        },
        on_debugger: () => {
            isPaused = true;
            $('#btn-step').show();
            debug.setStatus('Paused (Debugger)');
        }
    });

    vm.register_foreign('print', (...args) => {
        const msg = args.map(a => (a as any).to_string()).join(' ');
        logToConsole(msg, 'log');
        return new perc_nil();
    });

    // Expose for debugging/future integration
    (window as any).editor = editor;
    (window as any).debug = debug;
    (window as any).vm = vm;

    // Initial content
    // Initial content
    editor.setValue(`// Recursive Fibonacci Example

function fib(n) {
    if (n <= 1) then { 
        return n; 
    }
    return fib(n - 1) + fib(n - 2);
}

print("Calculating fib(5)...");
debugger; // Break to inspect call stack
init result = fib(5);
print("Result: " + result);
`);

    // Console / REPL Logic
    const $consoleOut = $('#console-output');
    function logToConsole(msg: string, type: 'log' | 'error' | 'input' = 'log') {
        const $entry = $('<div>').addClass('console-entry').addClass(type).text(msg);
        $consoleOut.append($entry);
        $consoleOut.scrollTop($consoleOut[0].scrollHeight);
    };

    $('#repl-input').on('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = $(e.target).val() as string;
            if (!input.trim()) return;

            logToConsole(`> ${input}`, 'input');
            $(e.target).val('');

            try {
                // For REPL, we want to maintain the current VM state, 
                // but execute new code.
                vm.execute(input, parser);
                currentRunner = vm.run();
                runVM();
            } catch (err: any) {
                // Errors already logged by on_error event
            }
        }
    });

    $('#console-clear').on('click', () => {
        $consoleOut.empty();
    });

    // --- Execution Control ---

    $('#btn-run').on('click', () => {
        if (isPaused) {
            runVM();
            return;
        }

        logToConsole("Run: Starting execution...", 'log');
        const code = editor.getValue();
        try {
            vm.execute(code, parser);
            currentRunner = vm.run();
            runVM();
        } catch (err: any) {
            // Check for Peggy location
            if (err.location) {
                const loc = err.location.start;
                logToConsole(`Error at Line ${loc.line}, Col ${loc.column}: ${err.message}`, 'error');
                editor.highlightError(loc.line, loc.column);
            } else {
                logToConsole(`Error: ${err.message}`, 'error');
            }
        }
    });

    $('#btn-stop').on('click', () => {
        logToConsole("Stop: Execution halted.", 'log');
        stopVM();
    });

    $('#btn-step').on('click', () => {
        stepVM();
    });

    $('#btn-build').on('click', () => {
        logToConsole("Build: Compiling...", 'log');
        editor.clearErrorHighlight();
        const code = editor.getValue();
        try {
            parser.parse(code);
            logToConsole("Build: No errors found.", 'log');
        } catch (e: any) {
            if (e.location) {
                const loc = e.location.start;
                logToConsole(`Build Error at Line ${loc.line}, Col ${loc.column}: ${e.message}`, 'error');
                editor.highlightError(loc.line, loc.column);
            } else {
                logToConsole(`Build Error: ${e.message}`, 'error');
            }
        }
    });

    // --- Resizing Logic ---

    // Vertical Splitter (between Editor and Debugger)
    let isDraggingV = false;
    $('#v-split').on('mousedown', (e) => {
        isDraggingV = true;
        $('body').css('cursor', 'col-resize');
        e.preventDefault();
    });

    // Horizontal Splitter (between Top Container and Console)
    let isDraggingH = false;
    $('#h-split').on('mousedown', (e) => {
        isDraggingH = true;
        $('body').css('cursor', 'row-resize');
        e.preventDefault(); // Prevent text selection
    });

    $(document).on('mousemove', (e) => {
        if (isDraggingV) {
            const containerWidth = $('#top-container').width() || 0;
            const newDebugWidth = containerWidth - e.clientX;
            const $debugger = $('#debugger-pane');

            // Snapping logic
            if (newDebugWidth < 60) {
                if (!$debugger.hasClass('collapsed')) {
                    $debugger.addClass('collapsed').css('width', '32px');
                    updatePaneButtons($debugger);
                }
            } else {
                if ($debugger.hasClass('collapsed')) {
                    $debugger.removeClass('collapsed');
                    updatePaneButtons($debugger);
                }
                if (newDebugWidth < containerWidth - 100) {
                    $debugger.css('width', newDebugWidth + 'px');
                }
            }
            editor.resize();
        }

        if (isDraggingH) {
            const containerHeight = $('#vertical-container').height() || 0;
            const menubarHeight = $('#menubar').height() || 0;
            const newConsoleHeight = containerHeight - (e.clientY - menubarHeight);
            const $console = $('#console-pane');

            // Snapping logic
            if (newConsoleHeight < 50) {
                if (!$console.hasClass('collapsed')) {
                    $console.addClass('collapsed').css('height', '32px');
                    updatePaneButtons($console);
                }
            } else {
                if ($console.hasClass('collapsed')) {
                    $console.removeClass('collapsed');
                    updatePaneButtons($console);
                }
                if (newConsoleHeight < containerHeight - 100) {
                    $console.css('height', newConsoleHeight + 'px');
                }
            }
            editor.resize();
        }
    });

    $(document).on('mouseup', () => {
        if (isDraggingV || isDraggingH) {
            isDraggingV = false;
            isDraggingH = false;
            $('body').css('cursor', 'default');
            editor.resize();
        }
    });

    // --- Menu & Pane Actions ---

    // Zoom Logic
    const setZoom = (target: string, size: number) => {
        size = Math.max(4, Math.min(42, size));
        $(`input.zoom-slider[data-target="${target}"]`).val(size);
        const percentage = Math.round((size / 14) * 100);
        $(`button.zoom-reset[data-target="${target}"]`).text(percentage + '%');

        if (target === 'editor') {
            editor.setFontSize(size);
        } else if (target === 'debugger') {
            $('#debugger-content').css('font-size', size + 'px');
        } else if (target === 'console') {
            $('#console-output').css('font-size', size + 'px');
        }
    };

    $('input.zoom-slider').on('input', function () {
        const target = $(this).data('target');
        const size = parseInt($(this).val() as string);
        setZoom(target, size);
    });

    $('button.zoom-btn').on('click', function () {
        const target = $(this).data('target');
        const isIn = $(this).hasClass('zoom-in');
        const currentVal = parseInt($(`input.zoom-slider[data-target="${target}"]`).val() as string);
        setZoom(target, currentVal + (isIn ? 1 : -1));
    });

    $('button.zoom-reset').on('click', function () {
        const target = $(this).data('target');
        setZoom(target, 14);
    });

    const updatePaneButtons = (pane: JQuery) => {
        const isMax = pane.hasClass('maximized');
        const isMin = pane.hasClass('collapsed');
        const isNormal = !isMax && !isMin;
        pane.find('.btn-min').prop('disabled', isMin);
        pane.find('.btn-restore').prop('disabled', isNormal);
        pane.find('.btn-max').prop('disabled', isMax);
    };

    $('.pane').each(function () {
        updatePaneButtons($(this));
    });

    $('.pane-btn').on('click', function () {
        const action = $(this).data('action');
        const pane = $(this).closest('.pane');
        const container = pane.parent();
        let siblings = container.children('.pane').not(pane);
        if (container.attr('id') === 'vertical-container') {
            siblings = siblings.add(container.children('#top-container'));
        }
        const splitters = container.children('.splitter');
        pane.removeClass('maximized collapsed');
        siblings.removeClass('collapsed maximized');
        splitters.show();

        if (action === 'maximize') {
            pane.addClass('maximized');
            siblings.addClass('collapsed');
            splitters.hide();
        } else if (action === 'minimize') {
            pane.addClass('collapsed');
        }
        container.find('.pane').each(function () {
            updatePaneButtons($(this));
        });
        editor.resize();
    });

    // Editor Options
    let isDark = true;
    $('#btn-theme').on('click', function () {
        isDark = !isDark;
        $('body').toggleClass('dark-theme', isDark).toggleClass('light-theme', !isDark);
        editor.setTheme(isDark ? 'dark' : 'light');
        $(this).text(`Theme: ${isDark ? 'Dark' : 'Light'}`);
    });

    let isWrap = true;
    $('#btn-wrap').on('click', function () {
        isWrap = !isWrap;
        editor.setWordWrap(isWrap);
        $(this).text(`Wrap: ${isWrap ? 'On' : 'Off'}`);
    });

    logToConsole("Welcome to PerC IDE v0.1", 'log');
});
