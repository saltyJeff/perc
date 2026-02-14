# PerC Language

## Goals
- the main goal is to make things easy for students to learn.
- the target is AP Comp Sci Principles students.

## Language
- intent-based variable models to deal with typo issues.
    - `init` to declare a new variable
    - `change` to modify an existing variable
- `new` used to denote reference types
- only functions, arrays, maps, and tuples are supported
- support for small size ints to teach about overflow issues
- features that allow practice representing data in different ways
    - hex/bin representations of integers
    - rgb/rgba/hsl/hsla representations of colors
    - raster images
    - Python turtle/P5 graphics
- debugger / REPL built in
- no install necessary
- works on ancient versions of browsers
- aggressive fail-fast error behavior


## Architecture
- PEGGY is the parser generator. see `src/perc-grammar.pegjs` for reference
- vite is the build tool
- plain typescript + JQuery + ace editor are the runtime dependencies
- we are targeting browsers less than 5 years old, so modern features are available. 

## GUI
- ace editor for the editor itself
- these are the major GUI components
    - top menubar (holds the name of the project, the run / build button / stop button, editor options)
    - code editor (holds the ace text editor)
    - REPL console
    - debugger (holds the display of the perc VM's state (call stack, variables in current stack, etc.))
- besides for the menubar, the user should be able to:
    - resize/arrange the other panes to the top/left/right/bottom edge.
    - resize the text of each pane independently

### Code editor
- the code editor should support:
    - highlighting keywords and other language elements
    - tab preservation
    - smart completion should not be available, only basic autocompletion based on keywords and previously typed words.
    - the editor uses ACE, and the source of truth is the peggy grammar
- the code editor holds all of the code. multiple files are not supported.
- menubar options for the editor include
    - font size
    - theme
    - text wrapping


## VM
The PerC VM is a stack based VM written in typescript.

While it executes the code, it emits events that are consumed by the debugger. These events include:
- new frame pushed / popped
- new variable created / modified in the current frame
- new expression added to the value stack
- new node being evaluated. This will be a `[start, end]` tuple of the range of the source code. 

While the VM evaluates, it should mark the code editor read only. Then, it should highlight, in the code editor, the range of the source code that is being evaluated. This may or may not be possible 

## Interpreter architecture
The interpreter is implemented as a stack-based Virtual Machine using a generator for its main execution loop to facilitate stepping and debugging.

### Opcodes
- **Stack**: `push`, `pop`, `dup`, `swap`.
- **Variables**: `init`, `load`, `store` (with semantic checks for `init` vs `change`).
  > **Note**: This language uses `init` for declaration and `change` for mutation. `var` and `let` are **NOT*- supported.
- **Control Flow**: `jump`, `jump_if_false`, `jump_if_true`.
- **Loops**: `get_iter`, `iter_next` (for `for-in` support).
- **Functions**: `call`, `ret`, `make_closure`.
- **Foreign Functions**: `call_foreign` (allows JS integration).
- **Data Structures**: `new_array`, `new_map`, `new_tuple`, `index_load/store`, `member_load/store`.

### Type System
All values descend from `perc_type`, which implements:
- Arithmetic/Logic operator methods.
- Truthiness checks.
- Iterator support via `get_iterator()`.
- Typed array backing for numeric types.

### Execution Model
- Main loop is a **Generator*- yielding after each instruction.
- Scope chain management for closure support.
- Explicit error handling for semantic violations (e.g., assignment to uninitialized variables).

## GUI System
The GUI system provides an engaging, immediate-mode interface for students to create interactive graphics and user interfaces. The GUI runs in a separate popup window that communicates with the main IDE via `postMessage`.

### Architecture
- **Main Window (`src/index.ts`)**: Registers foreign functions that queue GUI commands
- **GUI Manager (`src/gui_window/manager.ts`)**: Manages the popup window lifecycle and message passing
- **GUI Runtime (`src/gui_window/runtime.ts`)**: Renders commands on a 640x480 canvas with immediate-mode paradigm
- **Communication**: Commands are batched and sent via `postMessage`, input state is synced back to the main window

### Canvas Configuration
- Fixed size: 640×480 pixels
- White background with centered layout
- Nearest-neighbor scaling (`imageSmoothingEnabled = false`) for pixelated graphics
- Supports canvas transformations: translate, scale, rotate
- Transformation groups via `group()` / `end_group()` (uses canvas save/restore)

### General Pattern
```javascript
while(true) then {
    window();           // Clear canvas and prepare for new frame
    
    fill(rgb(255, 0, 0));    // Set fill color (affects shapes and widgets)
    stroke(rgb(0, 0, 255));  // Set stroke color (affects borders and outlines)
    
    // Draw shapes, widgets, sprites...
    
    end_window();       // Flush commands to GUI window
}
```

### Available Functions

#### Window Management
- `window()` - Clears the canvas and begins a new frame
- `end_window()` - Flushes all queued commands to the GUI window

#### Immediate Mode Widgets
Widgets respect the current `fill()` and `stroke()` colors for customization.

- `button(text, x, y)` → `bool` - Returns `true` when clicked
  - Fill color: hover state background
  - Stroke color: border and text color
- `slider(x, y)` → `number` - Returns value 0-100
  - Fill color: slider knob
  - Stroke color: slider track
- `checkbox(x, y)` → `bool` - Returns checked state
  - Fill color: check mark
  - Stroke color: box border
- `radio(group, x, y)` → `bool` - Returns selected state
  - `group`: string name of the group for mutual exclusion
  - Fill color: inner circle when selected
  - Stroke color: outer circle border
- `textbox(x, y)` → `string` - Returns input text (uses direct keyboard input)
- `z_index(n)` - Sets the current layer for subsequent commands (higher is on top)

#### Vector Graphics
- `circle(x, y, radius)` - Draws a filled circle
- `rect(x, y, width, height)` - Draws a filled rectangle
- `line(x1, y1, x2, y2)` - Draws a line
- `polygon(x, y, points)` - Draws a filled polygon
  - `points` is an array of `{x, y}` maps relative to the polygon's origin
- `text(text, x, y, align?)` - Draws text
  - `align` (optional): `"left"`, `"center"`, or `"right"` (default: `"left"`)

#### Graphics State
- `fill(color)` - Sets fill color for shapes and widgets
  - `color` is an RGB/HSL color object from `rgb()` or `hsl()`
- `stroke(color)` - Sets stroke color for lines, borders, and widget outlines
  - `color` is an RGB/HSL color object from `rgb()` or `hsl()`

#### Transformations
- `translate(x, y)` - Moves the origin
- `scale(x, y)` - Scales subsequent drawing operations
- `rotate(angle)` - Rotates by angle in radians
- `group()` - Saves current transformation state
- `end_group()` - Restores transformation state
- `z_index(n)` - Sets current layer depth (default 0, higher numbers on top)

#### Raster Graphics
- `image(x, y, width, height, url)` - Draws an image from URL
- `sprite(x, y, width, height, pixelData)` - Draws a pixel sprite
  - `pixelData` is an array of `{r, g, b}` maps (one per pixel, row-major order)
  - Respects canvas transformations (scale, translate, rotate)
  - Uses nearest-neighbor scaling for pixel-perfect rendering

### Color Functions
- `rgb(r, g, b)` - Creates an RGB color (0-255 for each channel)
- `hsl(h, s, l)` - Creates an HSL color (h: 0-360, s/l: 0-100)

### Example: Customized Widgets
```javascript
// Green knob on purple slider
fill(rgb(0, 255, 0));      // Knob color
stroke(rgb(128, 0, 128));  // Track color
init sliderVal = slider(10, 10);

// Yellow button with blue border
fill(rgb(255, 255, 0));
stroke(rgb(0, 0, 255));
if (button("Click Me", 10, 50)) then {
    print("Button clicked!");
}
```