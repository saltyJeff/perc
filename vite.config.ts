import peggyLoader from "./vite-peggy-loader"
export default {
    plugins: [
        peggyLoader()
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