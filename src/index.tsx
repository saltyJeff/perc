import { VM } from './vm/index';
import { Compiler } from './vm/compiler';
import { GUIManager } from './gui_window/manager';
import { perc_string } from './vm/perc_types';
import { parser } from './lang.grammar';
import { PercCompileError } from './errors';

import './style.css';
import './console/console.css';
import './editor/editor.css';

import { render } from 'solid-js/web';
import { onMount } from 'solid-js';
import { standardBuiltins } from './vm/builtins';
import { createConsoleBuiltins } from './console/builtins';
import { createGuiBuiltins } from './gui_window/builtins';
import { App } from './ui/App';
import { consoleStore } from './console/ConsoleStore';
import { editorStore } from './editor/EditorStore';
import { appStore } from './ui/AppStore';

console.log('PerC IDE initializing...');

const initApp = () => {
    // Initialize Theme
    document.body.classList.add('dark-theme');

    const vm = new VM();
    const gui = new GUIManager();
    gui.setOnClose(() => {
        if (currentRunner) {
            consoleStore.actions.addEntry("GUI Window closed, stopping execution.", 'error');
            stopVM();
        }
    });

    // VM state

    let isPaused = false;
    let isWaitingForInput = false;
    let executionInterval: any = null;
    let currentRunner: Generator | null = null;
    const BATCH_SIZE = 100;

    const updateToolbarState = (state: 'idle' | 'running' | 'paused' | 'input') => {
        let menuState: any = state;
        if (state === 'paused') menuState = 'debugging';
        appStore.setVM(menuState);
    };

    const stopVM = () => {
        isPaused = false;
        isWaitingForInput = false;
        if (executionInterval) clearInterval(executionInterval);
        executionInterval = null;
        currentRunner = null;
        editorStore.enter_idle_mode();
        updateToolbarState('idle');

        vm.reset_state(); // This also resets debugStore in the VM
        gui.resetIntentional();
    };

    const runVM = async () => {
        if (!currentRunner) return;

        isPaused = false;
        updateToolbarState('running');
        editorStore.enter_run_mode();

        return new Promise<void>((resolve) => {
            executionInterval = setInterval(() => {
                for (let i = 0; i < BATCH_SIZE; i++) {
                    const result = currentRunner!.next();
                    // Check if we hit a breakpoint/debugger first
                    if (vm.in_debug_mode && isPaused) {
                        updateToolbarState('paused'); // Ensure UI reflects pause
                        clearInterval(executionInterval);
                        executionInterval = null;
                        resolve();
                        return;
                    }

                    if (result.done) {
                        consoleStore.actions.addEntry("Execution stopped.", 'status');
                        stopVM();
                        resolve();
                        return;
                    }

                    if (vm.is_waiting_for_input) {
                        isWaitingForInput = true;

                        clearInterval(executionInterval);
                        executionInterval = null;
                        updateToolbarState('input');
                        resolve();
                        return;
                    }
                }
            }, 0);
        });
    };

    const handleStep = () => {
        if (!currentRunner) return;
        const result = currentRunner.next();
        if (result.done) {
            stopVM();
        } else {
            updateToolbarState('paused');
        }
    };

    const handleContinue = () => {
        if (isPaused && currentRunner) {
            runVM();
        }
    };

    const handleRun = () => {
        if (isPaused) {
            runVM();
            return;
        }

        // Ensure any previous execution is fully stopped
        stopVM();

        consoleStore.actions.addEntry("Run: Starting execution...", 'status');
        const code = editorStore.getValue();

        try {
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const tree = parser.parse(code);
            const result = compiler.compile(code, tree);

            if (result.errors.length > 0) {
                const firstErr = result.errors[0];
                throw firstErr;
            }

            vm.load_code(result.opcodes);
            currentRunner = vm.run();
            runVM();
        } catch (e: any) {
            console.error(e);
            if (e instanceof PercCompileError && e.location) {
                consoleStore.actions.addEntry(`Build Error: ${e.message} (at ${e.location.start.line}:${e.location.start.column})`, 'error', [e.location.start.offset, e.location.end.offset]);
                editorStore.highlightAndScroll(e.location, 'error');
            } else {
                consoleStore.actions.addEntry(`Build Error: ${e.message}`, 'error');
            }
            stopVM();
        }
    };
    const handleStop = () => {
        consoleStore.actions.addEntry("Stop: Execution halted.", 'status');
        stopVM();
    };

    const handleBuild = () => {
        consoleStore.actions.addEntry("Build: Compiling...", 'status');
        editorStore.clearErrorHighlight();
        const code = editorStore.getValue();

        try {
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const tree = parser.parse(code);
            const result = compiler.compile(code, tree);
            if (result.errors.length > 0) {
                const firstErr = result.errors[0];
                throw firstErr;
            }
            consoleStore.actions.addEntry("Build: No errors found.", 'status');
        } catch (e: any) {
            if (e instanceof PercCompileError && e.location) {
                const msg = e.message;
                consoleStore.actions.addEntry(`Build Error: ${msg} (at ${e.location.start.line}:${e.location.start.column})`, 'error', [e.location.start.offset, e.location.end.offset]);
                editorStore.highlightAndScroll(e.location, 'error');
            } else if (e.location && e.location.start) {
                // Legacy error handling if any
                const loc = e.location.start;
                const msg = e.message.replace(/^Error:\s*/, '');
                consoleStore.actions.addEntry(`Build Error: ${msg} (at ${loc.line}:${loc.column})`, 'error', e.location.end ? [e.location.start.offset, e.location.end.offset] : undefined);
                editorStore.highlightError(loc.line, loc.column);
            } else {
                consoleStore.actions.addEntry(`Build Error: ${e.message}`, 'error');
            }
        }
    };

    const handleConsoleInput = async (input: string) => {
        consoleStore.actions.addEntry(`> ${input}`, 'input');

        if (input.trim()) {
            consoleStore.actions.pushHistory(input);
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
                        consoleStore.actions.addEntry(result.to_string(), 'log');
                    }
                }
            } catch (err: any) {
                if (err instanceof PercCompileError && err.location) {
                    consoleStore.actions.addEntry(`Build Error: ${err.message} (at ${err.location.start.line}:${err.location.start.column})`, 'error', [err.location.start.offset, err.location.end.offset]);
                } else if (err.location) {
                    // Runtime error in repl?
                    consoleStore.actions.addEntry(`Error: ${err.message}`, 'error', [err.location.start.offset, err.location.end.offset]);
                } else {
                    consoleStore.actions.addEntry(`Error: ${err.message}`, 'error');
                }
            }
        }
    };

    const appRoot = document.getElementById('app');
    if (appRoot) {
        render(() => {
            onMount(() => {
                // Helper to get line/col from offset
                const getLineCol = (offset: number) => {
                    const code = editorStore.getValue();
                    let line = 1;
                    let col = 1;
                    for (let i = 0; i < offset && i < code.length; i++) {
                        if (code[i] === '\n') {
                            line++;
                            col = 1;
                        } else {
                            col++;
                        }
                    }
                    return { line, col };
                };

                // Wire VM Events
                vm.set_events({
                    on_error: (msg, location) => {
                        const cleanMsg = msg.replace(/^(Javascript Error|Syntax Error|Error):\s*/i, '');
                        let fmtMsg = `Runtime Error: ${cleanMsg}`;
                        if (location && location[0] !== undefined) {
                            const { line, col } = getLineCol(location[0]);
                            fmtMsg += ` (at ${line}:${col})`;
                        }
                        consoleStore.actions.addEntry(fmtMsg, 'error', location || undefined);
                        stopVM();
                    },
                    on_input_request: (prompt) => {
                        // The VM has already set is_waiting_for_input = true
                        isWaitingForInput = true;
                        consoleStore.actions.addEntry(`Input > ${prompt || ""}`, 'log');
                        consoleStore.actions.addEntry("Type input below and press Enter...", 'status');
                        // We also need to pause/halt the execution loop, which happens in runVM due to wait flag
                        // But runVM loop checks `vm.is_waiting_for_input` which IS true now.
                        updateToolbarState('input');
                    },
                    on_node_eval: (range) => {
                        editorStore.highlightRange(range[0], range[1]);
                    },
                    on_debugger: () => {
                        isPaused = true;
                        updateToolbarState('paused');

                        // Restore debugger pane if it's too small
                        if (appStore.layout.dcSplit < 0.1) {
                            appStore.updateSize('dc', 0.5);
                        }
                        editorStore.enter_debug_mode();
                    },
                    on_state_dump: () => {
                        vm.syncDebugStore();
                    }
                });

                // Register Builtins
                vm.register_builtins(standardBuiltins);
                // Create legacy-like interface for console builtins
                const legacyConsole = {
                    print: (msg: string) => consoleStore.actions.addEntry(msg, 'log'),
                    println: (msg: string) => consoleStore.actions.addEntry(msg, 'log'),
                    error: (msg: string, loc?: any) => consoleStore.actions.addEntry(msg, 'error', loc),
                    status: (msg: string) => consoleStore.actions.addEntry(msg, 'status'),
                    input: (msg: string) => consoleStore.actions.addEntry(msg, 'input'),
                    setTextColor: (color: string) => consoleStore.actions.setTextColor(color),
                    clear: () => consoleStore.actions.clear()
                };
                vm.register_builtins(createConsoleBuiltins(legacyConsole as any, (prompt) => {
                    // Callback from 'input' builtin
                    vm.is_waiting_for_input = true;
                    // We can manually trigger the event handler if we want, or just let runVM loop catch it
                    // The VM loop checks `vm.is_waiting_for_input` *after* instruction execution?
                    // No, the VM `input` was... wait. 
                    // The builtin itself just returns. The VM loop continues.
                    // The builtin needs to set the flag on the VM.
                    // Since we don't have VM in `createConsoleBuiltins`, we do it here.
                    // BUT `input` builtin returns `nil` (placeholder).
                    // We need to tell the VM to pause.
                    // In `vm.run()`, we check `should_yield`.
                    // If we set `is_waiting_for_input` on VM, does `run()` yield?
                    // `vm.run()` does NOT yield on input flag automatically in the current implementation?
                    // Let's check `vm.ts`.
                    // `vm.ts` doesn't seem to check `is_waiting_for_input` in `should_yield` or main loop!
                    // We must force the VM to pause or yielded.
                    // Actually `runVM` checks `vm.is_waiting_for_input`.
                    // So if we set it here, `runVM` will see it in the next iteration.
                    // `runVM` batch loop:
                    // for (...) { next(); if (vm.is_waiting_for_input) ... }
                    // So yes, setting it here is enough.
                    vm.is_waiting_for_input = true;
                    consoleStore.actions.addEntry(`Input > ${prompt || ""}`, 'status');
                    updateToolbarState('input');
                }));
                vm.register_builtins(createGuiBuiltins(gui));

                editorStore.setVariableProvider(() => {
                    return Array.from(vm.get_global_scope().values.keys());
                });
                editorStore.setBuiltins(Array.from(vm.get_foreign_funcs().keys()));

                consoleStore.actions.addEntry("Welcome to PerC IDE v0.1", 'status');
            });

            return <App
                vm={vm}
                console={consoleStore}
                onConsoleInput={handleConsoleInput}
                onRun={handleRun}
                onStop={handleStop}
                onStep={handleStep}
                onContinue={handleContinue}
                onBuild={handleBuild}
                onTheme={(t) => {
                    document.body.classList.remove('dark-theme', 'light-theme', 'contrast-theme');
                    document.body.classList.add(`${t}-theme`);
                    editorStore.setTheme(t);
                }}
                onWrap={(w) => editorStore.setWordWrap(w === 'on')}
                onEditorZoom={(size) => editorStore.setFontSize(size)}
                onDebuggerZoom={(size) => {
                    const el = document.getElementById('debugger-content');
                    if (el) el.style.fontSize = (size * 14 / 100) + 'px';
                }}
                onConsoleZoom={(size) => {
                    const el = document.getElementById('console-output');
                    if (el) el.style.fontSize = (size * 14 / 100) + 'px';
                }}
            />;
        }, appRoot);
    }
};

initApp();
