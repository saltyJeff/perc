import { createSignal, Show, For } from "solid-js";
import { perc_type, perc_number, perc_list, perc_map } from "../vm/perc_types";
import styles from "./PercValue.module.css";

interface PercValueProps {
    value: perc_type;
    isRow?: boolean;
}

export const PercValue = (props: PercValueProps) => {
    const [showTooltip, setShowTooltip] = createSignal(false);
    const [tooltipPos, setTooltipPos] = createSignal({ top: 0, left: 0 });
    const [isExpanded, setIsExpanded] = createSignal(false);

    const handleShowTooltip = (e: Event) => {
        const value = props.value;
        if (value instanceof perc_number && isInteger(value.type)) {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 5,
                left: rect.left
            });
            setShowTooltip(true);
        }
    };

    const handleHideTooltip = () => {
        setShowTooltip(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowTooltip(false);
        }
    };

    const toggleExpand = (e: Event) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded());
    };

    const isInteger = (type: string) => {
        return ['i8', 'u8', 'i16', 'u16', 'i32', 'u32'].includes(type);
    };

    const getHexBin = (value: perc_number) => {
        const rawVal = value.buffer[0];
        const typeStr = value.type;
        let unsignedVal = rawVal;
        if (rawVal < 0) {
            if (typeStr === 'i8') unsignedVal = rawVal >>> 0 & 0xFF;
            else if (typeStr === 'i16') unsignedVal = rawVal >>> 0 & 0xFFFF;
            else unsignedVal = rawVal >>> 0;
        }
        return {
            hex: "0x" + unsignedVal.toString(16).toUpperCase(),
            bin: "0b" + unsignedVal.toString(2)
        };
    };

    const renderMapEntry = (key: any, value: perc_type) => (
        <div class={styles.nestedEntry}>
            <span class={styles.key}>{key}: </span>
            <PercValue value={value} isRow={true} />
        </div>
    );

    const renderList = (val: perc_list) => {
        const elements = val.elements;
        if (!isExpanded()) {
            return (
                <span class={styles.collapsedObject}>
                    <button
                        class={styles.expandButton}
                        onClick={toggleExpand}
                        aria-expanded="false"
                        aria-label="Expand list"
                    >
                        ▶
                    </button>
                    <span class={styles.typeName}>[{val.type}]</span> <span class={styles.preview}>Length: {elements.length}</span>
                </span>
            );
        }

        return (
            <div class={styles.expandedObject}>
                <div class={styles.objectHeader}>
                    <button
                        class={styles.expandButton}
                        onClick={toggleExpand}
                        aria-expanded="true"
                        aria-label="Collapse list"
                        style={{ transform: 'rotate(90deg)' }}
                    >
                        ▶
                    </button>
                    <span class={styles.typeName}>[{val.type}]</span>
                </div>
                <div class={styles.objectBody}>
                    <For each={elements}>
                        {(item, index) => renderMapEntry(index() + 1, item)}
                    </For>
                </div>
            </div>
        );
    };

    const renderMap = (val: perc_map) => {
        const entries = Array.from(val.data.entries());
        if (!isExpanded()) {
            return (
                <span class={styles.collapsedObject}>
                    <button
                        class={styles.expandButton}
                        onClick={toggleExpand}
                        aria-expanded="false"
                        aria-label="Expand map"
                    >
                        ▶
                    </button>
                    <span class={styles.typeName}>[{val.type}]</span> <span class={styles.preview}>Size: {entries.length}</span>
                </span>
            );
        }

        return (
            <div class={styles.expandedObject}>
                <div class={styles.objectHeader}>
                    <button
                        class={styles.expandButton}
                        onClick={toggleExpand}
                        aria-expanded="true"
                        aria-label="Collapse map"
                        style={{ transform: 'rotate(90deg)' }}
                    >
                        ▶
                    </button>
                    <span class={styles.typeName}>[{val.type}]</span>
                </div>
                <div class={styles.objectBody}>
                    <For each={entries}>
                        {([key, value]) => renderMapEntry(key, value)}
                    </For>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        const value = props.value;
        if (value instanceof perc_number) {
            return (
                <>
                    <span class={styles.typeName}>[{value.type}]</span>
                    <span class="val">{value.to_string()}</span>
                </>
            );
        }
        if (value instanceof perc_list) {
            return renderList(value);
        }
        if (value instanceof perc_map) {
            return renderMap(value);
        }
        if (value.type === 'string') {
            return (
                <>
                    <span class={styles.typeName}>[string]</span>
                    <span>"{value.to_string()}"</span>
                </>
            );
        }
        return (
            <>
                <span class={styles.typeName}>[{value.type}]</span>
                <span>{value.to_string()}</span>
            </>
        );
    };

    const classNames = () => {
        const parts = [];
        parts.push(styles.content); // Always use content layout
        if (!props.isRow) parts.push(styles.root);

        const value = props.value;
        if (value instanceof perc_number) {
            parts.push(styles.number);
        } else if (value.type === 'string') {
            parts.push(styles.string);
        } else if (value.type === 'bool') {
            parts.push(styles.bool);
        } else if (value.type === 'nil') {
            parts.push(styles.nil);
        }

        // Interactive check
        if (value instanceof perc_number && isInteger(value.type)) {
            parts.push(styles.interactive);
        }

        if (showTooltip()) {
            parts.push(styles.hover);
        }

        return parts.join(' ');
    };

    const content = (
        <div
            class={classNames()}
            onMouseEnter={handleShowTooltip}
            onMouseLeave={handleHideTooltip}
            onFocus={handleShowTooltip}
            onBlur={handleHideTooltip}
            onKeyDown={handleKeyDown}
            tabIndex={props.value instanceof perc_number && isInteger(props.value.type) ? 0 : undefined}
            onTouchStart={(e) => {
                e.preventDefault();
                handleShowTooltip(e as unknown as Event);
            }}
        >
            {renderContent()}
            <Show when={showTooltip()}>
                <div
                    class={styles.tooltip}
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: `${tooltipPos().top}px`,
                        left: `${tooltipPos().left}px`,
                        "z-index": 1000
                    }}
                >
                    {(() => {
                        const { hex, bin } = getHexBin(props.value as perc_number);
                        return <>Hex: {hex}<br />Bin: {bin}</>;
                    })()}
                </div>
            </Show>
        </div>
    );

    if (props.isRow) {
        return content;
    }

    return (
        <td class={classNames()}>
            {content}
        </td>
    );
};

// Also export the simple string renderer for types that don't need the cell
export function formatValue(value: perc_type): string {
    if (value.type === 'string') return `"${value.to_string()}"`;
    return value.to_string();
}
