import { Image, Color } from "../gui_cmds";
import { useResolvedStyle } from "../style_context";
import { getAccessibilityLabel } from "../gui_window_utils";

export const ImageComponent = (props: { image: Image & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const style = useResolvedStyle(props.image); // Assuming style is needed for getAccessibilityLabel
    return (
        <div
            aria-label={getAccessibilityLabel('image', props.image, style)}
            style={{
                position: "absolute",
                left: `${props.image.pos.x}px`,
                top: `${props.image.pos.y}px`,
                width: `${props.image.width}px`,
                height: `${props.image.height}px`,
            }}
        >
            <img src={props.image.src} style={{
                width: "100%", // Image fills the div
                height: "100%", // Image fills the div
                "image-rendering": "pixelated"
            }} />
        </div>
    );
};
