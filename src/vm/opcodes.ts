import type { perc_type } from "./perc_types.ts";

export interface base_op {
    type: string;
    src_start: number;
    src_end: number;
}

export interface push_op extends base_op {
    type: 'push';
    imm: perc_type;
}

export interface pop_op extends base_op {
    type: 'pop';
}

export interface dup_op extends base_op {
    type: 'dup';
}

export interface swap_op extends base_op {
    type: 'swap';
}

export interface init_op extends base_op {
    type: 'init';
    name: string;
}

export interface load_op extends base_op {
    type: 'load';
    name: string;
}

export interface store_op extends base_op {
    type: 'store';
    name: string;
}

export interface binary_op extends base_op {
    type: 'binary_op';
    op: string; // '+', '-', '*', '/', '%', '==', '!=', '<', '<=', '>', '>=', '&&', '||', etc.
}

export interface unary_op extends base_op {
    type: 'unary_op';
    op: string; // '-', '!', 'not'
}

export interface jump_op extends base_op {
    type: 'jump';
    addr: number;
}

export interface jump_if_false_op extends base_op {
    type: 'jump_if_false';
    addr: number;
}

export interface jump_if_true_op extends base_op {
    type: 'jump_if_true';
    addr: number;
}

export interface get_iter_op extends base_op {
    type: 'get_iter';
}

export interface iter_next_op extends base_op {
    type: 'iter_next';
}

export interface call_op extends base_op {
    type: 'call';
    nargs: number;
}

export interface ret_op extends base_op {
    type: 'ret';
}

export interface make_closure_op extends base_op {
    type: 'make_closure';
    addr: number;
    captured: string[];
}

export interface call_foreign_op extends base_op {
    type: 'call_foreign';
    name: string;
    nargs: number;
}

export interface new_array_op extends base_op {
    type: 'new_array';
    size: number;
}

export interface new_map_op extends base_op {
    type: 'new_map';
    size: number;
}

export interface new_tuple_op extends base_op {
    type: 'new_tuple';
    size: number;
}

export interface index_load_op extends base_op {
    type: 'index_load';
}

export interface index_store_op extends base_op {
    type: 'index_store';
}

export interface member_load_op extends base_op {
    type: 'member_load';
    name: string;
}

export interface member_store_op extends base_op {
    type: 'member_store';
    name: string;
}

export type opcode =
    | push_op
    | pop_op
    | dup_op
    | swap_op
    | init_op
    | load_op
    | store_op
    | binary_op
    | unary_op
    | jump_op
    | jump_if_false_op
    | jump_if_true_op
    | get_iter_op
    | iter_next_op
    | call_op
    | ret_op
    | make_closure_op
    | call_foreign_op
    | new_array_op
    | new_map_op
    | new_tuple_op
    | index_load_op
    | index_store_op
    | member_load_op
    | member_store_op;