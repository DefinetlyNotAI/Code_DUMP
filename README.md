# 🎨 TUI Framework

> A **zero-dependency**, modular Terminal UI framework built with plain JavaScript for Node.js. Create professional, interactive command-line applications with React-like components, hooks, and a powerful layout system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v18%2B-green.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-23%2F23-brightgreen.svg)
![Code Style](https://img.shields.io/badge/code_style-JavaScript-yellow.svg)

## ✨ Features

### 🚀 Core Architecture
- **Zero Dependencies** - Pure Node.js, no external packages
- **Layered Architecture** - Clean separation of concerns across 15+ modules
- **Modular Design** - Import only what you need, extend easily
- **React-Like Components** - Familiar patterns for interactive UIs
- **Efficient Rendering** - Diff-based screen updates, minimal ANSI output

### 🎨 Component System
- **7 Pre-built Widgets**
  - `Box` - Container with padding and styling
  - `Text` - Formatted text display
  - `Button` - Interactive buttons with focus
  - `Input` - Text input fields with cursor management
  - `Checkbox` - Toggle controls
  - `List` - Scrollable lists with selection
  - `ScrollView` - Horizontal/vertical scrolling

- **4 Layout Containers**
  - `Flex` - Flexbox-style layout (row/column, justify, align)
  - `Grid` - CSS Grid-style layout (columns, rows, gaps)
  - `Stack` - Convenient vertical flex wrapper
  - `Absolute` - Fixed positioning

### 🪝 Hooks System
- `useState` - State management in functional components
- `useEffect` - Side effects and lifecycle management
- `useFocus` - Focus state and control

### ⌨️ Input & Events
- **Keyboard Input** - 50+ keys, modifiers (ctrl, shift, alt)
- **Mouse Support** - Click detection and tracking
- **Event System** - Pub/sub with capture/bubble phases
- **Focus Management** - Navigate between interactive elements
- **Raw Terminal Mode** - Direct keyboard and mouse input

### 🎨 Styling & Themes
- **16-Color ANSI** - Standard terminal colors
- **256-Color Mode** - Extended color palette
- **Truecolor RGB** - Full 24-bit color support
- **Text Attributes** - Bold, dim, italic, underline, reverse, strikethrough
- **Built-in Themes** - Default, light, and dark themes
- **Custom Themes** - Define your own color schemes

### 📐 Layout System
- **Flex Layout Engine** - Direction, justify-content, align-items, gaps
- **Grid Layout Engine** - Template columns/rows, spans, auto-placement
- **Responsive** - Auto-adjusts to terminal size changes
- **Nested Layouts** - Compose complex UIs with recursive layouts
- **Measure Utilities** - Text width calculation, constraint resolution

### 🔌 Plugins
- **PluginManager** - Register and manage plugins
- **LoggerPlugin** - Diagnostics and event logging
- **DevToolsPlugin** - Component inspection and performance metrics

### ⚡ Performance
- **Fiber Architecture** - Incremental rendering updates
- **Diff-Based Rendering** - Only update changed regions
- **Task Scheduling** - Priority-based task queue (60 FPS safe)
- **Frame Loop** - Coordinated render cycles

## 📦 Installation

```bash
# Using npm
npm install tui-framework

# Or directly from repository
git clone https://github.com/yourusername/tui-framework.git
cd tui-framework
npm install
```

## 🚀 Quick Start

### Basic Counter App

```javascript
const { createApp, Element } = require('tui-framework');
const { Button } = require('tui-framework/widgets');

class Counter extends Element {
  constructor() {
    super({ type: 'counter' });
    this.count = 0;
  }

  increment() {
    this.count++;
  }

  render() {
    return `
╔═══════════════════════╗
║    Count: ${this.count.toString().padEnd(8)}║
║  Press: [+] [-]      ║
╚═══════════════════════╝
    `;
  }
}

const app = createApp(Counter);
app.render();
```

## 📚 Documentation

### Project Structure

```
tui/
├── src/
│   ├── app/              # Application factory
│   ├── core/             # Engine, Screen, Lifecycle
│   ├── dom/              # Node, Element, Fiber, Reconciler
│   ├── renderer/         # Buffer, Diff, ANSI, Cursor
│   ├── layout/           # FlexLayout, GridLayout, Measure
│   ├── input/            # InputManager, Keyboard, Mouse, Parser
│   ├── events/           # EventEmitter, FocusManager, Propagation
│   ├── hooks/            # useState, useEffect, useFocus
│   ├── scheduler/        # Scheduler, FrameLoop, TaskQueue
│   ├── style/            # Colors, Style, Theme
│   ├── widgets/          # Box, Text, Button, Input, etc.
│   ├── containers/       # Flex, Grid, Stack, Absolute
│   ├── plugins/          # PluginManager, LoggerPlugin, DevToolsPlugin
│   └── utils/            # Helpers and utilities
├── examples/             # Example applications
├── docs/                 # Feature documentation
└── tests/                # Test suite
```

### Core Concepts

#### Components
Components are the building blocks of your TUI application. They inherit from `Element` and can manage their own state.

```javascript
class MyComponent extends Element {
  constructor(props) {
    super(props);
    this.state = { /* ... */ };
  }

  render() {
    return 'Component output';
  }
}
```

#### State Management
Use `useState` hook or component state for managing component data.

```javascript
const [value, setValue] = useState('');

// State updates trigger re-render
setValue('new value');
```

#### Layouts
Use Flex or Grid containers to structure your UI.

```javascript
const layout = new Flex({
  direction: 'column',
  gap: 1,
  children: [header, content, footer]
});
```

#### Event Handling
Listen to keyboard, mouse, and focus events.

```javascript
element.addEventListener('keydown', (event) => {
  if (event.key === 'enter') {
    // Handle enter key
  }
});

element.addEventListener('focus', () => {
  // Handle focus change
});
```

## 🎯 Example Applications

### System Explorer
Advanced file manager TUI application:

```bash
node examples/system-explorer.js
```

Features:
- Directory navigation with file browsing
- Grid and list view modes
- Search functionality
- File details panel
- Theme switching

### Feature Demo
Interactive walkthrough of all framework features:

```bash
node examples/feature-demo.js
```

Covers:
- Components and widgets
- Layout systems
- Input handling
- Event system
- Hooks system
- Styling and themes
- Performance optimization

### Test App
Comprehensive test suite validating all systems:

```bash
node examples/test-app.js
```

Validates:
- Colors and ANSI codes
- Buffer system
- Layout engines
- Theme and style system
- All core functionality

### Additional Examples
- `counter.js` - Simple state management demo
- `todo-manager.js` - Full-featured todo application
- `file-manager.js` - File browser with advanced features

## 🔧 API Reference

### createApp(ComponentClass, options)
Initialize a TUI application.

```javascript
const app = createApp(MyComponent, {
  width: 120,
  height: 30,
  colors: 256
});
```

### Element
Base class for all components.

```javascript
class MyElement extends Element {
  constructor(props) {
    super(props);
  }
  
  render() {
    return 'Component content';
  }
}
```

### Hooks

#### useState
```javascript
const [state, setState] = useState(initialValue);
```

#### useEffect
```javascript
useEffect(() => {
  // Side effect
  return () => {
    // Cleanup (optional)
  };
}, [dependencies]);
```

#### useFocus
```javascript
const [isFocused, focus, blur] = useFocus();
```

### Widgets

#### Box
```javascript
new Box({
  padding: 1,
  border: 'single',
  background: 'blue'
})
```

#### Text
```javascript
new Text({
  content: 'Hello World',
  align: 'center',
  fg: 'red'
})
```

#### Button
```javascript
new Button({
  label: 'Click Me',
  onClick: () => console.log('Clicked!')
})
```

#### Input
```javascript
new Input({
  placeholder: 'Enter text...',
  onChange: (e) => console.log(e.value)
})
```

#### Checkbox
```javascript
new Checkbox({
  label: 'Accept terms',
  checked: false,
  onChange: (e) => console.log(e.checked)
})
```

#### List
```javascript
new List({
  items: ['Item 1', 'Item 2', 'Item 3'],
  onSelect: (item) => console.log(item)
})
```

#### ScrollView
```javascript
new ScrollView({
  content: 'Long content...',
  showScrollbars: true
})
```

### Containers

#### Flex
```javascript
new Flex({
  direction: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1,
  children: [/* ... */]
})
```

#### Grid
```javascript
new Grid({
  cols: 3,
  rows: 2,
  gap: 1,
  children: [/* ... */]
})
```

#### Stack
Vertical flex container (shorthand for `Flex` with `direction: 'column'`)

```javascript
new Stack({
  gap: 2,
  children: [/* ... */]
})
```

## 🎨 Theming

### Using Built-in Themes
```javascript
const { defaultTheme, lightTheme, darkTheme } = require('tui-framework');

app.theme = darkTheme;
```

### Creating Custom Themes
```javascript
const { Theme } = require('tui-framework');

const customTheme = new Theme('custom', {
  primary: 'blue',
  secondary: 'green',
  error: 'red'
}, {
  button: {
    default: { fg: 'white', bg: 'blue' },
    focused: { fg: 'blue', bg: 'white', bold: true }
  }
});
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

The framework includes:
- 23 automated tests
- 100% test pass rate
- Validation of all core systems
- Example app demonstrations

## 🔌 Plugins

### Creating a Plugin
```javascript
class MyPlugin {
  onRegister({ manager }) {
    console.log('Plugin registered');
  }

  onRender() {
    console.log('Rendering');
  }

  onInput(event) {
    console.log('Input:', event);
  }

  onShutdown() {
    console.log('Shutting down');
  }
}

app.plugins.register('myPlugin', new MyPlugin());
```

## ⚙️ Configuration

### Engine Configuration
```javascript
const config = {
  debug: false,
  colors: 256,
  fps: 60,
  theme: 'dark'
};
```

### Screen Options
```javascript
const options = {
  width: 120,
  height: 40,
  colors: 256,
  mouse: true,
  rawMode: true
};
```

## 📊 Performance

The framework is optimized for:
- **Minimal Terminal Output** - Diff-based rendering reduces network traffic
- **Efficient Rendering** - Only changed regions are redrawn
- **60 FPS Safe** - Task scheduling respects frame timing
- **Low Memory** - Modular architecture, no dependencies
- **Terminal Compatibility** - Works on xterm, Linux, macOS, Windows

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Maintain zero external dependencies
2. Keep modules focused and under 300 LOC
3. Add tests for new features
4. Update documentation
5. Follow existing code style

## 📝 License

MIT © 2024

## 🙏 Acknowledgments

Inspired by:
- React (component model, hooks)
- Vue (composition patterns)
- Ink (terminal React rendering)
- Blessed (terminal UI libraries)

## 🚀 Roadmap

- [ ] More widgets (DatePicker, ColorPicker, FilePicker)
- [ ] Animation system
- [ ] Web socket support for remote TUIs
- [ ] TypeScript definitions
- [ ] Performance profiling tools
- [ ] Accessibility features

## 💬 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review example applications
- Examine test suite

## 📞 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

**Happy building! Create amazing terminal UIs with TUI Framework.** 🎉
