import { Checkbox, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { inputState, syncInput } from "../input_state";

export const CheckboxComponent = (props: { checkbox: Checkbox & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.checkbox);

    return (
        <input type="checkbox"
            checked={(props.checkbox as any).val || false}
            style={{
                position: "absolute",
                left: `${props.checkbox.pos.x}px`,
                top: `${props.checkbox.pos.y}px`,
                width: "20px",
                height: "20px",
                margin: "0",
                "accent-color": style.fill()
            }}
            onChange={(e) => {
                inputState[props.checkbox.id + "_val"] = e.currentTarget.checked;
                syncInput();
            }}
        />
    );
};
