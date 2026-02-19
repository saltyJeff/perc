import { Textbox, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { inputState, syncInput } from "../input_state";

export const TextboxComponent = (props: { textbox: Textbox & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.textbox);

    return (
        <input type="text"
            value={inputState[props.textbox.id + "_val"] || ""}
            style={{
                position: "absolute",
                left: `${props.textbox.pos.x}px`,
                top: `${props.textbox.pos.y}px`,
                width: `${props.textbox.width}px`,
                height: `${props.textbox.height}px`,
                border: `2px solid ${style.stroke()}`,
                color: style.stroke(),
                "background-color": "white",
                "border-radius": "4px",
                outline: inputState["focused_textbox"] === props.textbox.id ? `2px solid ${style.stroke()}` : "none"
            }}
            onInput={(e) => {
                inputState[props.textbox.id + "_val"] = e.currentTarget.value;
                syncInput();
            }}
            onFocus={() => {
                inputState["focused_textbox"] = props.textbox.id;
                syncInput();
            }}
            onBlur={() => {
                if (inputState["focused_textbox"] === props.textbox.id) {
                    inputState["focused_textbox"] = null;
                    syncInput();
                }
            }}
        />
    );
};
