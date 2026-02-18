import { createStore } from "solid-js/store";

// This saves your custom dragged sizes so 'restore' doesn't wipe them out
const customSizes = {
    code: '1',
    debugconsole: '1',
    debugger: '1',
    console: '1'
};

function applyLayout(action, sourcePane) {
    let mode = 'split';

    if (action === 'max') {
        mode = sourcePane + '-max';
    } else if (action === 'min') {
        mode = sourcePane + '-min';
    } else if (action === 'restore') {
        mode = 'split';
    }

    const codeEl = document.getElementById('code');
    const debugconsoleEl = document.getElementById('debugconsole');
    const debuggerEl = document.getElementById('debugger');
    const consoleEl = document.getElementById('console');

    const setMenu = (id, isClosed, activeState) => {
        const el = document.getElementById(id);
        const menu = el.querySelector('.menu-bar');

        if (isClosed) menu.classList.add('closed');
        else menu.classList.remove('closed');

        menu.querySelector('.max').disabled = (activeState === 'max');
        menu.querySelector('.min').disabled = (activeState === 'min');
        menu.querySelector('.restore').disabled = (activeState === 'restore');
    };

    // --- THE LAYOUT RULES ---
    if (mode === 'code-max') {
        codeEl.style.flex = '1';
        debugconsoleEl.style.flex = '0 0 45px';
        debuggerEl.style.flex = customSizes.debugger; // Maintain their vertical split!
        consoleEl.style.flex = customSizes.console;

        setMenu('code', false, 'max');
        setMenu('debugger', true, 'min');
        setMenu('console', true, 'min');
    }
    else if (mode === 'debugger-max') {
        codeEl.style.flex = '0 0 45px';
        debugconsoleEl.style.flex = '1';
        debuggerEl.style.flex = '1';
        consoleEl.style.flex = '0 0 35px';

        setMenu('code', true, 'min');
        setMenu('debugger', false, 'max');
        setMenu('console', false, 'min');
    }
    else if (mode === 'console-max') {
        codeEl.style.flex = '0 0 45px';
        debugconsoleEl.style.flex = '1';
        debuggerEl.style.flex = '0 0 35px';
        consoleEl.style.flex = '1';

        setMenu('code', true, 'min');
        setMenu('debugger', false, 'min');
        setMenu('console', false, 'max');
    }
    else if (mode === 'code-min') {
        codeEl.style.flex = '0 0 45px';
        debugconsoleEl.style.flex = '1';
        debuggerEl.style.flex = customSizes.debugger;
        consoleEl.style.flex = customSizes.console;

        setMenu('code', true, 'min');
        setMenu('debugger', false, 'restore');
        setMenu('console', false, 'restore');
    }
    else if (mode === 'debugger-min') {
        codeEl.style.flex = customSizes.code;
        debugconsoleEl.style.flex = customSizes.debugconsole;
        debuggerEl.style.flex = '0 0 35px';
        consoleEl.style.flex = '1';

        setMenu('code', false, 'restore');
        setMenu('debugger', false, 'min');
        setMenu('console', false, 'max');
    }
    else if (mode === 'console-min') {
        codeEl.style.flex = customSizes.code;
        debugconsoleEl.style.flex = customSizes.debugconsole;
        debuggerEl.style.flex = '1';
        consoleEl.style.flex = '0 0 35px';

        setMenu('code', false, 'restore');
        setMenu('debugger', false, 'max');
        setMenu('console', false, 'min');
    }
    else {
        // RESTORE - Pulls from memory instead of forcing 'flex: 1'
        codeEl.style.flex = customSizes.code;
        debugconsoleEl.style.flex = customSizes.debugconsole;
        debuggerEl.style.flex = customSizes.debugger;
        consoleEl.style.flex = customSizes.console;

        setMenu('code', false, 'restore');
        setMenu('debugger', false, 'restore');
        setMenu('console', false, 'restore');
    }
}

// Attach listeners to buttons
document.querySelectorAll('.menu-bar button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.target.className;
        const sourcePane = e.target.closest('.menu-bar').parentElement.id;
        applyLayout(action, sourcePane);
    });
});

// --- DRAG TO RESIZE LOGIC ---
const codeDivider = document.getElementById('codedivider');
const debuggerDivider = document.getElementById('debuggerdivider');
const body = document.body;

let isDraggingCol = false;
let isDraggingRow = false;

codeDivider.addEventListener('mousedown', () => {
    isDraggingCol = true;
    body.classList.add('no-select', 'is-dragging');
    body.style.cursor = 'col-resize';
});

debuggerDivider.addEventListener('mousedown', () => {
    isDraggingRow = true;
    body.classList.add('no-select', 'is-dragging');
    body.style.cursor = 'row-resize';
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingCol) {
        document.getElementById('code').style.flex = `0 0 ${e.clientX}px`;
        document.getElementById('debugconsole').style.flex = '1';
    }
    if (isDraggingRow) {
        const containerBox = document.getElementById('debugconsole').getBoundingClientRect();
        const newHeight = e.clientY - containerBox.top;
        document.getElementById('debugger').style.flex = `0 0 ${newHeight}px`;
        document.getElementById('console').style.flex = '1';
    }
});

// When you stop dragging, save the sizes to memory!
document.addEventListener('mouseup', () => {
    if (isDraggingCol || isDraggingRow) {
        isDraggingCol = false;
        isDraggingRow = false;
        body.classList.remove('no-select', 'is-dragging');
        body.style.cursor = 'default';

        // Update the memory cache with the new inline styles
        customSizes.code = document.getElementById('code').style.flex || '1';
        customSizes.debugconsole = document.getElementById('debugconsole').style.flex || '1';
        customSizes.debugger = document.getElementById('debugger').style.flex || '1';
        customSizes.console = document.getElementById('console').style.flex || '1';
    }
});

// Run once on load
applyLayout('restore', 'all');

export const [layoutStore, setLayoutStore] = createStore({

})