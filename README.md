# PerC: The Learning Language for AP CS Principles

PerC (pedagogically reduced computer language) is a programming language and integrated development environment (IDE) specifically designed for students learning computer science through the AP CS Principles framework. It prioritizes clarity, immediate feedback, and accessibility.

> [!NOTE]
> This project was created with heavy assistance from AI coding agents.

## Why PerC?

Traditional programming languages often have steep learning curves due to complex syntax and opaque error messages. PerC aims to lower these barriers, allowing students to focus on the core concepts of algorithms, data representation, and abstraction.

### Student-Centric Features

- **Intent-Based Variables**: Helps reduce common "typo" bugs by requiring `init` for new variables and `change` for modifications. This pattern encourages students to explicitly state their intent.
- **Immediate-Mode Graphics**: A minimalist GUI system for creating interactive games and visualizations without needing to understand complex event loops or DOM manipulation.
- **Rich Data Representation**: Built-in support for hex/binary integers, RGB/HSL colors, and pixel-perfect sprite graphics helps students engage with the "Data" big idea of AP CSP.
- **Integrated Debugger**: A high-level, stack-based debugger that lets students step through their code and see the impact on variables and the call stack in real-time.

### Accessible by Design

PerC is built to be inclusive from the ground up, with the goal to eventually meet WCAG 2.1 Level AA standards:
- **Screen Reader Friendly**: ARIA support and semantic HTML help visually impaired students navigate the IDE.
- **Keyboard Navigation**: Built to support keyboard-only navigation, including the resizable pane splitters.
- **High Contrast & Customization**: Supports multiple themes (Light, Dark, High Contrast) and independent font scaling for every pane.
- **No Install Necessary**: Runs entirely in the browser, making it compatible with Chromebooks and older hardware often found in schools.

### Development & Contributing

If you wish to host your own instance or contribute to the project:

1. **Install Dependencies**: `npm install`
2. **Run Dev Server**: `npm run dev`
3. **Build for Production**: `npm run build`

The project is built using **TypeScript**, **SolidJS**, and **Vite**, targeting modern browser standards while maintaining a small footprint.

## License

This project is licensed under the GPL License - see the LICENSE file for details.