import { useContext, For } from "solid-js";
import { StyleContext } from "../style_context";
import { RenderGroup } from "../render_tree";
import { toCSSColor, toCSSMatrix } from "../gui_window_utils";
import { ElementRenderer } from "./ElementRenderer";

export const GroupComponent = (props: { group: RenderGroup }) => {
    const parentStyle = useContext(StyleContext);

    const style = () => ({
        fill: props.group.fill ? toCSSColor(props.group.fill) : parentStyle.fill,
        stroke: props.group.stroke ? toCSSColor(props.group.stroke) : parentStyle.stroke,
        strokeWidth: props.group.strokeWidth !== undefined ? props.group.strokeWidth : parentStyle.strokeWidth
    });

    return (
        <StyleContext.Provider value={style()}>
            <div style={{
                position: "absolute",
                top: "0px",
                left: "0px",
                width: "0px",
                height: "0px",
                overflow: "visible",
                transform: toCSSMatrix(props.group.transform),
                "transform-origin": "top left",
                color: style().fill
            }}>
                <For each={props.group.elements}>
                    {(el) => <ElementRenderer element={el} />}
                </For>
            </div>
        </StyleContext.Provider>
    );
};
