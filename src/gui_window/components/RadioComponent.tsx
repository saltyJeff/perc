import { Radio, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { inputState, syncInput } from "../input_state";

export const RadioComponent = (props: { radio: Radio & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.radio);

    return (
        <input type="radio"
            checked={(props.radio as any).val || false}
            name={props.radio.group}
            style={{
                position: "absolute",
                left: `${props.radio.pos.x}px`,
                top: `${props.radio.pos.y}px`,
                margin: "0",
                "accent-color": style.fill()
            }}
            onChange={(e) => {
                if (e.currentTarget.checked) {
                    // Clear other radio buttons in the same group in inputState
                    const prefix = `rad_${props.radio.group}_`;
                    for (const key in inputState) {
                        if (key.startsWith(prefix) && key.endsWith("_val")) {
                            inputState[key] = false;
                        }
                    }
                    inputState[props.radio.id + "_val"] = true;
                    syncInput({ type: "gui_event", id: props.radio.id });
                }
            }}
        />
    );
};
