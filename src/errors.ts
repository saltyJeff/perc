export interface SourceLocation {
    start: { line: number, column: number, offset: number };
    end: { line: number, column: number, offset: number };
}

export class PercCompileError extends Error {
    constructor(
        message: string,
        public location: SourceLocation
    ) {
        super(message);
        this.name = "PercCompileError";
    }
}
