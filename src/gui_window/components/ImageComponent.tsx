import { Image, Color } from "../gui_cmds";

export const ImageComponent = (props: { image: Image & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    return (
        <img src={props.image.src} style={{
            position: "absolute",
            left: `${props.image.pos.x}px`,
            top: `${props.image.pos.y}px`,
            width: `${props.image.width}px`,
            height: `${props.image.height}px`,
            "image-rendering": "pixelated"
        }} />
    );
};
