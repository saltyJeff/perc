import { perc_type } from "../vm/perc_types";

export function renderValue(value: perc_type): string {
    // For now, we'll just return the string representation.
    // In the future, this can be expanded to return HTML structures.
    return escapeHtml(value.to_string());
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
