import { createSignal } from 'solid-js';

interface ZoomControlProps {
    onZoom: (size: number) => void;
    minZoomPct: number;
    maxZoomPct: number;
    initialZoom?: number;
}

// User-pleasing "log-ish" steps
const PLEASING_STEPS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500];

export const ZoomControl = (props: ZoomControlProps) => {
    // Filter steps to be within requested range
    const steps = PLEASING_STEPS.filter(s => s >= props.minZoomPct && s <= props.maxZoomPct);

    // Find nearest step for initial value
    const initial = props.initialZoom || 100;
    const initialIndex = steps.reduce((prev, curr, idx) => {
        return Math.abs(curr - initial) < Math.abs(steps[prev] - initial) ? idx : prev;
    }, 0);

    const [index, setIndex] = createSignal(initialIndex);

    const updateIndex = (newIndex: number) => {
        const validatedIndex = Math.max(0, Math.min(steps.length - 1, newIndex));
        setIndex(validatedIndex);
        props.onZoom(steps[validatedIndex]);
    };

    return (
        <div class="zoom-control">
            <button
                class="zoom-btn zoom-out"
                onClick={() => updateIndex(index() - 1)}
                title="Zoom Out"
            >
                -
            </button>
            <input
                type="range"
                class="zoom-slider"
                min={0}
                max={steps.length - 1}
                step={1}
                value={index()}
                onInput={(e) => updateIndex(parseInt(e.currentTarget.value))}
            />
            <button
                class="zoom-btn zoom-in"
                onClick={() => updateIndex(index() + 1)}
                title="Zoom In"
            >
                +
            </button>
            <button
                class="zoom-reset"
                onClick={() => {
                    const idx100 = steps.indexOf(100);
                    if (idx100 !== -1) updateIndex(idx100);
                    else props.onZoom(100); // Fallback if 100 not in steps
                }}
                title="Reset to 100%"
            >
                {steps[index()]}%
            </button>
        </div>
    );
};
