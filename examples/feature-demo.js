#!/usr/bin/env node

/**
 * Interactive Feature Test & Demo Module
 * 
 * Demonstrates all TUI framework features interactively:
 * - Component system and rendering
 * - All widgets (Box, Text, Button, Input, Checkbox, List, ScrollView)
 * - Layout systems (Flex, Grid)
 * - Input handling (keyboard, mouse)
 * - Event system (focus, click)
 * - Hooks (useState, useEffect, useFocus)
 * - Styling and theming
 * - Plugin system
 */

const { createApp, Element } = require('../src/index.js');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { Button } = require('../src/widgets/Button');
const { Input } = require('../src/widgets/Input');
const { Checkbox } = require('../src/widgets/Checkbox');
const { List } = require('../src/widgets/List');
const { ScrollView } = require('../src/widgets/ScrollView');
const { Flex } = require('../src/containers/Flex');
const { Grid } = require('../src/containers/Grid');
const { Stack } = require('../src/containers/Stack');

class FeatureDemo extends Element {
  constructor() {
    super({ type: 'feature-demo' });
    this.currentDemo = 0;
    this.demos = [
      { name: 'Welcome', id: 'welcome' },
      { name: 'Components & Widgets', id: 'components' },
      { name: 'Layout Systems', id: 'layout' },
      { name: 'Input Handling', id: 'input' },
      { name: 'Event System', id: 'events' },
      { name: 'Hooks System', id: 'hooks' },
      { name: 'Styling & Themes', id: 'styling' },
      { name: 'Performance', id: 'performance' }
    ];
    this.demoState = {
      inputValue: '',
      checkboxes: [false, false, false],
      selectedListItem: 0,
      listItems: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
      clickCount: 0,
      focusedInput: 0
    };
  }

  getCurrentDemo() {
    return this.demos[this.currentDemo];
  }

  nextDemo() {
    this.currentDemo = (this.currentDemo + 1) % this.demos.length;
  }

  prevDemo() {
    this.currentDemo = (this.currentDemo - 1 + this.demos.length) % this.demos.length;
  }

  renderMenu() {
    const lines = [];
    lines.push('╔════════════ FEATURE DEMO MENU ════════════╗');
    
    for (let i = 0; i < this.demos.length; i++) {
      const demo = this.demos[i];
      const isSelected = i === this.currentDemo;
      const prefix = isSelected ? '❯ ' : '  ';
      lines.push(`║ ${prefix}${i + 1}. ${demo.name.padEnd(33)}║`);
    }
    
    lines.push('╚════════════════════════════════════════════╝');
    return lines.join('\n');
  }

  renderWelcome() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                     🎉 Welcome to TUI Framework Feature Demo                       ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  This interactive demo showcases all major features of the TUI Framework:         ║
║                                                                                    ║
║  ✨ Component System       - React-like component tree management                  ║
║  🎨 Widgets              - Box, Text, Button, Input, Checkbox, List, ScrollView   ║
║  📐 Layout Systems       - Flex and Grid layout engines                            ║
║  ⌨️  Input Handling       - Keyboard and mouse event support                       ║
║  🔔 Event System         - Event propagation and focus management                  ║
║  🪝 Hooks                - useState, useEffect, useFocus hooks                     ║
║  🎨 Styling & Themes     - CSS-like styling and theme switching                    ║
║  ⚡ Performance          - Diff-based rendering and optimization                   ║
║                                                                                    ║
║  Navigation: ← → or A/D = Change Demo | Enter = Select | q = Quit                 ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderComponents() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                            📦 Components & Widgets Demo                            ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  TUI Framework provides 7 pre-built widgets:                                       ║
║                                                                                    ║
║  1️⃣  Box        - Generic container with padding and styling                      ║
║  2️⃣  Text       - Text display with formatting and alignment                      ║
║  3️⃣  Button     - Interactive button with focus support                           ║
║  4️⃣  Input      - Text input field with cursor management                         ║
║  5️⃣  Checkbox   - Checkbox control with toggle state                              ║
║  6️⃣  List       - Scrollable list with selection management                       ║
║  7️⃣  ScrollView - Container with horizontal/vertical scrolling                    ║
║                                                                                    ║
║  All widgets inherit from Element and support:                                     ║
║  - Props for configuration                                                         ║
║  - State management                                                                ║
║  - Event handling                                                                  ║
║  - Focus management                                                                ║
║  - Styling and theming                                                             ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderLayout() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                          📐 Layout Systems Demo                                    ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  TUI Framework includes two powerful layout engines:                               ║
║                                                                                    ║
║  📊 Flex Layout                                                                    ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Direction: row or column                                                        ║
║  - Justify-content: flex-start, center, space-between, space-around               ║
║  - Align-items: flex-start, center, stretch                                       ║
║  - Gap and padding support                                                         ║
║                                                                                    ║
║  Grid Layout                                                                       ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Template columns and rows (fixed or fractional)                                 ║
║  - Column and row span                                                             ║
║  - Gap support                                                                      ║
║  - Auto-placement of items                                                         ║
║                                                                                    ║
║  Both layouts work recursively, allowing nested layouts for complex UIs.           ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderInput() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                          ⌨️  Input Handling Demo                                   ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  The framework provides comprehensive input support:                               ║
║                                                                                    ║
║  🎮 Keyboard Input                                                                 ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Raw input mode parsing                                                          ║
║  - Support for 50+ keys (arrows, F1-F12, modifiers)                               ║
║  - Customizable key mappings                                                       ║
║  - Keyboard events with modifiers (ctrl, shift, alt)                              ║
║                                                                                    ║
║  🖱️  Mouse Input (basic support)                                                   ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Mouse event parsing                                                             ║
║  - Click position detection                                                        ║
║  - Button state tracking                                                           ║
║                                                                                    ║
║  🎯 Input Manager                                                                  ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Central input coordination                                                       ║
║  - Event queue and dispatch                                                        ║
║  - Terminal resize event handling                                                  ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderEvents() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                         🔔 Event System Demo                                       ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  The event system provides:                                                        ║
║                                                                                    ║
║  📢 Event Emission                                                                 ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Publish-subscribe pattern (on, off, emit)                                      ║
║  - Once listeners for single-fire events                                          ║
║  - Listener count and management                                                   ║
║                                                                                    ║
║  🔁 Event Propagation                                                              ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Capture phase (parent to target)                                               ║
║  - Target phase (direct event)                                                     ║
║  - Bubble phase (target to parent)                                                ║
║  - Stop propagation and preventDefault                                            ║
║                                                                                    ║
║  🎯 Focus Management                                                               ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Track focused component                                                         ║
║  - Focus/blur events                                                               ║
║  - Focus history and restoration                                                   ║
║  - Visual focus indicators                                                         ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderHooks() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                          🪝 Hooks System Demo                                      ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  React-like hooks for state and side effect management:                            ║
║                                                                                    ║
║  1️⃣  useState                                                                      ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  const [state, setState] = useState(initialValue)                                  ║
║  - Local component state                                                           ║
║  - setState triggers re-render                                                     ║
║  - Functional state updates supported                                              ║
║                                                                                    ║
║  2️⃣  useEffect                                                                     ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  useEffect(effect, dependencies)                                                   ║
║  - Run side effects after render                                                   ║
║  - Dependency array controls when effect runs                                      ║
║  - Cleanup function support for teardown                                           ║
║                                                                                    ║
║  3️⃣  useFocus                                                                      ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  const [isFocused, focus, blur] = useFocus()                                       ║
║  - Get and control focus state                                                     ║
║  - Integrate with FocusManager                                                     ║
║  - Keyboard navigation support                                                     ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderStyling() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                        🎨 Styling & Themes Demo                                    ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  CSS-like styling system with theme support:                                       ║
║                                                                                    ║
║  🎨 Style Properties                                                               ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Foreground/background colors                                                    ║
║  - Text attributes (bold, dim, italic, underline, reverse, hidden)                ║
║  - Style composition and merging                                                   ║
║  - ANSI code generation                                                            ║
║                                                                                    ║
║  🎭 Color Support                                                                  ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - 16-color palette (ANSI)                                                         ║
║  - 256-color palette (extended)                                                    ║
║  - Truecolor RGB support                                                           ║
║  - Named colors and hex conversion                                                 ║
║                                                                                    ║
║  🌍 Themes                                                                         ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Theme management and switching                                                  ║
║  - Component-level style defaults                                                  ║
║  - Built-in themes: default, light, dark                                          ║
║  - Custom theme creation                                                           ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderPerformance() {
    return `
╔════════════════════════════════════════════════════════════════════════════════════╗
║                          ⚡ Performance & Optimization                             ║
╠════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  The framework is optimized for terminal rendering:                                ║
║                                                                                    ║
║  📊 Diff-Based Rendering                                                           ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Compare old and new buffer states                                               ║
║  - Only write changed regions to terminal                                          ║
║  - Reduces flickering and network traffic (useful for remote SSH)                  ║
║                                                                                    ║
║  🔄 Fiber Architecture                                                             ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Incremental rendering updates                                                   ║
║  - Work scheduling prevents event loop blocking                                    ║
║  - Effect batching for efficiency                                                  ║
║                                                                                    ║
║  📋 Task Scheduling                                                                ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - Priority-based task queue                                                       ║
║  - Immediate, normal, and deferred priorities                                      ║
║  - Frame-based scheduling (60 FPS safe)                                           ║
║                                                                                    ║
║  🔌 Plugins                                                                        ║
║  ────────────────────────────────────────────────────────────────────────────────  ║
║  - LoggerPlugin for diagnostics                                                    ║
║  - DevToolsPlugin for debugging                                                    ║
║  - Extensible plugin API                                                           ║
║                                                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  render() {
    const demo = this.getCurrentDemo();
    let content = '';

    switch (demo.id) {
      case 'welcome':
        content = this.renderWelcome();
        break;
      case 'components':
        content = this.renderComponents();
        break;
      case 'layout':
        content = this.renderLayout();
        break;
      case 'input':
        content = this.renderInput();
        break;
      case 'events':
        content = this.renderEvents();
        break;
      case 'hooks':
        content = this.renderHooks();
        break;
      case 'styling':
        content = this.renderStyling();
        break;
      case 'performance':
        content = this.renderPerformance();
        break;
      default:
        content = this.renderWelcome();
    }

    const menu = this.renderMenu();
    const footer = `\n[${this.currentDemo + 1}/${this.demos.length}] ← → or A/D = Navigate | Enter = Demo Details | q = Quit`;

    return content + '\n' + menu + footer;
  }
}

// Create and run the app
async function run() {
  const app = createApp(FeatureDemo, {
    width: 90,
    height: 40,
    colors: 256
  });

  const demo = app.root;

  // Handle keyboard input
  process.stdin.on('data', (buffer) => {
    const char = buffer.toString('utf-8').trim().toLowerCase();

    switch (char) {
      case 'arrowright':
      case 'd':
        demo.nextDemo();
        break;
      case 'arrowleft':
      case 'a':
        demo.prevDemo();
        break;
      case 'enter':
        console.log(`\nOpening ${demo.getCurrentDemo().name} demo...\n`);
        break;
      case 'q':
        console.log('\nThank you for using TUI Framework! 👋\n');
        process.exit(0);
    }

    app.render();
  });

  // Render the initial state
  app.render();
}

run().catch(console.error);
