import { createSignal } from "solid-js";
import { Button, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getHoverColor } from "../gui_window_utils";
import { syncInput } from "../input_state";

export const ButtonComponent = (props: { button: Button & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.button);

    const hoverFill = () => {
        if (props.button.fill) {
            return getHoverColor(props.button.fill, 15);
        }
        return style.fill();
    };

    const [hover, setHover] = createSignal(false);

    return (
        <button
            style={{
                position: "absolute",
                left: `${props.button.pos.x}px`,
                top: `${props.button.pos.y}px`,
                width: "100px",
                height: "30px",
                border: `2px solid ${style.stroke()}`,
                color: style.stroke(),
                "background-color": hover() ? hoverFill() : style.fill(),
                "font-weight": "bold",
                "border-radius": "4px",
                cursor: "pointer",
                "box-shadow": "2px 2px 0px rgba(0,0,0,0.2)",
                transition: "background-color 0.2s"
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => {
                syncInput({ type: "gui_event", id: props.button.id });
            }}
            aria-label={props.button.text}
        >
            {props.button.text}
        </button>
    );
};
