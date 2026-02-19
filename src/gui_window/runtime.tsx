import { reconcile } from "solid-js/store";
import { render } from "solid-js/web";
import { Show } from "solid-js";
import { buildRenderTree } from "./render_tree";
import { guiState, setGuiState, inputState, syncInput } from "./input_state";
import { ElementRenderer } from "./components/ElementRenderer";

window.addEventListener("mousemove", (e) => {
    const root = document.getElementById("gui-window");
    if (root) {
        const rect = root.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        inputState["mouse_x"] = x;
        inputState["mouse_y"] = y;

        // Check if hovering over an interactive element (button, input, etc)
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, input, [data-interactive="true"]');
        const isInside = x >= 0 && x <= guiState.width && y >= 0 && y <= guiState.height;

        setGuiState({
            mouseX: x,
            mouseY: y,
            showCoords: isInside && !isInteractive
        });

        syncInput();
    }
});
window.addEventListener("mousedown", () => {
    inputState["mouse_down"] = true;
    syncInput();
});
window.addEventListener("mouseup", () => {
    inputState["mouse_down"] = false;
    syncInput();
});

window.addEventListener("message", (event) => {
    if (event.data && event.data.type === 'render_batch') {
        const root = buildRenderTree(event.data.batch);
        setGuiState("root", reconcile(root));
    } else if (event.data && event.data.type === 'resize_window') {
        setGuiState("width", event.data.width);
        setGuiState("height", event.data.height);

        const chromeWidth = window.outerWidth - window.innerWidth;
        const chromeHeight = window.outerHeight - window.innerHeight;
        window.resizeTo(event.data.width + chromeWidth, event.data.height + chromeHeight + 40);
    }
});

const App = () => {
    return (
        <>
            <div id="gui-window" style={{
                width: `${guiState.width}px`,
                height: `${guiState.height}px`,
                position: "relative",
                margin: "auto",
                "margin-top": "auto",
                "margin-bottom": "10px",
                background: "white",
                "box-shadow": "0 0 40px rgba(0,0,0,0.8)",
                "flex-shrink": 0,
                cursor: guiState.showCoords ? "crosshair" : "default"
            }}>
                <Show when={guiState.root}>
                    <ElementRenderer element={guiState.root!} />
                </Show>

                <Show when={guiState.showCoords}>
                    <div style={{
                        position: "absolute",
                        left: `${guiState.mouseX + 12}px`,
                        top: `${guiState.mouseY + 12}px`,
                        background: "rgba(0,0,0,0.75)",
                        color: "white",
                        padding: "2px 6px",
                        "border-radius": "3px",
                        "font-size": "11px",
                        "font-family": "monospace",
                        "pointer-events": "none",
                        "z-index": 10000,
                        "white-space": "nowrap",
                        "box-shadow": "2px 2px 4px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.2)"
                    }}>
                        {guiState.mouseX}, {guiState.mouseY}
                    </div>
                </Show>
            </div>
            <div style={{
                color: "#888",
                "font-size": "12px",
                "margin-bottom": "auto",
                "padding-bottom": "20px",
                "text-align": "center",
                "max-width": "80%",
                "font-style": "italic"
            }}>
                Screen not updating? Try minimizing this window so that both the IDE window and this window are visible.
            </div>
        </>
    );
};

render(() => <App />, document.getElementById("gui-root")!);
