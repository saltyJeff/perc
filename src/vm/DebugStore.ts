import { createStore } from "solid-js/store";
import { perc_type } from "./perc_types";

export interface DebugFrame {
    id: string;
    name: string;
    args: string[];
    variables: Record<string, { value: perc_type, range: [number, number] | null }>;
    open: boolean;
}

export interface DebugState {
    currentExpression: {
        value: perc_type | null;
        type: string | null;
    };
    callStack: DebugFrame[];
    status: string;
    activeRange: [number, number] | null;
}

export function createDebugStore() {
    const [state, setState] = createStore<DebugState>({
        currentExpression: {
            value: null,
            type: null
        },
        callStack: [],
        status: 'Idle',
        activeRange: null
    });

    return [state, setState] as const;
}
