import { Line, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getAccessibilityLabel } from "../gui_window_utils";

export const LineComponent = (props: { line: Line & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.line);

    const minXForSvg = Math.min(props.line.p1.x, props.line.p2.x) - style.strokeWidth();
    const minYForSvg = Math.min(props.line.p1.y, props.line.p2.y) - style.strokeWidth();

    return (
        <div
            aria-label={getAccessibilityLabel('line', props.line, style)}
            style={{
                position: "absolute",
                left: `${Math.min(props.line.p1.x, props.line.p2.x)}px`,
                top: `${Math.min(props.line.p1.y, props.line.p2.y)}px`,
                width: `${Math.abs(props.line.p1.x - props.line.p2.x)}px`,
                height: `${Math.abs(props.line.p1.y - props.line.p2.y)}px`
            }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <line x1={props.line.p1.x - minXForSvg} y1={props.line.p1.y - minYForSvg}
                    x2={props.line.p2.x - minXForSvg} y2={props.line.p2.y - minYForSvg}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                    stroke-linecap="round"
                />
            </svg>
        </div>
    );
};
