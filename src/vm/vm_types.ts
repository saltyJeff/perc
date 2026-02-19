import type { perc_type } from "./perc_types.ts";
import type { Frame } from "./frame.ts";
import type { DebugState } from "./DebugStore";

export type { DebugState };

export interface VMEventMap {
    on_frame_push: (frame: Frame) => void;
    on_frame_pop: () => void;
    on_var_update: (name: string, value: perc_type, range: [number, number] | null) => void;
    on_stack_push: (value: perc_type) => void;
    on_node_eval: (range: [number, number]) => void;
    on_debugger: () => void;
    on_state_dump: () => void;
    on_error: (err: string, location: [number, number] | null) => void;
    on_stack_top_update: (val: perc_type | null) => void;
    on_input_request: (prompt: string) => void;
}
