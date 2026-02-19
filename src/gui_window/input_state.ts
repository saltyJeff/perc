import { createStore } from "solid-js/store";

export const inputState: Record<string, any> = {};

export const [guiState, setGuiState] = createStore<{
    root: any | null,
    width: number,
    height: number,
    mouseX: number,
    mouseY: number,
    showCoords: boolean
}>({
    root: null,
    width: 640,
    height: 480,
    mouseX: 0,
    mouseY: 0,
    showCoords: false
});

export function syncInput(extra?: any) {
    if (window.opener) {
        if (extra) {
            window.opener.postMessage(extra, "*");
        }
        window.opener.postMessage(
            { type: "input_update", state: inputState },
            "*"
        );
    }
}
