import { Text, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getAccessibilityLabel } from "../gui_window_utils";

export const TextComponent = (props: { text: Text & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.text);
    const align = props.text.align || 'left';
    return (
        <div
            aria-label={getAccessibilityLabel('text', props.text, style)}
            style={{
                position: "absolute",
                left: `${props.text.pos.x}px`,
                top: `${props.text.pos.y}px`,
                font: "14px sans-serif",
                "white-space": "pre",
                color: style.fill(),
                "text-align": align as CanvasTextAlign,
                transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, 0)`
            }}>
            {props.text.text}
        </div>
    );
};
