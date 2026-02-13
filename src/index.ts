import $ from 'jquery';
import { Editor } from './editor/index';
import { Debugger } from './debugger/index';
import { Console } from './console/index';
import { VM } from './vm/index';
import { perc_nil, perc_string, perc_number } from './vm/perc_types';
// @ts-ignore
import parser from './perc-grammar.pegjs';
import './style.css';
import './console/console.css';
import './editor/editor.css';
import './debugger/debugger.css';
import './ui/perc_value.css';

console.log('PerC IDE initializing...');

$(() => {
    // Initialize Theme
    $('body').addClass('dark-theme');

    // Initialize Components
    const editor = new Editor('editor');
    const debug = new Debugger('debugger-content');
    const appConsole = new Console('console-output', 'repl-input');
    const vm = new VM();

    // Wiring VM to Debugger
    let currentRunner: Generator<void, void, void> | null = null;
    let isRunning = false;
    let isPaused = false;
    let isWaitingForInput = false;
    let executionInterval: any = null;

    const updateToolbarState = (state: 'idle' | 'running' | 'paused') => {
        const btnRun = $('#btn-run');
        const btnBuild = $('#btn-build');
        const btnStop = $('#btn-stop');
        const btnStep = $('#btn-step');
        const btnContinue = $('#btn-continue');

        switch (state) {
            case 'idle':
                btnRun.show();
                btnBuild.show();
                btnStop.hide();
                btnStep.hide();
                btnContinue.hide();
                break;
            case 'running':
                btnRun.hide();
                btnBuild.hide();
                btnStop.show();
                btnStep.hide();
                btnContinue.hide();
                break;
            case 'paused':
                btnRun.hide();
                btnBuild.hide();
                btnStop.show();
                btnStep.show();
                btnContinue.show();
                break;
        }
    };

    const stopVM = () => {
        isRunning = false;
        isPaused = false;
        isWaitingForInput = false;
        if (executionInterval) clearInterval(executionInterval);
        executionInterval = null;
        currentRunner = null;
        editor.enter_idle_mode();
        updateToolbarState('idle');
        debug.setStatus('Idle');
        debug.clearCallStack();
        debug.clearVariables();
        debug.updateCurrentExpression(null);
        $('#debugger-pane').addClass('collapsed');
        $('.pane').each(function () { updatePaneButtons($(this)); });
    };

    const runVM = async () => {
        if (!currentRunner) return;

        isRunning = true;
        isPaused = false;
        // Don't clear isWaitingForInput here if we are resuming from input
        if (!vm.is_waiting_for_input) isWaitingForInput = false;

        // Don't clear isWaitingForInput here if we are resuming from input
        if (!vm.is_waiting_for_input) isWaitingForInput = false;

        editor.enter_run_mode();
        editor.enter_run_mode();
        updateToolbarState('running');
        debug.setStatus('Running...');
        $('#debugger-pane').addClass('collapsed');
        $('.pane').each(function () { updatePaneButtons($(this)); });

        executionInterval = setInterval(() => {
            if (!isRunning || isPaused || isWaitingForInput) {
                clearInterval(executionInterval);
                return;
            }

            // Check VM internal wait state too
            if (vm.is_waiting_for_input) {
                isWaitingForInput = true;
                debug.setStatus('Waiting for Input...');
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

                // If instruction triggered input wait
                if (vm.is_waiting_for_input) {
                    isWaitingForInput = true;
                    debug.setStatus('Waiting for Input...');
                    return; // Loop will restart next interval, catch wait state and stop
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
            updateToolbarState('paused'); // Ensure buttons are correct for stepping
        }
    };

    vm.set_events({
        on_error: (msg, location) => {
            appConsole.error(`Error: ${msg}`, location);
            debug.setStatus('Error');
            stopVM();
        },
        on_input_request: (prompt) => {
            appConsole.print(prompt || "Input required:");
            appConsole.print("Type input below and press Enter...");
            appConsole.focusInput();
        },
        // ... other events ...
        on_var_update: (name, value, range) => {
            debug.updateVariable(name, value, range);
        },
        on_frame_push: (frame) => {
            debug.pushFrame(frame.name, frame.args);
            // debug.clearVariables(); // Removed
            debug.updateTopFrameVariables(vm.get_current_scope_values()); // Populate new frame
        },
        on_frame_pop: () => {
            debug.popFrame();
            // debug.clearVariables(); // Removed
            debug.updateTopFrameVariables(vm.get_current_scope_values()); // Refresh parent frame
        },
        on_stack_top_update: (val) => {
            debug.updateCurrentExpression(val);
        },
        on_node_eval: (range) => {
            editor.highlightRange(range[0], range[1]);
        },
        on_debugger: () => {
            isPaused = true;
            updateToolbarState('paused');
            debug.setStatus('Paused (Debugger)');
            $('#debugger-pane').removeClass('collapsed');
            $('.pane').each(function () { updatePaneButtons($(this)); });
            editor.enter_debug_mode();
        },
        on_state_dump: () => {
            debug.clearCallStack();
            // debug.clearVariables(); // Removed
            const frames = vm.get_frames();
            frames.forEach(f => {
                debug.pushFrame(f.name, f.args);
                // Populate THIS frame with its visible variables (excluding globals unless it IS global)
                if (f.scope) {
                    const vars = vm.get_scope_variables(f.scope);
                    debug.updateTopFrameVariables(vars);
                }
            });
            // Update variables for current scope (Sidebar)
            debug.updateTopFrameVariables(vm.get_current_scope_values());
        }
    });

    // Wire Console Error Click
    appConsole.onErrorClick = (loc) => {
        editor.highlightAndScroll(loc, 'error');
    };

    vm.register_foreign('print', (...args) => {
        const msg = args.map(a => (a as any).to_string()).join(' ');
        appConsole.print(msg);
        return new perc_nil();
    });

    vm.register_foreign('println', (...args) => {
        const msg = args.map(a => (a as any).to_string()).join(' ');
        appConsole.println(msg);
        return new perc_nil();
    });

    vm.register_foreign('text_color_rgb', (r, g, b) => {
        // Validate that all arguments are numbers
        if (!(r instanceof perc_number)) {
            throw new Error(`text_color_rgb: first argument must be a number, got ${r.to_string()}`);
        }
        if (!(g instanceof perc_number)) {
            throw new Error(`text_color_rgb: second argument must be a number, got ${g.to_string()}`);
        }
        if (!(b instanceof perc_number)) {
            throw new Error(`text_color_rgb: third argument must be a number, got ${b.to_string()}`);
        }
        const rVal = Math.floor(r.buffer[0]);
        const gVal = Math.floor(g.buffer[0]);
        const bVal = Math.floor(b.buffer[0]);

        // Clamp values to 0-255
        const rClamped = Math.max(0, Math.min(255, rVal));
        const gClamped = Math.max(0, Math.min(255, gVal));
        const bClamped = Math.max(0, Math.min(255, bVal));

        appConsole.setTextColor(`rgb(${rClamped}, ${gClamped}, ${bClamped})`);
        return new perc_nil();
    });

    vm.register_foreign('text_color_hsl', (h, s, l) => {
        // Validate that all arguments are numbers
        if (!(h instanceof perc_number)) {
            throw new Error(`text_color_hsl: first argument must be a number, got ${h.to_string()}`);
        }
        if (!(s instanceof perc_number)) {
            throw new Error(`text_color_hsl: second argument must be a number, got ${s.to_string()}`);
        }
        if (!(l instanceof perc_number)) {
            throw new Error(`text_color_hsl: third argument must be a number, got ${l.to_string()}`);
        }
        const hVal = h.buffer[0];
        const sVal = s.buffer[0];
        const lVal = l.buffer[0];

        // Clamp hue to 0-360, saturation and lightness to 0-100
        const hClamped = ((hVal % 360) + 360) % 360; // Handle negative values
        const sClamped = Math.max(0, Math.min(100, sVal));
        const lClamped = Math.max(0, Math.min(100, lVal));

        appConsole.setTextColor(`hsl(${hClamped}, ${sClamped}%, ${lClamped}%)`);
        return new perc_nil();
    });

    // Expose for debugging/future integration
    (window as any).editor = editor;
    (window as any).debug = debug;
    (window as any).vm = vm;
    (window as any).appConsole = appConsole;

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

    $('#repl-input').on('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = $(e.target).val() as string;
            // Allow empty input? Yes.

            appConsole.input(`> ${input}`);
            $(e.target).val('');

            if (isWaitingForInput && currentRunner) {
                // Resume VM
                vm.resume_with_input(new perc_string(input));
                isWaitingForInput = false;
                runVM();
                return;
            }

            if (input.trim()) {
                try {
                    // For REPL, we execute new code
                    vm.execute(input, parser);
                    currentRunner = vm.run();
                    runVM();
                } catch (err: any) {
                    // Errors already logged
                }
            }
        }
    });

    $('#console-clear').on('click', () => {
        appConsole.clear();
    });

    // --- Execution Control ---

    // Wire up debugger to editor
    debug.onVariableHover = (range) => {
        if (range) {
            editor.highlightVariableDefinition(range[0], range[1]);
        } else {
            editor.clearVariableDefinitionHighlight();
        }
    };

    $('#btn-run').on('click', () => {
        if (isPaused) {
            runVM();
            return;
        }

        appConsole.status("Run: Starting execution...");
        const code = editor.getValue();
        try {
            vm.execute(code, parser);
            vm.in_debug_mode = false;
            currentRunner = vm.run();
            runVM();
        } catch (err: any) {
            // Check for Peggy location
            if (err.location) {
                const start = err.location.start;
                const end = err.location.end;
                // appConsole.error expects location for clicking. Editor expects line/col for pure highlighting.
                // We pass [start, end] offsets to console for the link.
                appConsole.error(`Error at Line ${start.line}, Col ${start.column}: ${err.message}`, [start.offset, end.offset]);
                editor.highlightError(start.line, start.column);
            } else {
                appConsole.error(`Error: ${err.message}`);
            }
        }
    });

    $('#btn-stop').on('click', () => {
        appConsole.status("Stop: Execution halted.");
        stopVM();
    });

    $('#btn-step').on('click', () => {
        stepVM();
    });

    $('#btn-continue').on('click', () => {
        vm.in_debug_mode = false;
        $('#debugger-pane').addClass('collapsed');
        $('.pane').each(function () { updatePaneButtons($(this)); });
        runVM(); // Resume execution
    });

    $('#btn-build').on('click', () => {
        appConsole.status("Build: Compiling...");
        editor.clearErrorHighlight();
        const code = editor.getValue();
        try {
            parser.parse(code);
            appConsole.status("Build: No errors found.");
        } catch (e: any) {
            if (e.location) {
                const loc = e.location.start;
                appConsole.error(`Build Error at Line ${loc.line}, Col ${loc.column}: ${e.message}`);
                editor.highlightError(loc.line, loc.column);
            } else {
                appConsole.error(`Build Error: ${e.message}`);
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

    appConsole.status("Welcome to PerC IDE v0.1");
});
