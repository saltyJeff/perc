import { ZoomControl } from '../ui/ZoomControl';
import styles from './DebuggerPane.module.css';
import { For, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { PercValue } from '../ui/PercValue';
import { VM } from '../vm';
import { editorStore } from '../editor/EditorStore';


interface DebuggerPaneProps {
    vm: VM;
    onZoom: (size: number) => void;
    orientation?: 'horizontal' | 'vertical';
    style?: any;
}

export const DebuggerPane = (props: DebuggerPaneProps) => {
    // Column widths in percentages
    const [colWidths3, setColWidths3] = createSignal([33.33, 33.34, 33.33]);
    const [colWidths2, setColWidths2] = createSignal([50, 50]);

    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartWidths: number[] = [];
    let resizeIndex = -1;
    let currentCols = 2;

    const startResize = (e: MouseEvent, index: number, cols: number) => {
        e.preventDefault();
        isResizing = true;
        resizeStartX = e.pageX;
        resizeIndex = index;
        currentCols = cols;
        resizeStartWidths = [...(cols === 3 ? colWidths3() : colWidths2())];
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('no-select');
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.pageX - resizeStartX;
        const containerWidth = document.getElementById('debugger-content')?.clientWidth || 1;
        const deltaPercent = (deltaX / containerWidth) * 100;

        const newWidths = [...resizeStartWidths];
        const leftIdx = resizeIndex;
        const rightIdx = resizeIndex + 1;

        if (leftIdx >= 0 && rightIdx < newWidths.length) {
            const nextLeft = Math.max(10, resizeStartWidths[leftIdx] + deltaPercent);
            const totalWidth = resizeStartWidths[leftIdx] + resizeStartWidths[rightIdx];
            const nextRight = Math.max(10, totalWidth - nextLeft);

            if (nextRight > 10) {
                newWidths[leftIdx] = nextLeft;
                newWidths[rightIdx] = nextRight;
                if (currentCols === 3) setColWidths3(newWidths);
                else setColWidths2(newWidths);
            }
        }
    };

    const handleMouseUp = () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.classList.remove('no-select');
        }
    };

    onMount(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    });

    const DebugTable = (tableProps: { headers: string[], children: any, cols: number }) => {
        const widths = () => tableProps.cols === 3 ? colWidths3() : colWidths2();

        return (
            <table class="debug-table" data-cols={tableProps.cols}>
                <colgroup>
                    <For each={widths()}>
                        {(w) => <col style={{ width: `${w}%` }} />}
                    </For>
                </colgroup>
                <thead class="sr-only">
                    <tr>
                        <For each={tableProps.headers}>
                            {(h) => <th scope="col">{h}</th>}
                        </For>
                    </tr>
                </thead>
                <tbody>
                    {tableProps.children}
                </tbody>
            </table>
        );
    };

    const DebugRow = (rowProps: { cells: any[], cols: number }) => {
        return (
            <tr>
                <For each={rowProps.cells}>
                    {(cell, i) => (
                        <td class={i() === 0 ? 'col-name' : (i() === 1 ? 'col-value' : 'col-type')}>
                            {cell}
                            <Show when={i() < rowProps.cols - 1}>
                                <div
                                    class="col-resizer"
                                    onMouseDown={(e) => startResize(e, i(), rowProps.cols)}
                                    role="separator"
                                    aria-label="Column resizer"
                                    tabindex="0"
                                />
                            </Show>
                        </td>
                    )}
                </For>
            </tr>
        );
    };

    return (
        <section
            id="debugger-pane"
            class={`${styles.debuggerPane} ${props.orientation === 'vertical' ? styles.vertical : ''}`}
            aria-labelledby="debugger-title"
            style={props.style}
        >
            <div class={styles.header}>
                <div class={styles.titleArea}>
                    <h2 id="debugger-title" class={styles.title}>Debugger</h2>
                </div>
                <div class={styles.controls}>
                    <ZoomControl onZoom={props.onZoom} minZoomPct={25} maxZoomPct={500} />
                </div>
            </div>
            <div class={styles.content}>
                <div id="debugger-content" class="pane-content" role="region" aria-live="polite" aria-label="Debugger State">

                    <div class="debug-section" id="vm-state">
                        <h4>Status</h4>
                        <div class="state-content">{props.vm.debugStore.status}</div>
                    </div>

                    <div class="debug-section" id="current-expression">
                        <h4>Current Expression</h4>
                        <div class="expr-content">
                            <DebugTable headers={['Value', 'Type']} cols={2}>
                                <Show
                                    when={props.vm.debugStore.currentExpression.value}
                                    fallback={<DebugRow cells={['nil', '-']} cols={2} />}
                                >
                                    <DebugRow cells={[
                                        <PercValue value={props.vm.debugStore.currentExpression.value!} isRow />,
                                        props.vm.debugStore.currentExpression.type
                                    ]} cols={2} />
                                </Show>
                            </DebugTable>
                        </div>
                    </div>

                    <div class="debug-section" id="call-stack">
                        <h4>Call Stack</h4>
                        <div class="stack-content">
                            <Show when={props.vm.debugStore.callStack.length > 0} fallback="Empty">
                                <For each={props.vm.debugStore.callStack}>
                                    {(frame) => (
                                        <details open={frame.open}>
                                            <summary>{frame.name}</summary>
                                            <DebugTable headers={['Name', 'Value', 'Type']} cols={3}>
                                                <For each={Object.entries(frame.variables)}>
                                                    {([name, data]) => (
                                                        <DebugRow cells={[
                                                            <span
                                                                class="debug-var-name"
                                                                onMouseEnter={() => data.range && editorStore.highlightVariableDefinition(data.range[0], data.range[1])}
                                                                onMouseLeave={() => editorStore.clearVariableDefinitionHighlight()}
                                                            >
                                                                {name}
                                                            </span>,
                                                            <PercValue value={data.value} isRow />,
                                                            data.value.type
                                                        ]} cols={3} />
                                                    )}
                                                </For>
                                            </DebugTable>
                                        </details>
                                    )}
                                </For>
                            </Show>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
