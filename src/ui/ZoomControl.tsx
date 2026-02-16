import { createSignal, createMemo } from 'solid-js';

interface ZoomControlProps {
    onZoom: (size: number) => void;
    initialSize?: number;
}

export const ZoomControl = (props: ZoomControlProps) => {
    const [size, setSize] = createSignal(props.initialSize || 14);

    const updateSize = (newSize: number) => {
        const validatedSize = Math.max(4, Math.min(42, newSize));
        setSize(validatedSize);
        props.onZoom(validatedSize);
    };

    const percentage = createMemo(() => Math.round((size() / 14) * 100));

    return (
        <div class="zoom-control">
            <button
                class="zoom-btn zoom-out"
                onClick={() => updateSize(size() - 1)}
            >
                -
            </button>
            <input
                type="range"
                class="zoom-slider"
                min="4"
                max="42"
                value={size()}
                onInput={(e) => updateSize(parseInt(e.currentTarget.value))}
            />
            <button
                class="zoom-btn zoom-in"
                onClick={() => updateSize(size() + 1)}
            >
                +
            </button>
            <button
                class="zoom-reset"
                onClick={() => updateSize(14)}
            >
                {percentage()}%
            </button>
        </div>
    );
};
