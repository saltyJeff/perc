import { opcode } from "../opcodes";
import { TreeCursor } from "@lezer/common";


export interface ICompiler {
    source: string;
    foreign_funcs: Set<string>;
    opcodes: opcode[];
    errors: any[]; // Avoid circular dependency if possible, or use PercCompileError
    emit(op: any, location: { start: number, end: number }): void;
    visit(cursor: TreeCursor): void;
    enter_scope(): void;
    exit_scope(): void;
    declare_var(name: string, location: { start: number, end: number }): void;
    resolve_var(name: string): boolean;
    visitArgumentList(cursor: TreeCursor): number;
}
