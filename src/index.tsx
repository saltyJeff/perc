import $ from 'jquery';
import { Editor } from './editor/index';
import { Debugger } from './debugger/index';
import { Console } from './console/index';
import { VM } from './vm/index';
import { Compiler } from './vm/compiler';
import { GUIManager } from './gui_window/manager';
import { perc_string } from './vm/perc_types';
import { parser } from './lang.grammar';

import './style.css';
import './console/console.css';
import './editor/editor.css';
import './debugger/debugger.css';
import './ui/perc_value.css';
import { render } from 'solid-js/web';
import { onMount } from 'solid-js';
import { standardBuiltins } from './vm/builtins';
import { createConsoleBuiltins } from './console/builtins';
import { createGuiBuiltins } from './gui_window/builtins';
import { App } from './ui/App';

console.log('PerC IDE initializing...');

$(() => {
    // Initialize Theme
    $('body').addClass('dark-theme');

    let editor: Editor;
    let debug: Debugger;
    let appConsole: Console;
    const vm = new VM();
    const gui = new GUIManager();

    // Wiring VM to Debugger State
    let currentRunner: Generator<void, void, void> | null = null;
    let isRunning = false;
    let isPaused = false;
    let isWaitingForInput = false;
    let executionInterval: any = null;

    const updateToolbarState = (state: 'idle' | 'running' | 'paused') => {
        if ((window as any).setMenuState) {
            (window as any).setMenuState(state === 'paused' ? 'debugging' : state);
        }
    };

    const stopVM = () => {
        isRunning = false;
        isPaused = false;
        isWaitingForInput = false;
        if (executionInterval) clearInterval(executionInterval);
        executionInterval = null;
        currentRunner = null;
        if (editor) editor.enter_idle_mode();
        updateToolbarState('idle');
        if (debug) {
            debug.setStatus('Idle');
            debug.clearCallStack();
            debug.clearVariables();
            debug.updateCurrentExpression(null);
        }
        if ((window as any).setPaneState) (window as any).setPaneState('debugger', 'min');
    };

    const runVM = async () => {
        if (!currentRunner) return;

        return new Promise<void>((resolve) => {
            isRunning = true;
            isPaused = false;
            // Don't clear isWaitingForInput here if we are resuming from input
            if (!vm.is_waiting_for_input) isWaitingForInput = false;

            if (editor) editor.enter_run_mode();
            updateToolbarState('running');
            if (debug) debug.setStatus('Running...');
            if ((window as any).setPaneState) (window as any).setPaneState('debugger', 'min');

            executionInterval = setInterval(() => {
                if (!isRunning || isPaused || isWaitingForInput) {
                    clearInterval(executionInterval);
                    if (!isRunning) resolve();
                    return;
                }

                if (vm.is_waiting_for_input) {
                    isWaitingForInput = true;
                    if (debug) debug.setStatus('Waiting for Input...');
                    clearInterval(executionInterval);
                    return;
                }

                const BATCH_SIZE = 100;
                for (let i = 0; i < BATCH_SIZE; i++) {
                    const result = currentRunner!.next();
                    if (result.done) {
                        if (appConsole) appConsole.status("Execution stopped.");
                        stopVM();
                        resolve();
                        return;
                    }

                    if (vm.is_waiting_for_input) {
                        isWaitingForInput = true;
                        if (debug) debug.setStatus('Waiting for Input...');
                        return;
                    }

                    if (isPaused) return;
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
            if (debug) debug.setStatus('Paused (Breakpoint)');
            updateToolbarState('paused');
        }
    };

    const handleRun = () => {
        if (isPaused) {
            runVM();
            return;
        }

        if (appConsole) appConsole.status("Run: Starting execution...");
        if (!editor) return;
        const code = editor.getValue();
        try {
            gui.resetIntentional();
            vm.execute(code, parser);
            vm.in_debug_mode = false;
            currentRunner = vm.run();
            runVM();
        } catch (err: any) {
            if (err.location) {
                const start = err.location.start;
                const end = err.location.end;
                if (appConsole) appConsole.error(err.message, [start.offset, end.offset]);
                editor.highlightError(start.line, start.column);
            } else {
                if (appConsole) appConsole.error(`Parse Error: ${err.message}`);
                console.error(err)
            }
        }
    };

    const handleStop = () => {
        if (appConsole) appConsole.status("Stop: Execution halted.");
        stopVM();
    };

    const handleStep = () => {
        stepVM();
    };

    const handleContinue = () => {
        vm.in_debug_mode = false;
        if ((window as any).setPaneState) (window as any).setPaneState('debugger', 'min');
        runVM();
    };

    const handleBuild = () => {
        if (appConsole) appConsole.status("Build: Compiling...");
        if (editor) editor.clearErrorHighlight();
        if (!editor) return;
        const code = editor.getValue();
        try {
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const tree = parser.parse(code);
            compiler.compile(code, tree);
            if (appConsole) appConsole.status("Build: No errors found.");
        } catch (e: any) {
            const loc = e.location ? e.location.start : null;
            if (loc) {
                const msg = e.message.replace(/^Error:\s*/, '');
                if (appConsole) appConsole.error(`Build Error: ${msg}`, e.location ? [e.location.start.offset, e.location.end.offset] : null);
                editor.highlightError(loc.line, loc.column);
            } else {
                if (appConsole) appConsole.error(`Build Error: ${e.message}`);
            }
        }
    };


    // Mount Solid App
    const appRoot = document.getElementById('app');
    if (appRoot) {
        render(() => {
            onMount(() => {
                // Initialize legacy components now that DOM is ready
                editor = new Editor('editor');
                debug = new Debugger('debugger-content');
                appConsole = new Console('console-output', 'repl-input');

                (window as any).editor = editor;
                (window as any).debug = debug;
                (window as any).vm = vm;
                (window as any).appConsole = appConsole;

                // Wire VM Events
                vm.set_events({
                    on_error: (msg, location) => {
                        const cleanMsg = msg.replace(/^(Javascript Error|Syntax Error|Error):\s*/i, '');
                        appConsole.error(cleanMsg, location);
                        debug.setStatus('Error');
                        stopVM();
                    },
                    on_input_request: (prompt) => {
                        appConsole.print(prompt || "Input required:");
                        appConsole.print("Type input below and press Enter...");
                        appConsole.focusInput();
                    },
                    on_var_update: (name, value, range) => {
                        debug.updateVariable(name, value, range);
                    },
                    on_frame_push: (frame) => {
                        debug.pushFrame(frame.name, frame.args);
                        debug.updateTopFrameVariables(vm.get_current_scope_values());
                    },
                    on_frame_pop: () => {
                        debug.popFrame();
                        debug.updateTopFrameVariables(vm.get_current_scope_values());
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
                        if ((window as any).setPaneState) (window as any).setPaneState('debugger', 'restore');
                        editor.enter_debug_mode();
                    },
                    on_state_dump: () => {
                        debug.clearCallStack();
                        const frames = vm.get_frames();
                        frames.forEach(f => {
                            debug.pushFrame(f.name, f.args);
                            if (f.scope) {
                                const vars = vm.get_scope_variables(f.scope);
                                debug.updateTopFrameVariables(vars);
                            }
                        });
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

                // Initial content
                editor.setValue(`// PerC GUI Kitchen Sink
init x = 100;
init y = 100;
init msg = "Click me!";
init val = 50;

while(true) then {
    window(800, 600);
    
    fill(rgb(255, 255, 255));
    rect(0, 0, 800, 600);
    
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
                        appConsole.input(`> ${input}`);
                        $(e.target).val('');

                        if (input.trim()) {
                            appConsole.pushHistory(input);
                        }

                        if (isWaitingForInput && currentRunner) {
                            vm.resume_with_input(new perc_string(input));
                            isWaitingForInput = false;
                            runVM();
                            return;
                        }

                        if (input.trim()) {
                            try {
                                vm.execute_repl(input, parser);
                                currentRunner = vm.run();
                                await runVM();

                                if (vm.stack.length > 0) {
                                    const result = vm.stack.pop();
                                    if (result) {
                                        appConsole.print(result.to_string());
                                    }
                                }
                            } catch (err: any) {
                                if (err.location) {
                                    appConsole.error(err.message, [err.location.start.offset, err.location.end.offset]);
                                } else {
                                    appConsole.error(err.message);
                                }
                            }
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const currentInput = $(e.target).val() as string;
                        const historyCmd = appConsole.navigateHistory('up', currentInput);
                        if (historyCmd !== null) $(e.target).val(historyCmd);
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const currentInput = $(e.target).val() as string;
                        const historyCmd = appConsole.navigateHistory('down', currentInput);
                        if (historyCmd !== null) $(e.target).val(historyCmd);
                    }
                });

                editor.setVariableProvider(() => {
                    return Array.from(vm.get_global_scope().values.keys());
                });

                $('#console-clear').on('click', () => {
                    appConsole.clear();
                });

                debug.onVariableHover = (range) => {
                    if (range) {
                        editor.highlightVariableDefinition(range[0], range[1]);
                    } else {
                        editor.clearVariableDefinitionHighlight();
                    }
                };

                appConsole.status("Welcome to PerC IDE v0.1");
            });

            return <App
                onRun={handleRun}
                onStop={handleStop}
                onStep={handleStep}
                onContinue={handleContinue}
                onBuild={handleBuild}
                onTheme={(t) => {
                    const isDark = t === 'dark';
                    $('body').toggleClass('dark-theme', isDark).toggleClass('light-theme', !isDark);
                    if (editor) editor.setTheme(isDark ? 'dark' : 'light');
                }}
                onWrap={(w) => editor && editor.setWordWrap(w === 'on')}
                onEditorZoom={(size) => editor.setFontSize(size)}
                onDebuggerZoom={(size) => $('#debugger-content').css('font-size', (size * 14 / 100) + 'px')}
                onConsoleZoom={(size) => $('#console-output').css('font-size', (size * 14 / 100) + 'px')}
            />;
        }, appRoot);
    }
});
