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
    vm.set_events({
        on_error: (msg) => {
            logToConsole(`Error: ${msg}`, 'error');
            debug.setStatus('Error');
        },
        on_var_update: () => {
            debug.updateVariables(vm.get_current_scope_values());
        },
        on_frame_push: () => {
            debug.updateCallStack(vm.get_call_stack_names());
            debug.updateVariables(vm.get_current_scope_values());
        },
        on_frame_pop: () => {
            debug.updateCallStack(vm.get_call_stack_names());
            debug.updateVariables(vm.get_current_scope_values());
        }
    });

    vm.register_foreign('print', (...args) => {
        const msg = args.map(a => a.to_string()).join(' ');
        logToConsole(msg, 'log');
        return new perc_nil();
    });

    // Expose for debugging/future integration
    (window as any).editor = editor;
    (window as any).debug = debug;
    (window as any).vm = vm;

    // Initial content
    editor.setValue(`// PerC Example Code
init x = 10;
init y = 20;

print(x + y);

function test() {
    return x * y;
}
`);

    // Console / REPL Logic
    const $consoleOut = $('#console-output');
    const logToConsole = (msg: string, type: 'log' | 'error' | 'input' = 'log') => {
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
                // We'll use a trick: execute it, then step it to completion.
                vm.execute(input, parser);
                runVM();
            } catch (err: any) {
                // Errors already logged by on_error event
            }
        }
    });

    const runVM = async () => {
        debug.setStatus('Running...');
        const runner = vm.run();
        let result = runner.next();
        while (!result.done) {
            // In a real app we might want to yield to the main thread
            // but for simple execution we can just loop.
            result = runner.next();
        }
        debug.setStatus('Idle');
    };

    $('#console-clear').on('click', () => {
        $consoleOut.empty();
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
            // Minimal constraints
            if (newDebugWidth > 50 && newDebugWidth < containerWidth - 50) {
                $('#debugger-pane').css('width', newDebugWidth + 'px');
                editor.resize();
            }
        }

        if (isDraggingH) {
            const containerHeight = $('#vertical-container').height() || 0;
            // Calculate height from bottom
            // e.clientY is position from top. 
            // The console pane is at the bottom.
            const newConsoleHeight = containerHeight - (e.clientY - $('#menubar').height()!);

            if (newConsoleHeight > 30 && newConsoleHeight < containerHeight - 50) {
                $('#console-pane').css('height', newConsoleHeight + 'px');
                editor.resize();
            }
        }
    });

    $(document).on('mouseup', () => {
        if (isDraggingV || isDraggingH) {
            isDraggingV = false;
            isDraggingH = false;
            $('body').css('cursor', 'default');
            editor.resize(); // Ensure editor redraws correctly
        }
    });

    // --- Menu & Pane Actions ---

    // Zoom Logic
    const setZoom = (target: string, size: number) => {
        // Clamp 4px (approx 25%) to 42px (300%)
        size = Math.max(4, Math.min(42, size));

        // Update Slider
        $(`input.zoom-slider[data-target="${target}"]`).val(size);

        // Update Reset Text (14px = 100%)
        const percentage = Math.round((size / 14) * 100);
        $(`button.zoom-reset[data-target="${target}"]`).text(percentage + '%');

        // Update Content
        if (target === 'editor') {
            editor.setFontSize(size);
        } else if (target === 'debugger') {
            $('#debugger-content').css('font-size', size + 'px');
        } else if (target === 'console') {
            $('#console-output').css('font-size', size + 'px');
        }
    };

    // Zoom Sliders
    $('input.zoom-slider').on('input', function () {
        const target = $(this).data('target');
        const size = parseInt($(this).val() as string);
        setZoom(target, size);
    });

    // Zoom Buttons
    $('button.zoom-btn').on('click', function () {
        const target = $(this).data('target');
        const isIn = $(this).hasClass('zoom-in');
        const currentVal = parseInt($(`input.zoom-slider[data-target="${target}"]`).val() as string);
        setZoom(target, currentVal + (isIn ? 1 : -1));
    });

    // Zoom Reset
    $('button.zoom-reset').on('click', function () {
        const target = $(this).data('target');
        setZoom(target, 14); // Default
    });

    // Traffic Lights (Minimize/Restore/Maximize)
    const updatePaneButtons = (pane: JQuery) => {
        const isMax = pane.hasClass('maximized');
        const isMin = pane.hasClass('collapsed');
        const isNormal = !isMax && !isMin;

        pane.find('.btn-min').prop('disabled', isMin);
        pane.find('.btn-restore').prop('disabled', isNormal);
        pane.find('.btn-max').prop('disabled', isMax);
    };

    // Initialize button states
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

        // Reset state
        pane.removeClass('maximized collapsed');
        siblings.removeClass('collapsed maximized');
        splitters.show();

        if (action === 'maximize') {
            pane.addClass('maximized');
            siblings.addClass('collapsed');
            splitters.hide();
        } else if (action === 'minimize') {
            pane.addClass('collapsed');
        } else {
            // Restore - already reset above
        }

        // Update buttons for all affected panes
        container.find('.pane').each(function () {
            updatePaneButtons($(this));
        });

        editor.resize();
    });


    $('#btn-run').on('click', () => {
        logToConsole("Run: Starting execution...", 'log');
        const code = editor.getValue();
        try {
            vm.execute(code, parser);
            runVM();
        } catch (err) {
            // Errors handled in events
        }
    });

    $('#btn-build').on('click', () => {
        logToConsole("Build: Compiling...", 'log');
        // Peggy build integration pending
    });

    $('#btn-stop').on('click', () => {
        logToConsole("Stop: Execution halted.", 'log');
    });

    // Editor Options
    let isDark = true;
    $('#btn-theme').on('click', function () {
        isDark = !isDark;

        // Toggle Body Class
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

    // Initial log
    logToConsole("Welcome to PerC IDE v0.1", 'log');
});
