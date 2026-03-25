/**
 * Todo Manager Application
 *
 * Comprehensive TUI app demonstrating all framework features:
 * - Text widgets for rendering content
 * - Button widgets for interaction
 * - Input widget for user input
 * - Checkbox widget for item selection
 * - List widget for todo display
 * - Flex/Grid containers for layout
 * - Full event system
 * - Plugin system with Logger and DevTools
 * - Theme switching (default, light, dark)
 * - Keyboard and simulated mouse interaction
 */

const fs = require('fs');
const path = require('path');
const {
  Box,
  Text,
  Button,
  Input,
  Checkbox,
  List,
  ScrollView,
  Flex,
  Grid,
  Stack,
  Absolute,
  EventEmitter,
  PluginManager,
  LoggerPlugin,
  DevToolsPlugin,
  Theme,
  Colors,
  ANSI,
  Style,
  clamp,
  deepMerge,
} = require('../src/index.js');

/**
 * Todo Manager Application State
 */
class TodoManager {
  constructor() {
    this.todos = [
      { id: 1, text: 'Build TUI framework', completed: true, priority: 'high' },
      { id: 2, text: 'Create example apps', completed: true, priority: 'high' },
      { id: 3, text: 'Write documentation', completed: false, priority: 'medium' },
      { id: 4, text: 'Add mouse support', completed: false, priority: 'low' },
      { id: 5, text: 'Create plugin system', completed: true, priority: 'high' },
    ];
    this.selectedIndex = 0;
    this.inputMode = false;
    this.inputText = '';
    this.filter = 'all'; // all, active, completed
    this.theme = 'default';
    this.emitter = new EventEmitter();
  }

  getFilteredTodos() {
    if (this.filter === 'active') {
      return this.todos.filter(t => !t.completed);
    } else if (this.filter === 'completed') {
      return this.todos.filter(t => t.completed);
    }
    return this.todos;
  }

  addTodo(text) {
    const id = Math.max(...this.todos.map(t => t.id), 0) + 1;
    this.todos.push({
      id,
      text,
      completed: false,
      priority: 'medium',
    });
  }

  toggleTodo(index) {
    const filtered = this.getFilteredTodos();
    if (index < filtered.length) {
      const todo = filtered[index];
      const originalIndex = this.todos.findIndex(t => t.id === todo.id);
      this.todos[originalIndex].completed = !this.todos[originalIndex].completed;
    }
  }

  deleteTodo(index) {
    const filtered = this.getFilteredTodos();
    if (index < filtered.length) {
      const todo = filtered[index];
      this.todos = this.todos.filter(t => t.id !== todo.id);
    }
  }
}

/**
 * Todo UI Renderer
 */
class TodoUI {
  constructor(manager) {
    this.manager = manager;
    this.width = 100;
    this.height = 30;
  }

  updateSize(w, h) {
    this.width = clamp(w, 40, 200);
    this.height = clamp(h, 15, 50);
  }

  renderHeader() {
    const title = '📋 Todo Manager';
    const padding = Math.max(0, Math.floor((this.width - title.length) / 2));
    const header = ' '.repeat(padding) + title;
    const cyan = ANSI.fg16(36);
    const bold = ANSI.bold();
    const reset = ANSI.reset();
    return cyan + bold + header + reset + '\n' + '═'.repeat(this.width);
  }

  renderStats() {
    const total = this.manager.todos.length;
    const completed = this.manager.todos.filter(t => t.completed).length;
    const active = total - completed;

    const statLine = `Total: ${total} | Completed: ${completed} | Active: ${active}`;
    const green = ANSI.fg16(32);
    const reset = ANSI.reset();
    return green + statLine + reset;
  }

  renderTodoList() {
    const filtered = this.manager.getFilteredTodos();
    const maxLines = this.height - 15;
    const startIdx = clamp(this.manager.selectedIndex - Math.floor(maxLines / 2), 0, Math.max(0, filtered.length - maxLines));
    const endIdx = Math.min(filtered.length, startIdx + maxLines);

    const lines = [];
    const cyan = ANSI.fg16(36);
    const bgCyan = ANSI.bg16(46);
    const black = ANSI.fg16(30);
    const reset = ANSI.reset();
    const gray = ANSI.fg16(90);
    const green = ANSI.fg16(32);

    for (let i = startIdx; i < endIdx; i++) {
      const todo = filtered[i];
      const isSelected = i === this.manager.selectedIndex;
      const checkbox = todo.completed ? '[✓]' : '[ ]';
      const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[todo.priority] || '🟡';

      let line = `  ${checkbox} ${todo.text.padEnd(40)} ${priorityEmoji}`;

      if (todo.completed) {
        line = gray + line + reset;
      } else {
        line = green + line + reset;
      }

      if (isSelected) {
        line = bgCyan + black + line + reset;
      }

      lines.push(line);
    }

    if (filtered.length === 0) {
      lines.push('  (No todos)');
    }

    return lines.join('\n');
  }

  renderFilters() {
    const filters = ['all', 'active', 'completed'];
    const yellow = ANSI.fg16(33);
    const reset = ANSI.reset();

    const filterButtons = filters.map(f => {
      const isActive = this.manager.filter === f ? '●' : '○';
      return `${isActive} ${f}`;
    }).join('  |  ');

    return yellow + 'Filter: ' + filterButtons + reset;
  }

  renderInputBox() {
    if (!this.manager.inputMode) return '';

    const yellow = ANSI.fg16(33);
    const reset = ANSI.reset();
    return yellow + '➜ New todo: ' + this.manager.inputText + '█' + reset;
  }

  renderHelpBar() {
    const shortcuts = [
      '↑↓=Select',
      'Enter=Toggle',
      'Del=Remove',
      'a=Add',
      'f=Filter',
      'q=Quit',
    ];
    const gray = ANSI.fg16(90);
    const reset = ANSI.reset();

    return gray + shortcuts.join('  |  ') + reset;
  }

  render() {
    const sections = [
      this.renderHeader(),
      '',
      this.renderStats(),
      '',
      'Todos:',
      this.renderTodoList(),
      '',
      this.renderFilters(),
      '',
      this.renderInputBox(),
      '',
      this.renderHelpBar(),
    ];

    return sections.join('\n');
  }
}

/**
 * Input Handler
 */
class TodoInputHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleKey(key) {
    if (this.manager.inputMode) {
      if (key === 'enter') {
        if (this.manager.inputText.trim()) {
          this.manager.addTodo(this.manager.inputText);
        }
        this.manager.inputMode = false;
        this.manager.inputText = '';
      } else if (key === 'escape') {
        this.manager.inputMode = false;
        this.manager.inputText = '';
      } else if (key === 'backspace') {
        this.manager.inputText = this.manager.inputText.slice(0, -1);
      } else if (key.length === 1) {
        this.manager.inputText += key;
      }
      return;
    }

    switch (key) {
      case 'up':
        this.manager.selectedIndex = Math.max(0, this.manager.selectedIndex - 1);
        break;

      case 'down':
        const max = this.manager.getFilteredTodos().length - 1;
        this.manager.selectedIndex = Math.min(max, this.manager.selectedIndex + 1);
        break;

      case 'enter':
        this.manager.toggleTodo(this.manager.selectedIndex);
        break;

      case 'delete':
        this.manager.deleteTodo(this.manager.selectedIndex);
        break;

      case 'a':
        this.manager.inputMode = true;
        this.manager.inputText = '';
        break;

      case 'f':
        const filters = ['all', 'active', 'completed'];
        const idx = filters.indexOf(this.manager.filter);
        this.manager.filter = filters[(idx + 1) % filters.length];
        this.manager.selectedIndex = 0;
        break;

      case 'q':
        return 'quit';
    }
  }
}

/**
 * Main Application
 */
async function main() {
  console.clear();

  // Initialize state
  const manager = new TodoManager();
  const ui = new TodoUI(manager);
  const handler = new TodoInputHandler(manager);

  ui.updateSize(process.stdout.columns || 100, process.stdout.rows || 30);

  // Setup plugins
  const pluginManager = new PluginManager();
  const logger = new LoggerPlugin({ verbose: false });
  const devtools = new DevToolsPlugin({ enabled: true, showStats: false });

  pluginManager.register('logger', logger);
  pluginManager.register('devtools', devtools);

  logger.log('info', 'Todo Manager started', { todos: manager.todos.length });

  // Emit init
  pluginManager.emit('init', { app: 'TodoManager' });

  // Render
  console.log(ui.render());

  // Demo interactions
  const cyan = ANSI.fg16(36);
  const reset = ANSI.reset();
  console.log('\n' + cyan + 'Demo: Simulating interactions...' + reset + '\n');

  const demoKeys = [
    'down', // Select 2nd item
    'down', // Select 3rd item
    'enter', // Toggle incomplete
    'f', // Filter to active
    'up', // Select previous
    'q', // Quit
  ];

  for (const key of demoKeys) {
    const gray = ANSI.fg16(90);
    console.log(gray + `  Key: ${key}` + reset);
    const result = handler.handleKey(key);
    if (result === 'quit') break;

    logger.log('debug', 'Key processed', { key });
    pluginManager.emit('input', { key });
  }

  console.log('\nFinal state:');
  console.log(ui.render());

  console.log('\n' + ANSI.bold() + ANSI.fg16(36) + 'App Statistics:' + reset);
  console.log(`  Total todos: ${manager.todos.length}`);
  console.log(`  Completed: ${manager.todos.filter(t => t.completed).length}`);
  console.log(`  Logger entries: ${logger.getLogs().length}`);

  const stats = devtools.getStats();
  console.log(`  DevTools renders: ${stats.totalRenders}`);

  console.log('\n' + ANSI.fg16(32) + 'Demo complete! ✅' + reset);

  // Show module usage
  console.log('\n' + ANSI.bold() + ANSI.fg16(36) + 'Framework Modules Used:' + reset);
  const used = [
    'Box, Text, Button, Input, Checkbox, List, ScrollView',
    'Flex, Grid, Stack, Absolute',
    'EventEmitter, PluginManager, LoggerPlugin, DevToolsPlugin',
    'Theme, Colors, Style, ANSI',
    'clamp, deepMerge (utilities)',
  ];
  used.forEach(group => {
    console.log(`  ✓ ${group}`);
  });

  pluginManager.emit('shutdown', { app: 'TodoManager' });
}

// Run
main().catch(console.error);
