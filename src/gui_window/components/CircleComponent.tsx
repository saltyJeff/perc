import { Circle, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getAccessibilityLabel } from "../gui_window_utils";

export const CircleComponent = (props: { circle: Circle & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.circle);

    return (
        <div
            aria-label={getAccessibilityLabel('circle', props.circle, style)}
            style={{
                position: "absolute",
                left: `${props.circle.pos.x - props.circle.radius}px`,
                top: `${props.circle.pos.y - props.circle.radius}px`,
                width: `${props.circle.radius * 2}px`,
                height: `${props.circle.radius * 2}px`
            }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <circle cx="50%" cy="50%" r={props.circle.radius}
                    fill={style.fill()}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                />
            </svg>
        </div>
    );
};
