import { createContext, useContext, createMemo } from "solid-js";
import { Color } from "./gui_cmds";
import { toCSSColor } from "./gui_window_utils";

export interface StyleContextValue {
    fill: string;
    stroke: string;
    strokeWidth: number;
}

export const StyleContext = createContext<StyleContextValue>({ fill: "gray", stroke: "black", strokeWidth: 1 });

export function useResolvedStyle(props: { fill?: Color, stroke?: Color, strokeWidth?: number }) {
    const context = useContext(StyleContext);

    const fill = createMemo(() => props.fill ? toCSSColor(props.fill) : context.fill);
    const stroke = createMemo(() => props.stroke ? toCSSColor(props.stroke) : context.stroke);
    const strokeWidth = createMemo(() => props.strokeWidth !== undefined ? props.strokeWidth : context.strokeWidth);

    return { fill, stroke, strokeWidth };
}

export type StyleProps = { fill?: Color, stroke?: Color, strokeWidth?: number }
