import styles from './PaneCtrl.module.css';

type PaneState = 'min' | 'max' | 'restore';

interface PaneCtrlProps {
    orientation: 'horizontal' | 'vertical';
    state: PaneState;
    onStateChange: (state: PaneState) => void;
}

export const PaneCtrl = (props: PaneCtrlProps) => {
    return (
        <div class={`${styles.paneCtrl} ${styles[props.orientation]}`}>
            <button
                class={`${styles.paneBtn} ${styles.btnMin}`}
                disabled={props.state === 'min'}
                title="Minimize"
                onClick={() => props.onStateChange('min')}
            ></button>
            <button
                class={`${styles.paneBtn} ${styles.btnRestore}`}
                disabled={props.state === 'restore'}
                title="Restore"
                onClick={() => props.onStateChange('restore')}
            ></button>
            <button
                class={`${styles.paneBtn} ${styles.btnMax}`}
                disabled={props.state === 'max'}
                title="Maximize"
                onClick={() => props.onStateChange('max')}
            ></button>
        </div>
    );
};