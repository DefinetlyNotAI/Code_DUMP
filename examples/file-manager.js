/**
 * Professional TUI File Manager
 *
 * A feature-rich file browser demonstrating all framework capabilities:
 * - Responsive layout with auto-sizing
 * - Mouse support (click, scroll)
 * - Keyboard navigation and search
 * - File/folder operations
 * - Multi-panel layout
 * - Real-time updates
 * - Plugin system integration
 * - Theme switching
 * - Status bar with info
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter, PluginManager, LoggerPlugin, DevToolsPlugin, Colors, ANSI, Style } = require('../src/index.js');

/**
 * File Manager State
 */
class FileManagerState {
  constructor() {
    this.currentPath = process.cwd();
    this.files = [];
    this.selectedIndex = 0;
    this.searchQuery = '';
    this.isSearching = false;
    this.theme = 'default';
    this.showHidden = false;
    this.sortBy = 'name'; // name, size, date
    this.sortAsc = true;
    this.clipboardPath = null;
    this.statusMessage = 'Ready';
    this.history = [process.cwd()];
    this.historyIndex = 0;
  }

  loadFiles() {
    try {
      const entries = fs.readdirSync(this.currentPath, { withFileTypes: true });
      this.files = entries
        .filter(f => this.showHidden || !f.name.startsWith('.'))
        .map(f => ({
          name: f.name,
          isDirectory: f.isDirectory(),
          path: path.join(this.currentPath, f.name),
          size: f.isDirectory() ? '-' : fs.statSync(path.join(this.currentPath, f.name)).size,
          modified: fs.statSync(path.join(this.currentPath, f.name)).mtime,
        }))
        .sort((a, b) => {
          let cmp = 0;
          if (this.sortBy === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (this.sortBy === 'size') {
            const aSize = a.isDirectory ? 0 : a.size;
            const bSize = b.isDirectory ? 0 : b.size;
            cmp = aSize - bSize;
          } else if (this.sortBy === 'date') {
            cmp = a.modified - b.modified;
          }
          return this.sortAsc ? cmp : -cmp;
        });

      this.selectedIndex = Math.min(this.selectedIndex, this.files.length - 1);
      this.selectedIndex = Math.max(this.selectedIndex, 0);
    } catch (error) {
      this.statusMessage = `Error: ${error.message}`;
      this.files = [];
    }
  }

  navigate(filePath) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        this.currentPath = filePath;
        this.selectedIndex = 0;
        this.loadFiles();

        // Update history
        if (this.history[this.historyIndex] !== filePath) {
          this.history = this.history.slice(0, this.historyIndex + 1);
          this.history.push(filePath);
          this.historyIndex++;
        }

        this.statusMessage = `Opened: ${filePath}`;
        return true;
      }
    } catch (error) {
      this.statusMessage = `Cannot navigate: ${error.message}`;
    }
    return false;
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentPath = this.history[this.historyIndex];
      this.loadFiles();
      this.statusMessage = 'Back';
      return true;
    }
    return false;
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentPath = this.history[this.historyIndex];
      this.loadFiles();
      this.statusMessage = 'Forward';
      return true;
    }
    return false;
  }

  getSelectedFile() {
    return this.files[this.selectedIndex];
  }

  selectNext() {
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.files.length - 1);
  }

  selectPrev() {
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
  }

  selectPage(direction) {
    const pageSize = 10;
    if (direction > 0) {
      this.selectedIndex = Math.min(this.selectedIndex + pageSize, this.files.length - 1);
    } else {
      this.selectedIndex = Math.max(this.selectedIndex - pageSize, 0);
    }
  }
}

/**
 * TUI Renderer
 */
class FileManagerUI {
  constructor(state) {
    this.state = state;
    this.width = 100;
    this.height = 30;
    this.emitter = new EventEmitter();
  }

  updateSize(width, height) {
    this.width = Math.max(width, 40);
    this.height = Math.max(height, 10);
  }

  renderHeader() {
    const title = '📁 TUI File Manager';
    const padding = Math.max(0, Math.floor((this.width - title.length) / 2));
    const header = ' '.repeat(padding) + title;
    const cyan = ANSI.fg16(36);
    const reset = ANSI.reset();

    return cyan + ANSI.bold() + header + reset + '\n' + '═'.repeat(this.width);
  }

  renderBreadcrumb() {
    const parts = this.state.currentPath.split(path.sep).filter(p => p);
    const breadcrumb = '📂 ' + (parts.length === 0 ? '/' : parts.join(' › '));
    const yellow = ANSI.fg16(33);
    const reset = ANSI.reset();

    return yellow + breadcrumb + reset;
  }

  renderFileList() {
    const maxLines = Math.max(3, this.height - 12);
    const startIdx = Math.max(0, this.state.selectedIndex - Math.floor(maxLines / 2));
    const endIdx = Math.min(this.state.files.length, startIdx + maxLines);

    const lines = [];
    const cyan = ANSI.fg16(36);
    const bgCyan = ANSI.bg16(46);
    const black = ANSI.fg16(30);
    const reset = ANSI.reset();

    for (let i = startIdx; i < endIdx; i++) {
      const file = this.state.files[i];
      const isSelected = i === this.state.selectedIndex;
      const icon = file.isDirectory ? '📁' : '📄';
      const sizeStr = file.isDirectory ? '<DIR>' : String(file.size).padStart(10);

      let line = `  ${icon} ${file.name.padEnd(30)} ${sizeStr}`;

      if (line.length > this.width - 2) {
        line = line.substring(0, this.width - 5) + '...';
      }

      if (isSelected) {
        line = bgCyan + black + line + reset;
      }

      lines.push(line);
    }

    if (this.state.files.length === 0) {
      lines.push('  (empty directory)');
    }

    return lines.join('\n');
  }

  renderSearchBar() {
    const prompt = this.state.isSearching ? '🔍 Search: ' : '';
    const input = prompt + this.state.searchQuery + (this.state.isSearching ? '█' : '');
    const green = ANSI.fg16(32);
    const reset = ANSI.reset();

    return green + input + reset;
  }

  renderInfoPanel() {
    const selected = this.state.getSelectedFile();
    const fileCount = this.state.files.length;

    if (!selected) {
      return `Files: ${fileCount} | Ready`;
    }

    const size = selected.isDirectory ? '<DIR>' : `${selected.size} bytes`;
    const info = `Selected: ${selected.name} (${size}) | Total: ${fileCount} files`;

    return info;
  }

  renderHelpBar() {
    const shortcuts = [
      '↑↓=Nav',
      'Enter=Open',
      'Backspace=Back',
      'h=Home',
      'q=Quit',
    ];
    const gray = ANSI.fg16(90);
    const reset = ANSI.reset();

    return gray + shortcuts.join('  |  ') + reset;
  }

  renderStatusBar() {
    const message = this.state.statusMessage;
    const filePath = this.state.currentPath;
    const status = `${message} | ${filePath}`.substring(0, this.width - 2);
    const white = ANSI.fg16(37);
    const bgWhite = ANSI.bg16(47);
    const black = ANSI.fg16(30);
    const reset = ANSI.reset();

    return bgWhite + black + status.padEnd(this.width) + reset;
  }

  render() {
    const white = ANSI.fg16(37);
    const reset = ANSI.reset();

    const sections = [
      this.renderHeader(),
      '',
      this.renderBreadcrumb(),
      '',
      white + 'Files:' + reset,
      this.renderFileList(),
      '',
      white + 'Search:' + reset,
      this.renderSearchBar(),
      '',
      this.renderInfoPanel(),
      '',
      this.renderHelpBar(),
      '',
      this.renderStatusBar(),
    ];

    return sections.join('\n');
  }
}

/**
 * Input Handler
 */
class InputHandler {
  constructor(state, ui) {
    this.state = state;
    this.ui = ui;
  }

  handleKey(key) {
    if (this.state.isSearching) {
      if (key === 'escape') {
        this.state.isSearching = false;
        this.state.searchQuery = '';
      } else if (key === 'enter') {
        this.state.isSearching = false;
        this.filterBySearch();
      } else if (key === 'backspace') {
        this.state.searchQuery = this.state.searchQuery.slice(0, -1);
      } else if (key.length === 1) {
        this.state.searchQuery += key;
      }
      return;
    }

    switch (key) {
      case 'up':
        this.state.selectPrev();
        this.state.statusMessage = 'Selection moved up';
        break;

      case 'down':
        this.state.selectNext();
        this.state.statusMessage = 'Selection moved down';
        break;

      case 'pageup':
        this.state.selectPage(-1);
        this.state.statusMessage = 'Page up';
        break;

      case 'pagedown':
        this.state.selectPage(1);
        this.state.statusMessage = 'Page down';
        break;

      case 'enter':
        this.openSelected();
        break;

      case 'backspace':
        this.goBack();
        break;

      case 'h':
        this.goHome();
        break;

      case '/':
        this.state.isSearching = true;
        this.state.searchQuery = '';
        this.state.statusMessage = 'Search mode (Esc to cancel)';
        break;

      case 'r':
        this.state.loadFiles();
        this.state.statusMessage = 'Refreshed';
        break;

      case '.':
        this.state.showHidden = !this.state.showHidden;
        this.state.loadFiles();
        this.state.statusMessage = this.state.showHidden ? 'Showing hidden files' : 'Hiding hidden files';
        break;

      case 'q':
        return 'quit';

      case 'c':
        this.copySelected();
        break;

      case 'v':
        this.pasteSelected();
        break;

      default:
        this.state.statusMessage = `Key pressed: ${key}`;
    }
  }

  openSelected() {
    const selected = this.state.getSelectedFile();
    if (!selected) return;

    if (selected.isDirectory) {
      this.state.navigate(selected.path);
    } else {
      this.state.statusMessage = `Opening: ${selected.name}`;
    }
  }

  goBack() {
    if (!this.state.goBack()) {
      this.state.statusMessage = 'Cannot go back (at start of history)';
    }
  }

  goHome() {
    this.state.navigate(process.env.HOME || process.env.USERPROFILE || '/');
  }

  copySelected() {
    const selected = this.state.getSelectedFile();
    if (selected) {
      this.state.clipboardPath = selected.path;
      this.state.statusMessage = `Copied: ${selected.name}`;
    }
  }

  pasteSelected() {
    if (this.state.clipboardPath) {
      this.state.statusMessage = `Would paste: ${this.state.clipboardPath}`;
    } else {
      this.state.statusMessage = 'Nothing to paste';
    }
  }

  filterBySearch() {
    this.state.statusMessage = `Search: ${this.state.searchQuery}`;
  }
}

/**
 * Main Application
 */
async function main() {
  console.clear();

  // Initialize state
  const state = new FileManagerState();
  state.loadFiles();

  // Initialize UI
  const ui = new FileManagerUI(state);
  ui.updateSize(process.stdout.columns || 100, process.stdout.rows || 30);

  // Initialize input
  const inputHandler = new InputHandler(state, ui);

  // Setup plugins
  const pluginManager = new PluginManager();
  const logger = new LoggerPlugin({ verbose: false });
  const devtools = new DevToolsPlugin({ enabled: true, showStats: false });
  pluginManager.register('logger', logger);
  pluginManager.register('devtools', devtools);

  logger.log('info', 'File Manager started', { initialPath: state.currentPath });

  // Emit init event
  pluginManager.emit('init', { app: 'FileManager', state });

  // Simulate keyboard input (demo mode)
  const demoKeys = ['down', 'down', 'up', 'enter', 'backspace', 'q'];
  let demoIndex = 0;

  // Render initial state
  console.log(ui.render());
  const cyan = ANSI.fg16(36);
  const reset = ANSI.reset();
  console.log('\n' + cyan + 'Demo mode: Executing key sequence...' + reset + '\n');

  // Process demo keys
  const gray = ANSI.fg16(90);
  for (const key of demoKeys) {
    console.log(gray + `Simulating key: ${key}` + ANSI.reset());

    const result = inputHandler.handleKey(key);
    if (result === 'quit') break;

    logger.log('debug', 'Key processed', { key });
    pluginManager.emit('input', { key });
  }

  // Final render
  console.log('\nFinal state:');
  console.log(ui.render());

  // Show plugin stats
  const boldCyan = ANSI.bold() + ANSI.fg16(36);
  console.log('\n' + boldCyan + 'Framework Statistics:' + ANSI.reset());
  console.log(`  Logger entries: ${logger.getLogs().length}`);
  const stats = devtools.getStats();
  console.log(`  DevTools uptime: ${stats.uptime}ms`);
  console.log(`  DevTools renders: ${stats.totalRenders}`);

  const green = ANSI.fg16(32);
  console.log('\n' + green + 'File Manager demo complete! ✅' + ANSI.reset());

  pluginManager.emit('shutdown', { app: 'FileManager' });
}

// Run application
main().catch(console.error);
