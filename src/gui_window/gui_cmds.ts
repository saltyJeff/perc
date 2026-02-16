export interface Color {
    r: number, g: number, b: number, a?: number
}
export type Position = { x: number, y: number }

export interface Group {
    type: 'group'
}
export interface EndGroup {
    type: 'end_group'
}
export interface Transform {
    type: 'transform'
    transform?: [number, number, number, // 3x3 transformation matrix
        number, number, number,
        number, number, number]
}
export interface Stroke {
    type: 'stroke'
    stroke?: Color
    strokeWidth?: number
}
export interface Fill {
    type: 'fill'
    fill?: Color
}

export interface Rect {
    type: 'rect'
    pos: Position
    width: number
    height: number
}
export interface Circle {
    type: 'circle'
    pos: Position
    radius: number
}
export interface Line {
    type: 'line'
    p1: Position
    p2: Position
}
export interface Text {
    type: 'text'
    text: string
    pos: Position
    align: string
}
export interface Image {
    type: 'image'
    pos: Position
    width: number
    height: number
    src: string
}
export interface Path {
    type: 'path'
    pos: Position[]
}
export interface Polygon {
    type: 'polygon'
    pos: Position[]
}
export interface Ellipse {
    type: 'ellipse'
    pos: Position
    radius: number
}
export interface Arc {
    type: 'arc'
    pos: Position
    radius: number
    startAngle: number
    endAngle: number
}
export interface Sprite {
    type: 'sprite'
    pos: Position
    width: number
    height: number
    data: Color[]
}
// interactable UI elements need an ID
interface Interactable {
    id: number | string
    val?: any
}
export interface Button extends Interactable {
    type: 'button'
    text: string
    pos: Position
}
export interface Slider extends Interactable {
    type: 'slider'
    pos: Position
    width: number
    height: number
}
export interface Checkbox extends Interactable {
    type: 'checkbox'
    pos: Position
}
export interface Radio extends Interactable {
    type: 'radio'
    pos: Position
    group: string
}
export interface Textbox extends Interactable {
    type: 'textbox'
    pos: Position
    width: number
    height: number
    prompt: string
}
export type GUICommand = Group | EndGroup | Transform | Stroke | Fill | Rect | Circle | Line | Text | Image | Path | Polygon | Ellipse | Arc | Sprite | Button | Slider | Checkbox | Radio | Textbox

// For backwards compatibility or clarity, we can aliases
export type GUIElements = GUICommand
