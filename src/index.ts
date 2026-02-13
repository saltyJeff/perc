import $ from 'jquery';
import { Editor } from './editor/index';
import { Debugger } from './debugger/index';
import { Console } from './console/index';
import { VM } from './vm/index';
import { GUIManager } from './gui_window/manager';
import { perc_type, perc_nil, perc_string, perc_number, perc_map, perc_bool, perc_list } from './vm/perc_types';
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
            appConsole.error(`JS Error: ${msg}`, location);
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

    vm.register_foreign('text_color', (color: perc_type) => {
        if (!(color instanceof perc_map)) {
            throw new Error(`text_color: argument must be a color map (from rgb() or hsl()), got ${color.type}`);
        }
        const r = color.get(new perc_string('r'));
        const g = color.get(new perc_string('g'));
        const b = color.get(new perc_string('b'));

        if (!(r instanceof perc_number) || !(g instanceof perc_number) || !(b instanceof perc_number)) {
            throw new Error("text_color: invalid color map components");
        }

        const rVal = Math.max(0, Math.min(255, Math.floor(r.buffer[0])));
        const gVal = Math.max(0, Math.min(255, Math.floor(g.buffer[0])));
        const bVal = Math.max(0, Math.min(255, Math.floor(b.buffer[0])));

        appConsole.setTextColor(`rgb(${rVal}, ${gVal}, ${bVal})`);
        return new perc_nil();
    });

    // --- GUI Functions ---
    vm.register_foreign('window', () => {
        gui.openWindow();
        gui.clearCommands();
        return new perc_nil();
    });

    vm.register_foreign('end_window', () => {
        gui.flushCommands();
        return new perc_nil();
    });

    vm.register_foreign('button', (text, x, y) => {
        const id = `btn_${text.to_string()}_${x.to_string()}_${y.to_string()}`;
        gui.pushCommand('button', { id, text: text.to_string(), x: (x as any).buffer[0], y: (y as any).buffer[0] });
        return new perc_bool(gui.isClicked(id));
    });

    vm.register_foreign('fill', (color) => {
        if (color instanceof perc_map) {
            const r = (color.get(new perc_string('r')) as any).buffer[0];
            const g = (color.get(new perc_string('g')) as any).buffer[0];
            const b = (color.get(new perc_string('b')) as any).buffer[0];
            gui.pushCommand('fill', { r, g, b });
        }
        return new perc_nil();
    });

    vm.register_foreign('rect', (x, y, w, h) => {
        gui.pushCommand('rect', {
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            w: (w as any).buffer[0],
            h: (h as any).buffer[0]
        });
        return new perc_nil();
    });

    vm.register_foreign('circle', (x, y, r) => {
        gui.pushCommand('circle', {
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            r: (r as any).buffer[0]
        });
        return new perc_nil();
    });

    vm.register_foreign('line', (x1, y1, x2, y2) => {
        gui.pushCommand('line', {
            x1: (x1 as any).buffer[0],
            y1: (y1 as any).buffer[0],
            x2: (x2 as any).buffer[0],
            y2: (y2 as any).buffer[0]
        });
        return new perc_nil();
    });

    vm.register_foreign('text', (text, x, y, align) => {
        const alignment = align instanceof perc_string ? align.to_string() : 'left';
        gui.pushCommand('text', {
            text: text.to_string(),
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            align: alignment
        });
        return new perc_nil();
    });

    vm.register_foreign('stroke', (color, width) => {
        if (color instanceof perc_map) {
            const r = (color.get(new perc_string('r')) as any).buffer[0];
            const g = (color.get(new perc_string('g')) as any).buffer[0];
            const b = (color.get(new perc_string('b')) as any).buffer[0];
            gui.pushCommand('stroke', { r, g, b, width: width instanceof perc_number ? width.buffer[0] : 1 });
        }
        return new perc_nil();
    });

    vm.register_foreign('slider', (x, y) => {
        const id = `slider_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
        const currentVal = gui.getInput(id + '_val') || 0;
        gui.pushCommand('slider', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val: currentVal });
        return new perc_number(currentVal);
    });

    vm.register_foreign('translate', (x, y) => {
        gui.pushCommand('translate', { x: (x as any).buffer[0], y: (y as any).buffer[0] });
        return new perc_nil();
    });

    vm.register_foreign('scale', (x, y) => {
        gui.pushCommand('scale', { x: (x as any).buffer[0], y: (y as any).buffer[0] });
        return new perc_nil();
    });

    vm.register_foreign('rotate', (angle) => {
        gui.pushCommand('rotate', { angle: (angle as any).buffer[0] });
        return new perc_nil();
    });

    vm.register_foreign('group', () => {
        gui.pushCommand('save', {});
        return new perc_nil();
    });

    vm.register_foreign('end_group', () => {
        gui.pushCommand('restore', {});
        return new perc_nil();
    });

    vm.register_foreign('image', (x, y, w, h, url) => {
        gui.pushCommand('image', {
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            w: (w as any).buffer[0],
            h: (h as any).buffer[0],
            url: url.to_string()
        });
        return new perc_nil();
    });

    vm.register_foreign('sprite', (x, y, w, h, data) => {
        const pixels: any[] = [];
        if (data instanceof perc_list) {
            for (const pixel of data.elements) {
                if (pixel instanceof perc_map) {
                    pixels.push({
                        r: (pixel.get(new perc_string('r')) as any).buffer[0],
                        g: (pixel.get(new perc_string('g')) as any).buffer[0],
                        b: (pixel.get(new perc_string('b')) as any).buffer[0]
                    });
                }
            }
        }
        gui.pushCommand('sprite', {
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            w: (w as any).buffer[0],
            h: (h as any).buffer[0],
            data: pixels
        });
        return new perc_nil();
    });

    vm.register_foreign('polygon', (x, y, points) => {
        const pts: { x: number, y: number }[] = [];
        if (points instanceof perc_list) {
            for (const p of points.elements) {
                if (p instanceof perc_map) {
                    pts.push({
                        x: (p.get(new perc_string('x')) as any).buffer[0],
                        y: (p.get(new perc_string('y')) as any).buffer[0]
                    });
                }
            }
        }
        gui.pushCommand('polygon', { x: (x as any).buffer[0], y: (y as any).buffer[0], points: pts });
        return new perc_nil();
    });

    vm.register_foreign('update_image', (x, y, w, h, url) => {
        gui.pushCommand('update_image', {
            x: (x as any).buffer[0],
            y: (y as any).buffer[0],
            w: (w as any).buffer[0],
            h: (h as any).buffer[0],
            url: url.to_string()
        });
        return new perc_nil();
    });

    vm.register_foreign('input', (x, y) => {
        const id = `input_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
        const val = gui.getInput(id + '_val') || "";
        gui.pushCommand('input', { id, x: (x as any).buffer[0], y: (y as any).buffer[0] });
        return new perc_string(val);
    });

    vm.register_foreign('checkbox', (x, y) => {
        const id = `chk_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
        const val = gui.getInput(id + '_val') || false;
        gui.pushCommand('checkbox', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val });
        return new perc_bool(val);
    });

    vm.register_foreign('radio', (x, y) => {
        const id = `rad_${(x as any).buffer[0]}_${(y as any).buffer[0]}`;
        const val = gui.getInput(id + '_val') || false;
        gui.pushCommand('radio', { id, x: (x as any).buffer[0], y: (y as any).buffer[0], val });
        return new perc_bool(val);
    });

    vm.register_foreign('sprite', (x, y, w, h, data) => {
        // data is a list of color maps
        const pixels: any[] = [];
        if (data instanceof perc_list) {
            for (const p of data.elements) {
                if (p instanceof perc_map) {
                    pixels.push({
                        r: (p.get(new perc_string('r')) as any).buffer[0],
                        g: (p.get(new perc_string('g')) as any).buffer[0],
                        b: (p.get(new perc_string('b')) as any).buffer[0]
                    });
                }
            }
        }
        gui.pushCommand('sprite', { x: (x as any).buffer[0], y: (y as any).buffer[0], w: (w as any).buffer[0], h: (h as any).buffer[0], data: pixels });
        return new perc_nil();
    });

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
    
    end_window();
}
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
