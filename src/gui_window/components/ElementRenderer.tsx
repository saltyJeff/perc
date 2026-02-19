import { Switch, Match } from "solid-js";
import { Rect, Circle, Line, Text, Image, Button, Slider, Checkbox, Radio, Textbox } from "../gui_cmds";
import { RenderElement, RenderGroup } from "../render_tree";
import { StyleProps } from "../style_context";
import { GroupComponent } from "./GroupComponent";
import { RectComponent } from "./RectComponent";
import { CircleComponent } from "./CircleComponent";
import { LineComponent } from "./LineComponent";
import { TextComponent } from "./TextComponent";
import { ImageComponent } from "./ImageComponent";
import { SpriteComponent } from "./SpriteComponent";
import { PolygonComponent } from "./PolygonComponent";
import { ButtonComponent } from "./ButtonComponent";
import { SliderComponent } from "./SliderComponent";
import { CheckboxComponent } from "./CheckboxComponent";
import { RadioComponent } from "./RadioComponent";
import { TextboxComponent } from "./TextboxComponent";

export const ElementRenderer = (props: { element: RenderElement }) => {
    return (
        <Switch>
            <Match when={props.element.type === 'group'}>
                <GroupComponent group={props.element as RenderGroup} />
            </Match>
            <Match when={props.element.type === 'rect'}>
                <RectComponent rect={props.element as Rect & StyleProps} />
            </Match>
            <Match when={props.element.type === 'circle'}>
                <CircleComponent circle={props.element as Circle & StyleProps} />
            </Match>
            <Match when={props.element.type === 'line'}>
                <LineComponent line={props.element as Line & StyleProps} />
            </Match>
            <Match when={props.element.type === 'text'}>
                <TextComponent text={props.element as Text & StyleProps} />
            </Match>
            <Match when={props.element.type === 'image'}>
                <ImageComponent image={props.element as Image & StyleProps} />
            </Match>
            <Match when={props.element.type === 'sprite'}>
                <SpriteComponent sprite={props.element as any} />
            </Match>
            <Match when={props.element.type === 'polygon'}>
                <PolygonComponent polygon={props.element as any} />
            </Match>
            <Match when={props.element.type === 'button'}>
                <ButtonComponent button={props.element as Button & StyleProps} />
            </Match>
            <Match when={props.element.type === 'slider'}>
                <SliderComponent slider={props.element as Slider & StyleProps} />
            </Match>
            <Match when={props.element.type === 'checkbox'}>
                <CheckboxComponent checkbox={props.element as Checkbox & StyleProps} />
            </Match>
            <Match when={props.element.type === 'radio'}>
                <RadioComponent radio={props.element as Radio & StyleProps} />
            </Match>
            <Match when={props.element.type === 'textbox'}>
                <TextboxComponent textbox={props.element as Textbox & StyleProps} />
            </Match>
        </Switch>
    );
};
