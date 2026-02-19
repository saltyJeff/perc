import { Line, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";

export const LineComponent = (props: { line: Line & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.line);

    const minX = Math.min(props.line.p1.x, props.line.p2.x) - style.strokeWidth();
    const minY = Math.min(props.line.p1.y, props.line.p2.y) - style.strokeWidth();
    const maxX = Math.max(props.line.p1.x, props.line.p2.x) + style.strokeWidth();
    const maxY = Math.max(props.line.p1.y, props.line.p2.y) + style.strokeWidth();
    const w = maxX - minX;
    const h = maxY - minY;

    return (
        <div style={{
            position: "absolute",
            left: `${minX}px`,
            top: `${minY}px`,
            width: `${w}px`,
            height: `${h}px`
        }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <line x1={props.line.p1.x - minX} y1={props.line.p1.y - minY}
                    x2={props.line.p2.x - minX} y2={props.line.p2.y - minY}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                    stroke-linecap="round"
                />
            </svg>
        </div>
    );
};
