import peggyLoader from "./vite-peggy-loader"
import solidPlugin from 'vite-plugin-solid';

export default {
    plugins: [
        peggyLoader(),
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
                manualChunks: {
                    'ace-builds': ['ace-builds'],
                    'jquery': ['jquery'],
                    'snabbdom': ['snabbdom']
                }
            }
        }
    }
}