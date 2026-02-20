# PerC: The "Perfect for Classrooms" Language
*A guide for APCSP Teachers moving from Python*

## Why PerC?
You love Python for its readability, but you dread the "invisible" errors that plague beginners.
- "Why did `count` revert to 0?" (Shadowing variables accidentally)
- "Why didn't my value update?" (creating a new local instead of modifying the global)
- "How do I visualize the stack?"

PerC is designed to look like Python but **enforce intent**. It kills entire categories of beginner bugs while teaching deeper Computer Science principles (like Reference vs Value, Scope, and Types) implicitly.

## The Killer Feature: Intent-Based Variables
In Python, `x = 5` is ambiguous. Is it a new variable? An update? A global?
In PerC, you must state your intent.

### Python
```python
score = 0
def update():
    score = 10 # Bug! Created a local variable 'score', didn't update global.
```

### PerC
```perc
init score = 0
function update() {
    change score = 10 // Clear intent. If 'score' doesn't exist, this Errors immediately.
}
```

This simple change eliminates the #1 source of logic errors in student code.

## Visual Learning & Overflow
APCSP specifically covers overflow errors. Python handles arbitrarily large integers, hiding this concept.
PerC supports fixed-width integers to demonstrate overflow *safely*.

```perc
// 8-bit integer overflow demo
init tiny = i8(0)
while (tiny < 300) then {
    change tiny = tiny + 50
    print(tiny) // Watch it wrap around at 255!
}
```

## Graphics & GUI
Instead of `turtle`, PerC uses a P5.js-inspired immediate mode GUI.
```perc
// Draw a circle controlled by a slider
while (true) then {
    window() // Clear screen
    init x = slider(10, 10) // Returns 0-100 based on user input
    fill(rgb(255, 0, 0))
    circle(x * 5, 240, 50)
    end_window()
}
```
Students can build interactive apps (buttons, sliders) in seconds using this "Immediate Mode" GUI pattern.

## Quick Start Guide for Pythonistas

### 1. Variables
Use `init` to create, `change` to update.
```perc
init name = "Alice"
change name = "Bob"
init age = 16
```

### 2. Control Flow
PerC uses `{ }` for blocks, but keeps Python's keywords. Note the `then` keyword!
```perc
if (age > 18) then {
    print("Adult")
} else {
    print("Minor")
}

init i = 0
while (i < 10) then {
    print(i)
    change i = i + 1
}
```

### 3. Functions
```perc
function greet(name) {
    return "Hello " + name
}
```

### 4. Loops
Python-style `for-in` loops work great.
```perc
init numbers = [1, 2, 3]
for (init n in numbers) then {
    print(n)
}
```

## Try It Now in the IDE

1.  **The REPL**: Look at the "Console" pane at the bottom.
    *   Type `init x = 10` and hit Enter.
    *   Type `x * 2` and see `20`.
    *   Type `change x = 100`.
    
2.  **The Debugger**:
    *   Write a recursive function in the editor:
        ```perc
        function fact(n) {
            if (n <= 1) then { return 1 }
            return n * fact(n - 1)
        }
        print(fact(5))
        ```
    *   Click the **Run** button.
    *   Watch the **Call Stack** pane grow as the function calls itself!

## Reference vs Value
PerC makes references explicit.
```perc
init list = [1, 2, 3]
ref alias = list      // 'ref' creates a reference.
init copy = list      // 'init' with a list creates a COPY.
```
This solves the "I changed the list in the function but it didn't change outside" confusion by forcing students to choose.

---
*PerC is built to make your life as a teacher easier by making the computer's behavior transparent to your students.*
