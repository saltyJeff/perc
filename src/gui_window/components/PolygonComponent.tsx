import { createMemo, Show } from "solid-js";
import { Color, Position } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getAccessibilityLabel } from "../gui_window_utils";

export const PolygonComponent = (props: { polygon: { fill?: Color, stroke?: Color, strokeWidth?: number, pos: Position[] } }) => {
    const style = useResolvedStyle(props.polygon);

    const bounds = createMemo(() => {
        if (!props.polygon.pos || props.polygon.pos.length === 0) return null;
        const xs = props.polygon.pos.map(p => p.x);
        const ys = props.polygon.pos.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const pointsStr = props.polygon.pos.map(p => `${p.x - minX},${p.y - minY}`).join(" ");
        return { minX, minY, w: maxX - minX, h: maxY - minY, pointsStr };
    });

    return (
        <Show when={bounds()}>
            <div
                aria-label={getAccessibilityLabel('polygon', props.polygon, style)}
                style={{
                    position: "absolute",
                    left: `${bounds()!.minX}px`,
                    top: `${bounds()!.minY}px`,
                    width: `${bounds()!.w}px`,
                    height: `${bounds()!.h}px`
                }}>
                <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                    <polygon points={bounds()!.pointsStr}
                        fill={style.fill()}
                        stroke={style.stroke()}
                        stroke-width={style.strokeWidth()}
                    />
                </svg>
            </div>
        </Show>
    );
};
