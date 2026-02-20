import { Slider, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { inputState, syncInput } from "../input_state";

export const SliderComponent = (props: { slider: Slider & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.slider);

    return (
        <input type="range" min="0" max="100"
            value={(props.slider as any).val || 0}
            aria-label={props.slider.label || "Slider"}
            style={{
                position: "absolute",
                left: `${props.slider.pos.x}px`,
                top: `${props.slider.pos.y}px`,
                width: `${props.slider.width}px`,
                margin: "0",
                "accent-color": style.fill()
            }}
            onInput={(e) => {
                inputState[props.slider.id + "_val"] = parseFloat(e.currentTarget.value);
                syncInput();
            }}
        />
    );
};
