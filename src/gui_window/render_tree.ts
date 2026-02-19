import type { GUICommand, Group, Color } from "./gui_cmds";
import { multiplyMatrices } from "./gui_window_utils";

export interface RenderGroup {
    type: 'group';
    transform: number[];
    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
    elements: RenderElement[];
}

export type RenderElement = (Exclude<GUICommand, Group | { type: 'end_group' } | { type: 'transform' } | { type: 'fill' } | { type: 'stroke' }> | RenderGroup) & {
    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
};

export function buildRenderTree(commands: GUICommand[]): RenderGroup {
    const defaultTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const defaultGroup: RenderGroup = {
        type: 'group',
        transform: [...defaultTransform],
        fill: { r: 128, g: 128, b: 128, a: 1 },
        stroke: { r: 0, g: 0, b: 0, a: 1 },
        strokeWidth: 1,
        elements: []
    };

    const stack: RenderGroup[] = [defaultGroup];

    const current = () => stack[stack.length - 1];

    for (const cmd of commands) {
        switch (cmd.type) {
            case 'group':
                const newGroup: RenderGroup = {
                    type: 'group',
                    transform: [...defaultTransform],
                    fill: current().fill,
                    stroke: current().stroke,
                    strokeWidth: current().strokeWidth,
                    elements: []
                };
                current().elements.push(newGroup);
                stack.push(newGroup);
                break;
            case 'end_group':
                if (stack.length > 1) stack.pop();
                break;
            case 'transform':
                if (cmd.transform) {
                    current().transform = multiplyMatrices(current().transform, cmd.transform);
                }
                break;
            case 'fill':
                current().fill = cmd.fill;
                break;
            case 'stroke':
                current().stroke = cmd.stroke;
                if (cmd.strokeWidth !== undefined) current().strokeWidth = cmd.strokeWidth;
                break;
            case 'rect':
            case 'circle':
            case 'line':
            case 'text':
            case 'image':
            case 'sprite':
            case 'polygon':
            case 'button':
            case 'slider':
            case 'checkbox':
            case 'radio':
            case 'textbox':
                const element: RenderElement = {
                    ...cmd,
                    fill: current().fill,
                    stroke: current().stroke,
                    strokeWidth: current().strokeWidth
                } as RenderElement;
                current().elements.push(element);
                break;
            default:
                break;
        }
    }

    return stack[0];
}
