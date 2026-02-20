import { lezer } from "@lezer/generator/rollup";
import solidPlugin from 'vite-plugin-solid';

export default {
    plugins: [
        lezer(),
        solidPlugin(),
    ],
    build: {
        target: "es2020",
        rollupOptions: {
            input: {
                main: 'index.html',
                gui: 'gui.html'
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
    }
}