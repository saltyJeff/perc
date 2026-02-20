import { defineConfig } from 'electron-vite';
import { resolve } from 'path';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
    main: {
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'electron/main.js')
                }
            }
        }
    },
    preload: {
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'electron/preload.js')
                }
            }
        }
    },
    renderer: {
        root: '.',
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    gui: resolve(__dirname, 'gui.html')
                },
                output: {
                    manualChunks(id: string) {
                        if (id.includes('node_modules')) {
                            if (id.includes('codemirror') || id.includes('@codemirror') || id.includes('@lezer')) {
                                return 'codemirror';
                            }
                            if (id.includes('solid-js')) {
                                return 'solid';
                            }
                            return 'vendor';
                        }
                    }
                }
            }
        },
        plugins: [solidPlugin()]
    }
});
