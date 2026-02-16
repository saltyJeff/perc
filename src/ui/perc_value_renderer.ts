import { perc_type, perc_number } from "../vm/perc_types";
import $ from "jquery";

export function renderValue(value: perc_type): JQuery<HTMLElement> {
    if (value instanceof perc_number) {
        const typeStr = value.type;
        const rawVal = value.buffer[0];

        const $container = $('<td>', { class: 'perc-num' });
        const $val = $('<span>', { class: 'val', text: value.to_string() });
        $container.append($val);

        // Only show hex/bin for integer types
        if (['i8', 'u8', 'i16', 'u16', 'i32', 'u32'].includes(typeStr)) {
            let hex = "N/A";
            let bin = "N/A";

            // Handle negative numbers for hex/bin display by treating as unsigned equivalent
            let unsignedVal = rawVal;
            if (rawVal < 0) {
                if (typeStr === 'i8') unsignedVal = rawVal >>> 0 & 0xFF;
                else if (typeStr === 'i16') unsignedVal = rawVal >>> 0 & 0xFFFF;
                else unsignedVal = rawVal >>> 0;
            }

            hex = "0x" + unsignedVal.toString(16).toUpperCase();
            bin = "0b" + unsignedVal.toString(2);

            $container.addClass('interactive-value');

            const showTooltip = (e: JQuery.TriggeredEvent) => {
                $container.addClass('value-hover');
                $('.value-tooltip').remove(); // Clear any existing
                const $tooltip = $('<div>', { class: 'value-tooltip' }).html(`Hex: ${hex}<br>Bin: ${bin}`);
                $('body').append($tooltip);

                // Position logic
                const rect = $container[0].getBoundingClientRect();
                $tooltip.css({
                    top: rect.bottom + 5 + 'px',
                    left: rect.left + 'px'
                });
            };

            const hideTooltip = () => {
                $container.removeClass('value-hover');
                $('.value-tooltip').remove();
            };

            $container.on('mouseenter', showTooltip);
            $container.on('mouseleave', hideTooltip);

            // Touch support for long press could be complex, simple click/touch toggle might be better for now
            // Or just touchstart/end
            $container.on('touchstart', (e) => {
                e.preventDefault();
                showTooltip(e);
            });
            $(document).on('touchend', hideTooltip);
        }



        return $container;
    }

    if (value.type === 'string') {
        const strVal = value.to_string();
        return $('<td>', { class: 'perc-value', text: `"${strVal}"` });
    }

    // Default fallback
    return $('<td>', { class: 'perc-value', text: value.to_string() });
}
