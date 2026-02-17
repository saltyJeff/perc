import { PaneCtrl } from './PaneCtrl';
import styles from './Pane.module.css';

type PaneState = 'min' | 'max' | 'restore';

interface PaneProps {
    id: string;
    title: string;
    state: PaneState;
    onStateChange: (state: PaneState) => void;
    children: any;
    controls?: any;
    orientation?: 'horizontal' | 'vertical';
    class?: string;
}

export const Pane = (props: PaneProps) => {
    return (
        <div
            id={props.id}
            class={`${styles.pane} ${props.class || ''} ${props.state === 'max' ? styles.maximized : ''} ${props.state === 'min' ? styles.collapsed : ''} ${props.orientation === 'horizontal' ? styles.horizontalContainer : ''}`}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <PaneCtrl
                        orientation={props.state === 'min' && props.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
                        state={props.state}
                        onStateChange={props.onStateChange}
                    />
                    <span>{props.title}</span>
                </div>
                <div class={styles.controls}>
                    {props.controls}
                </div>
            </div>
            <div class={styles.content}>
                {props.children}
            </div>
        </div>
    );
};
