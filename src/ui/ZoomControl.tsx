import { createSignal } from 'solid-js';
import styles from './ZoomControl.module.css';

interface ZoomControlProps {
    onZoom: (size: number) => void;
    minZoomPct: number;
    maxZoomPct: number;
    initialZoom?: number;
}

export const ZoomControl = (props: ZoomControlProps) => {
    const min = props.minZoomPct ?? 50;
    const max = props.maxZoomPct ?? 500;
    const initial = props.initialZoom ?? 100;

    const [zoom, setZoom] = createSignal(initial);

    const updateZoom = (val: number) => {
        const newVal = Math.max(min, Math.min(max, val));
        setZoom(newVal);
        props.onZoom(newVal);
    };

    return (
        <div class={styles.zoomControl} role="group" aria-label="Zoom Controls">
            <button class={styles.zoomBtn} onClick={() => updateZoom(zoom() - 10)} title="Zoom Out" aria-label="Zoom Out">-</button>
            <label for="zoom-slider" class={styles.srOnly}>Zoom Level</label>
            <input
                id="zoom-slider"
                type="range"
                min={min}
                max={max}
                value={zoom()}
                class={styles.zoomSlider}
                onInput={(e) => updateZoom(parseInt(e.currentTarget.value))}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={zoom()}
            />
            <button class={styles.zoomBtn} onClick={() => updateZoom(zoom() + 10)} title="Zoom In" aria-label="Zoom In">+</button>
            <button class={styles.zoomReset} onClick={() => updateZoom(100)} title="Reset to 100%" aria-label="Reset Zoom to 100%">
                {zoom()}%
            </button>
        </div>
    );
};
