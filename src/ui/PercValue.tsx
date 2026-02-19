import { createSignal, Show } from "solid-js";
import { perc_type, perc_number } from "../vm/perc_types";
import styles from "./PercValue.module.css";

interface PercValueProps {
    value: perc_type;
    isRow?: boolean;
}

export const PercValue = (props: PercValueProps) => {
    const [showTooltip, setShowTooltip] = createSignal(false);
    const [tooltipPos, setTooltipPos] = createSignal({ top: 0, left: 0 });

    const handleMouseEnter = (e: MouseEvent) => {
        const value = props.value;
        if (value instanceof perc_number && isInteger(value.type)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 5,
                left: rect.left
            });
            setShowTooltip(true);
        }
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
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

    const renderContent = () => {
        const value = props.value;
        if (value instanceof perc_number) {
            return (
                <span class="val">{value.to_string()}</span>
            );
        }
        if (value.type === 'string') {
            return <span>"{value.to_string()}"</span>;
        }
        return <span>{value.to_string()}</span>;
    };

    const classNames = () => {
        const parts = [];
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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => {
                e.preventDefault();
                handleMouseEnter(e as unknown as MouseEvent);
            }}
        >
            {renderContent()}
            <Show when={showTooltip()}>
                <div
                    class={styles.tooltip}
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
