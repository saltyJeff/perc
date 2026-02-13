# PerC Language
## Architecture
* PEGGY is the parser generator. see `src/perc-grammar.pegjs` for reference
* vite is the build tool
* plain typescript + JQuery + ace editor are the runtime dependencies
* we are targeting IE11, so restrict yourself accordingly. 

## GUI
* ace editor for the editor itself
* these are the major GUI components
    * top menubar (holds the name of the project, the run / build button / stop button, editor options)
    * code editor (holds the ace text editor)
    * REPL console
    * debugger (holds the display of the perc VM's state (call stack, variables in current stack, etc.))
* besides for the menubar, the user should be able to:
    * resize/arrange the other panes to the top/left/right/bottom edge.
    * resize the text of each pane independently

### Code editor
* the code editor should support:
    * highlighting keywords and other language elements
    * tab preservation
    * smart completion should not be available, only basic autocompletion based on keywords and previously typed words.
    * the editor uses ACE, and the source of truth is the peggy grammar
* the code editor holds all of the code. multiple files are not supported.
* menubar options for the editor include
    * font size
    * theme
    * text wrapping


## VM
The PerC VM is a stack based VM written in typescript.

While it executes the code, it emits events that are consumed by the debugger. These events include:
* new frame pushed / popped
* new variable created / modified in the current frame
* new expression added to the value stack
* new node being evaluated. This will be a `[start, end]` tuple of the range of the source code. 

While the VM evaluates, it should mark the code editor read only. Then, it should highlight, in the code editor, the range of the source code that is being evaluated. This may or may not be possible 