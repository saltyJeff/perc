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
        }
    }
}