import { perc_type, perc_number } from "../vm/perc_types";
import $ from "jquery";

export function renderValue(value: perc_type): JQuery<HTMLElement> {
    if (value instanceof perc_number) {
        const typeStr = value.type;
        const rawVal = value.buffer[0];

        let hex = "N/A";
        let bin = "N/A";

        // Only show hex/bin for integer types
        if (['i8', 'u8', 'i16', 'u16', 'i32', 'u32'].includes(typeStr)) {
            // Handle negative numbers for hex/bin display by treating as unsigned equivalent
            let unsignedVal = rawVal;
            if (rawVal < 0) {
                if (typeStr === 'i8') unsignedVal = rawVal >>> 0 & 0xFF;
                else if (typeStr === 'i16') unsignedVal = rawVal >>> 0 & 0xFFFF;
                else unsignedVal = rawVal >>> 0;
            }

            hex = "0x" + unsignedVal.toString(16).toUpperCase();
            bin = "0b" + unsignedVal.toString(2);
        }

        return $('<div>', { class: 'perc-num' })
            .append($('<span>', { class: 'type', text: typeStr }))
            .append($('<span>', {
                class: 'val',
                text: value.to_string(),
                title: `Hex: ${hex}\nBin: ${bin}`
            }));
    }

    // Default fallback
    return $('<span>', { text: value.to_string() });
}
