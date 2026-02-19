import { createMemo } from "solid-js";
import { Sprite, Color } from "../gui_cmds";

const spriteCache = new Map<string, string>();
function generateSpriteDataUrl(pixels: Color[], w: number, h: number): string {
    const key = `${w}x${h}:${JSON.stringify(pixels)}`;
    if (spriteCache.has(key)) return spriteCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.createImageData(w, h);

    for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        const idx = i * 4;
        imgData.data[idx] = p.r;
        imgData.data[idx + 1] = p.g;
        imgData.data[idx + 2] = p.b;
        imgData.data[idx + 3] = (p.a !== undefined ? p.a : 1) * 255;
    }

    ctx.putImageData(imgData, 0, 0);
    const url = canvas.toDataURL();

    if (spriteCache.size >= 50) {
        spriteCache.delete(spriteCache.keys().next().value!);
    }
    spriteCache.set(key, url);
    return url;
}

export const SpriteComponent = (props: { sprite: Sprite & { fill?: Color, stroke?: Color, strokeWidth?: number } }) => {
    const url = createMemo(() => generateSpriteDataUrl(props.sprite.data, props.sprite.width, props.sprite.height));

    return (
        <img src={url()} style={{
            position: "absolute",
            left: `${props.sprite.pos.x}px`,
            top: `${props.sprite.pos.y}px`,
            width: `${props.sprite.width}px`,
            height: `${props.sprite.height}px`,
            "image-rendering": "pixelated"
        }} />
    );
};
