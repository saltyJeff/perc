import { Rect, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";

export const RectComponent = (props: { rect: Rect & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.rect);

    return (
        <div style={{
            position: "absolute",
            left: `${props.rect.pos.x}px`,
            top: `${props.rect.pos.y}px`,
            width: `${props.rect.width}px`,
            height: `${props.rect.height}px`
        }}>
            <svg width="100%" height="100%" style={{ overflow: "visible", "pointer-events": "none" }}>
                <rect x="0" y="0" width={props.rect.width} height={props.rect.height}
                    fill={style.fill()}
                    stroke={style.stroke()}
                    stroke-width={style.strokeWidth()}
                />
            </svg>
        </div>
    );
};
