import type { BuiltinFunc } from "../vm/builtins";
import { perc_nil, perc_number, perc_string, perc_map, perc_type, perc_err } from "../vm/perc_types";

export interface IConsole {
    print: (msg: string) => void;
    println: (msg: string) => void;
    setTextColor: (color: string) => void;
    error: (msg: string, location?: [number, number]) => void;
    status: (msg: string) => void;
    clear: () => void;
}

export const createConsoleBuiltins = (appConsole: IConsole, onRequestInput: (prompt: string) => void): Record<string, BuiltinFunc> => {
    return {
        'print': (...args: perc_type[]) => {
            const msg = args.map(a => (a as any).to_string()).join(' ');
            appConsole.print(msg);
            return new perc_nil();
        },

        'println': (...args: perc_type[]) => {
            const msg = args.map(a => (a as any).to_string()).join(' ');
            appConsole.println(msg);
            return new perc_nil();
        },

        'text_color': (color: perc_type) => {
            if (!(color instanceof perc_map)) {
                // We should probably return error instead of throwing to be consistent with VM?
                // But legacy code threw Error. Let's return error to be nicer.
                // Wait, VM catches errors and reports them.
                return new perc_err(`text_color: argument must be a color map (from rgb() or hsl()), got ${color.type}`);
            }
            const r = color.get(new perc_string('r'));
            const g = color.get(new perc_string('g'));
            const b = color.get(new perc_string('b'));

            if (!(r instanceof perc_number) || !(g instanceof perc_number) || !(b instanceof perc_number)) {
                return new perc_err("text_color: invalid color map components");
            }

            const rVal = Math.max(0, Math.min(255, Math.floor(r.buffer[0])));
            const gVal = Math.max(0, Math.min(255, Math.floor(g.buffer[0])));
            const bVal = Math.max(0, Math.min(255, Math.floor(b.buffer[0])));

            appConsole.setTextColor(`rgb(${rVal}, ${gVal}, ${bVal})`);
            return new perc_nil();
        },

        // Note: 'input' needs special handling in VM because it yields execution.
        // We can register it here as a placeholder or helper, but VM might need to know about it specifically.
        // In src/vm/index.ts, 'input' sets is_waiting_for_input = true.
        // Since we can't easily set VM state from here without passing VM instance, 
        // maybe we should keep 'input' special or pass a callback?
        // Actually, the current VM 'input' builtin sets `this.is_waiting_for_input`.
        // If we move it out, we need a way to signal the VM.
        // Option: Pass an 'onInput' callback to this factory?
        // Or simpler: Leave 'input' in VM core or handle it via a specific event trigger that the function calls?
        // The VM listens to `on_input_request`.
        // Let's implement it here and assume the VM will be passed or we use a closure.
        // Wait, standard builtins don't have access to VM instance.
        // `createConsoleBuiltins` takes `appConsole`.
        // We might need to pass `vm` to `createConsoleBuiltins` or just return a function that modifies VM state?
        // Actually, the `input` function in `src/vm/index.ts` does:
        // this.events.on_input_request?.(p); this.is_waiting_for_input = true;

        // Use a callback for the input signal?
        // onInput callback to notify the VM/UI
        'input': (prompt: perc_type) => {
            const promptStr = prompt instanceof perc_string ? prompt.value : "";
            onRequestInput(promptStr);
            // Return nil as a placeholder. VM will pop this and replace with actual input when resumed.
            return new perc_nil();
        }
    };
};
