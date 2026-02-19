import { VM } from './vm/index';
import { Compiler } from './vm/compiler';
import { GUIManager } from './gui_window/manager';
import { perc_string } from './vm/perc_types';
import { parser } from './lang.grammar';
import { PercCompileError } from './errors';

import './style.css';
import './console/console.css';
import './editor/editor.css';
import './debugger/debugger.css';
import { render } from 'solid-js/web';
import { onMount } from 'solid-js';
import { standardBuiltins } from './vm/builtins';
import { createConsoleBuiltins } from './console/builtins';
import { createGuiBuiltins } from './gui_window/builtins';
import { App } from './ui/App';
import { createConsoleStore } from './console/ConsoleStore';
import { editorStore } from './editor/EditorStore';

console.log('PerC IDE initializing...');

const initApp = () => {
    // Initialize Theme
    document.body.classList.add('dark-theme');

    const vm = new VM();
    const [consoleState, consoleActions] = createConsoleStore();
    const gui = new GUIManager();

    // VM state

    let isPaused = false;
    let isWaitingForInput = false;
    let executionInterval: any = null;
    let currentRunner: Generator | null = null;
    const BATCH_SIZE = 100;

    const updateToolbarState = (state: 'idle' | 'running' | 'paused' | 'input') => {
        let menuState: string = state;
        if (state === 'paused') menuState = 'debugging';
        if ((window as any).setMenuState) (window as any).setMenuState(menuState);
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
                    if (result.done) {
                        consoleActions.addEntry("Execution stopped.", 'status');
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

        consoleActions.addEntry("Run: Starting execution...", 'status');
        const code = editorStore.getValue();

        try {
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const tree = parser.parse(code);
            const opcodes = compiler.compile(code, tree);

            vm.load_code(opcodes);
            currentRunner = vm.run();
            runVM();
        } catch (e: any) {
            console.error(e);
            if (e instanceof PercCompileError && e.location) {
                consoleActions.addEntry(`Run Error: ${e.message} (line ${e.location.start.line}:${e.location.start.column})`, 'error', [e.location.start.offset, e.location.end.offset]);
                editorStore.highlightAndScroll(e.location, 'error');
            } else {
                consoleActions.addEntry(`Run Error: ${e.message}`, 'error');
            }
            stopVM();
        }
    };
    const handleStop = () => {
        consoleActions.addEntry("Stop: Execution halted.", 'status');
        stopVM();
    };

    const handleBuild = () => {
        consoleActions.addEntry("Build: Compiling...", 'status');
        editorStore.clearErrorHighlight();
        const code = editorStore.getValue();

        try {
            const compiler = new Compiler(Array.from(vm.get_foreign_funcs().keys()));
            const tree = parser.parse(code);
            compiler.compile(code, tree);
            consoleActions.addEntry("Build: No errors found.", 'status');
        } catch (e: any) {
            if (e instanceof PercCompileError && e.location) {
                const msg = e.message;
                consoleActions.addEntry(`Build Error: ${msg} (line ${e.location.start.line}:${e.location.start.column})`, 'error', [e.location.start.offset, e.location.end.offset]);
                editorStore.highlightAndScroll(e.location, 'error');
            } else if (e.location && e.location.start) {
                // Legacy error handling if any
                const loc = e.location.start;
                const msg = e.message.replace(/^Error:\s*/, '');
                consoleActions.addEntry(`Build Error: ${msg}`, 'error', e.location.end ? [e.location.start.offset, e.location.end.offset] : undefined);
                editorStore.highlightError(loc.line, loc.column);
            } else {
                consoleActions.addEntry(`Build Error: ${e.message}`, 'error');
            }
        }
    };

    const handleConsoleInput = async (input: string) => {
        consoleActions.addEntry(`> ${input}`, 'input');

        if (input.trim()) {
            consoleActions.pushHistory(input);
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
                        consoleActions.addEntry(result.to_string(), 'log');
                    }
                }
            } catch (err: any) {
                if (err instanceof PercCompileError && err.location) {
                    consoleActions.addEntry(`${err.message} (line ${err.location.start.line}:${err.location.start.column})`, 'error', [err.location.start.offset, err.location.end.offset]);
                } else if (err.location) {
                    consoleActions.addEntry(err.message, 'error', [err.location.start.offset, err.location.end.offset]);
                } else {
                    consoleActions.addEntry(err.message, 'error');
                }
            }
        }
    };

    const appRoot = document.getElementById('app');
    if (appRoot) {
        render(() => {
            onMount(() => {
                // Wire VM Events
                vm.set_events({
                    on_error: (msg, location) => {
                        const cleanMsg = msg.replace(/^(Javascript Error|Syntax Error|Error):\s*/i, '');
                        consoleActions.addEntry(cleanMsg, 'error', location || undefined);
                        stopVM();
                    },
                    on_input_request: (prompt) => {
                        consoleActions.addEntry(prompt || "Input required:", 'log');
                        consoleActions.addEntry("Type input below and press Enter...", 'log');
                    },
                    on_node_eval: (range) => {
                        editorStore.highlightRange(range[0], range[1]);
                    },
                    on_debugger: () => {
                        isPaused = true;
                        updateToolbarState('paused');
                        if ((window as any).setPaneState) (window as any).setPaneState('debugger', 'restore');
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
                    print: (msg: string) => consoleActions.addEntry(msg, 'log'),
                    println: (msg: string) => consoleActions.addEntry(msg, 'log'),
                    error: (msg: string, loc?: any) => consoleActions.addEntry(msg, 'error', loc),
                    status: (msg: string) => consoleActions.addEntry(msg, 'status'),
                    input: (msg: string) => consoleActions.addEntry(msg, 'input'),
                    setTextColor: (color: string) => consoleActions.setTextColor(color),
                    clear: () => consoleActions.clear()
                };
                vm.register_builtins(createConsoleBuiltins(legacyConsole as any));
                vm.register_builtins(createGuiBuiltins(gui));

                editorStore.setVariableProvider(() => {
                    return Array.from(vm.get_global_scope().values.keys());
                });
                editorStore.setBuiltins(Array.from(vm.get_foreign_funcs().keys()));

                consoleActions.addEntry("Welcome to PerC IDE v0.1", 'status');
            });

            return <App
                vm={vm}
                consoleState={consoleState}
                onConsoleClear={() => consoleActions.clear()}
                onConsoleInput={handleConsoleInput}
                onConsoleNavigateHistory={(dir, curr) => consoleActions.navigateHistory(dir, curr)}
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
