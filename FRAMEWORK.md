# TUI Framework

A modular, dependency-free Terminal User Interface framework in Node.js using plain JavaScript. Build interactive CLI applications with a React-like component model, efficient diffing-based rendering, and extensible architecture.

## Features

- **Zero Dependencies** - Pure Node.js, no external packages
- **React-like Hooks** - `useState`, `useEffect`, `useFocus` for state management
- **Efficient Rendering** - Diff-based rendering to avoid full screen redraws
- **Flexible Layout** - FlexBox and Grid-based layout engines
- **Event System** - Full event propagation with capture and bubble phases
- **Styling System** - Theme-based styling with ANSI abstraction
- **Input Handling** - Keyboard and mouse event processing
- **Pluggable Architecture** - Extend functionality without modifying core

## Architecture

```
src/
├── app/              # Application factory and entry points
├── core/             # Engine, Screen, Lifecycle, Config
├── dom/              # Node, Element, Fiber, Reconciler
├── events/           # EventEmitter, EventQueue, FocusManager
├── input/            # InputManager, Keymap, Parser
├── layout/           # LayoutEngine, FlexLayout, GridLayout
├── renderer/         # Renderer, Buffer, ANSI, Diff
├── scheduler/        # FrameLoop, Scheduler, TaskQueue
├── style/            # Colors, Style, Parser, Theme
├── themes/           # Default, Light, Dark themes
├── utils/            # Utilities: clamp, deepMerge, string, unicode
└── index.js          # Main entry point
```

## Quick Start

```javascript
const { createApp, useState, Element } = require('./src/index.js');

class MyApp extends Element {
  render() {
    return 'Hello, TUI!';
  }
}

const app = createApp();
const myApp = new MyApp();
app.render(myApp, document.body);
```

## Core Systems

### Hooks
- `useState(initialValue)` - Functional component state management
- `useEffect(callback, dependencies)` - Side effects with cleanup
- `useFocus()` - Focus state and control

### Layout
- `FlexLayout` - Flexbox-style layout (row/column, justify-content, align-items)
- `GridLayout` - CSS Grid-style layout with rows/columns and spans

### Styling
- `Colors` - Named color palette with ANSI code generation
- `Style` - Style object with text attributes (bold, italic, underline, etc.)
- `Theme` - Component-aware theming system

### Events
- `EventEmitter` - Pub/sub event system
- `FocusManager` - Focus state and focus change tracking
- Event propagation with capture and bubble phases

### Rendering
- `Buffer` - Terminal character grid with dirty tracking
- `Diff` - Efficient change detection between screens
- `ANSI` - ANSI escape sequence generation
- `Renderer` - Orchestrates rendering pipeline

## Modules Exported

**App:**
- `createApp(options)` - Create TUI application instance

**Hooks:**
- `useState`
- `useEffect`
- `useFocus`

**Core:**
- `Engine`
- `Screen`
- `Node`
- `Element`

**Renderer:**
- `Renderer`
- `Buffer`
- `ANSI`

**Layout:**
- `LayoutEngine`
- `FlexLayout`
- `GridLayout`

**Events:**
- `EventEmitter`
- `FocusManager`

**Input:**
- `InputManager`
- `Keymap`

**Styling:**
- `Colors`
- `Style`
- `Theme`
- `defaultTheme`
- `lightTheme`
- `darkTheme`

**Utilities:**
- `clamp`
- `deepMerge`

## Examples

See `examples/` directory for working examples.

## Development

The framework is organized in strict layers:

1. **Application Layer** - `createApp()` orchestrates all systems
2. **Core Layer** - Engine manages lifecycle and rendering cycles
3. **DOM Layer** - Fiber architecture for efficient reconciliation
4. **Renderer Layer** - Buffer, diffing, and ANSI output
5. **Layout Layer** - Flex and grid positioning
6. **Input Layer** - Keyboard and mouse parsing
7. **Event Layer** - Propagation and focus management
8. **Style Layer** - Colors, formatting, theming

Each layer has clear boundaries and minimal coupling, enabling independent testing and extension.

## Implementation Status

**Completed (Phases 1-7):**
- ✅ Utilities and base classes
- ✅ Screen and terminal abstraction
- ✅ Core engine and lifecycle
- ✅ ANSI rendering and buffering
- ✅ Diff-based optimization
- ✅ DOM and reconciliation
- ✅ Layout system (flex and grid)
- ✅ Event system and focus management
- ✅ Input handling foundation
- ✅ Hooks system (useState, useEffect, useFocus)
- ✅ Scheduler and frame loop
- ✅ Colors, styling, and themes
- ✅ Application factory and entry point

**In Progress (Phase 8-10):**
- Plugin system
- Widget implementations (Text, Box, Button, Input, etc.)
- Container components (Flex, Grid, Stack, Absolute)
- Examples and documentation

## Performance

- **Efficient rendering** - Only changed regions are updated to terminal
- **Non-blocking input** - Raw mode input processing doesn't block renders
- **Scheduled updates** - Priority-based task scheduling prevents starvation
- **Incremental rendering** - Fiber architecture enables incremental updates

## License

MIT
