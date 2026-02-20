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
                <div aria-hidden="true"><RectComponent rect={props.element as Rect & StyleProps} /></div>
            </Match>
            <Match when={props.element.type === 'circle'}>
                <div aria-hidden="true"><CircleComponent circle={props.element as Circle & StyleProps} /></div>
            </Match>
            <Match when={props.element.type === 'line'}>
                <div aria-hidden="true"><LineComponent line={props.element as Line & StyleProps} /></div>
            </Match>
            <Match when={props.element.type === 'text'}>
                <TextComponent text={props.element as Text & StyleProps} />
            </Match>
            <Match when={props.element.type === 'image'}>
                <div aria-hidden="true"><ImageComponent image={props.element as Image & StyleProps} /></div>
            </Match>
            <Match when={props.element.type === 'sprite'}>
                <div aria-hidden="true"><SpriteComponent sprite={props.element as any} /></div>
            </Match>
            <Match when={props.element.type === 'polygon'}>
                <div aria-hidden="true"><PolygonComponent polygon={props.element as any} /></div>
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
