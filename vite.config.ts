import { readFileSync } from 'node:fs';
import { lezer } from "@lezer/generator/rollup";
import solidPlugin from 'vite-plugin-solid';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
    plugins: [
        lezer(),
        solidPlugin(),
    ],
    define: {
        __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    base: process.env.BUILD_TARGET === 'github-pages' ? '/perc/' : './',
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