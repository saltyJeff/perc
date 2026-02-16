import $ from 'jquery';
import { Editor } from './editor/index';
import { Debugger } from './debugger/index';
import { Console } from './console/index';
import { VM } from './vm/index';
import { Compiler } from './vm/compiler';
import { GUIManager } from './gui_window/manager';
import { perc_string } from './vm/perc_types';
// @ts-ignore
import parser from './perc-grammar.pegjs';

import './style.css';
import './console/console.css';
import './editor/editor.css';
import './debugger/debugger.css';
import './ui/perc_value.css';
import { standardBuiltins } from './vm/builtins';
import { createConsoleBuiltins } from './console/builtins';
import { createGuiBuiltins } from './gui_window/builtins';

console.log('PerC IDE initializing...');

$(() => {
    // Initialize Theme
    $('body').addClass('dark-theme');

    // Initialize Components
    const editor = new Editor('editor');
    const debug = new Debugger('debugger-content');
    const appConsole = new Console('console-output', 'repl-input');
    const vm = new VM();
    const gui = new GUIManager();

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

        return new Promise<void>((resolve) => {
            isRunning = true;
            isPaused = false;
            // Don't clear isWaitingForInput here if we are resuming from input
            if (!vm.is_waiting_for_input) isWaitingForInput = false;

            editor.enter_run_mode();
            updateToolbarState('running');
            debug.setStatus('Running...');
            $('#debugger-pane').addClass('collapsed');
            $('.pane').each(function () { updatePaneButtons($(this)); });

            executionInterval = setInterval(() => {
                if (!isRunning || isPaused || isWaitingForInput) {
                    clearInterval(executionInterval);
                    // If just paused or waiting, we don't resolve yet? 
                    // Actually, for REPL usage we want to know when it *finishes*.
                    // But if it needs input, it pauses.
                    // If we are waiting for input, the REPL flow is interrupted anyway.
                    // So we probably only resolve when DONE or STOPPED.
                    if (!isRunning) resolve();
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
                        appConsole.status("Execution stopped.");
                        stopVM();
                        resolve();
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
        });
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
            // Avoid duplicate "Syntax Error" or "Error" prefixes if the message already has them
            const cleanMsg = msg.replace(/^(Javascript Error|Syntax Error|Error):\s*/i, '');
            appConsole.error(`Error: ${cleanMsg}`, location);
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

    // Register Builtins
    vm.register_builtins(standardBuiltins);
    vm.register_builtins(createConsoleBuiltins(appConsole));
    vm.register_builtins(createGuiBuiltins(gui));

    // Update Editor with registered builtins
    const allBuiltins = Array.from(vm.get_foreign_funcs().keys()) as string[];
    editor.setBuiltins(allBuiltins);

    // Expose for debugging/future integration
    (window as any).editor = editor;
    (window as any).debug = debug;
    (window as any).vm = vm;
    (window as any).appConsole = appConsole;

    // Initial content
    editor.setValue(`// PerC GUI Kitchen Sink
init x = 100;
init y = 100;
init msg = "Click me!";
init val = 50;

while(true) then {
    window();
    
    fill(rgb(255, 255, 255));
    rect(0, 0, 640, 480);
    
    fill(rgb(0, 0, 0));
    text("Welcome to PerC GUI!", 320, 30, "center");
    
    if (button(msg, 10, 50)) then {
        change msg = "Clicked!";
        change x = x + 10;
    }
    
    fill(rgb(200, 100, 100));
    circle(x, 150, 50);
    
    stroke(rgb(100, 200, 100), 5);
    line(10, 250, 300, 250);
    
    text("Slider Value: " + val, 10, 280, "left");
    change val = slider(10, 300);
    
    fill(rgb(100, 100, 255));
    polygon(400, 100, new [new {"x": 0, "y": 0}, new {"x": 50, "y": 0}, new {"x": 25, "y": 50}]);
    
    // Grouped transformations - will be reset after end_group
    group();
    translate(500, 300);
    rotate(0.1);
    fill(rgb(255, 255, 0));
    rect(0, 0, 100, 50);
    end_group();
    
    // Draw a smiley face using sprite (8x8 pixels) - scaled up 10x
    init yellow = rgb(255, 255, 0);
    init black = rgb(0, 0, 0);
    init faceData = new [
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow,
        yellow, black, yellow, yellow, yellow, yellow, black, yellow,
        yellow, yellow, black, yellow, yellow, black, yellow, yellow,
        yellow, yellow, yellow, black, black, yellow, yellow, yellow,
        yellow, yellow, yellow, yellow, yellow, yellow, yellow, yellow
    ];
    group();
    translate(600, 50);
    scale(10, 10);
    sprite(0, 0, 8, 8, faceData);
    end_group();
    
    // Textbox widget
    fill(rgb(0, 0, 0));
    text("Enter text:", 10, 350, "left");
    init userText = textbox(10, 370);
    text("You typed: " + userText, 10, 410, "left");
    
    // Checkbox widget (green check on black border)
    fill(rgb(0, 255, 0));
    stroke(rgb(0, 0, 0));
    init isChecked = checkbox(10, 430);
    text("Checkbox: " + isChecked, 40, 440, "left");
    
    // Radio button group "Colors"
    fill(rgb(128, 0, 128));
    stroke(rgb(0, 0, 255));
    init isRed = radio("Colors", 10, 460);
    text("Red: " + isRed, 40, 470, "left");
    
    init isBlue = radio("Colors", 30, 460);
    text("Blue: " + isBlue, 40, 500, "left");
    
    // Transparency demonstration (drawing blue on top of red)
    fill(rgba(0, 0, 255, 0.5));
    rect(400, 400, 100, 100);
    
    fill(rgba(255, 0, 0, 0.5));
    rect(350, 350, 100, 100);
    
    end_window();
}
`);

    $('#repl-input').on('keydown', async (e) => {
        if (e.key === 'Enter') {
            const input = $(e.target).val() as string;
            // Allow empty input? Yes.

            appConsole.input(`> ${input}`);
            $(e.target).val('');

            // Push to history if valid command
            if (input.trim()) {
                appConsole.pushHistory(input);
            }

            if (isWaitingForInput && currentRunner) {
                // Resume VM
                vm.resume_with_input(new perc_string(input));
                isWaitingForInput = false;
                runVM();
                return;
            }

            if (input.trim()) {
                try {
                    // For REPL, we execute new code with persistent scope
                    vm.execute_repl(input, parser);
                    currentRunner = vm.run();
                    await runVM(); // Wait for completion

                    if (vm.stack.length > 0) {
                        const result = vm.stack.pop();
                        if (result) {
                            appConsole.print(result.to_string());
                        }
                    }
                } catch (err: any) {
                    // Errors already logged
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const currentInput = $(e.target).val() as string;
            const historyCmd = appConsole.navigateHistory('up', currentInput);
            if (historyCmd !== null) {
                $(e.target).val(historyCmd);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const currentInput = $(e.target).val() as string;
            const historyCmd = appConsole.navigateHistory('down', currentInput);
            if (historyCmd !== null) {
                $(e.target).val(historyCmd);
            }
        }
    });

    // Provide variables to Editor for global autocomplete
    editor.setVariableProvider(() => {
        // Return global variables from persistent scope
        return Array.from(vm.get_global_scope().values.keys());
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
                appConsole.error(`Syntax Error at Line ${start.line}, Col ${start.column}: ${err.message}`, [start.offset, end.offset]);
                editor.highlightError(start.line, start.column);
            } else {
                appConsole.error(`Parse Error: ${err.message}`);
                console.error(err)
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
            // Use VM to compile so we get the same errors as Run (e.g. Double Init)
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const ast = parser.parse(code);
            compiler.compile(ast);
            appConsole.status("Build: No errors found.");
        } catch (e: any) {
            // Check for Peggy location or Compiler location
            const loc = e.location ? e.location.start : null;
            if (loc) {
                // If the error message already starts with "Error" or similar, don't prefix heavily
                const msg = e.message.replace(/^Error:\s*/, '');
                appConsole.error(`Build Error: ${msg}`, e.location ? [e.location.start.offset, e.location.end.offset] : null);
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
