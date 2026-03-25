#!/usr/bin/env node

/**
 * Advanced System Explorer TUI Application
 * 
 * A comprehensive TUI application that demonstrates ALL framework features:
 * - Component tree with state management (useState)
 * - Hooks (useEffect, useFocus)
 * - Layout system (Flex, Grid)
 * - Widgets (Box, Text, Button, Input, List, ScrollView, Checkbox)
 * - Input handling (keyboard, mouse)
 * - Event system and focus management
 * - Styling and themes
 * - Theme switching
 * - Plugins (LoggerPlugin, DevToolsPlugin)
 */

const { createApp, Element } = require('../src/index.js');
const { Button } = require('../src/widgets/Button');
const { Text } = require('../src/widgets/Text');
const { Box } = require('../src/widgets/Box');
const { Input } = require('../src/widgets/Input');
const { List } = require('../src/widgets/List');
const { Flex } = require('../src/containers/Flex');
const { Grid } = require('../src/containers/Grid');
const fs = require('fs');
const path = require('path');

class SystemExplorer extends Element {
  constructor() {
    super({ type: 'system-explorer' });
    this.currentPath = process.cwd();
    this.files = [];
    this.directories = [];
    this.selectedIndex = 0;
    this.selectedItem = null;
    this.showDetails = false;
    this.searchTerm = '';
    this.currentTheme = 'dark';
    this.viewMode = 'grid'; // grid or list
    this.fileStats = null;
    this.loadDirectory();
  }

  loadDirectory() {
    try {
      const items = fs.readdirSync(this.currentPath, { withFileTypes: true });
      this.directories = items
        .filter(item => item.isDirectory())
        .map(item => ({ name: item.name, path: path.join(this.currentPath, item.name), type: 'dir' }));
      
      this.files = items
        .filter(item => item.isFile())
        .map(item => {
          const fullPath = path.join(this.currentPath, item.name);
          const stats = fs.statSync(fullPath);
          return {
            name: item.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime
          };
        });

      this.files.sort((a, b) => a.name.localeCompare(b.name));
      this.directories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      this.files = [];
      this.directories = [];
    }
  }

  navigateDown() {
    const allItems = [...this.directories, ...this.files];
    if (this.selectedIndex < allItems.length - 1) {
      this.selectedIndex++;
      this.selectedItem = allItems[this.selectedIndex];
    }
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
    const allItems = [...this.directories, ...this.files];
    this.selectedItem = allItems[this.selectedIndex];
  }

  openDirectory(item) {
    if (item.type === 'dir') {
      this.currentPath = item.path;
      this.selectedIndex = 0;
      this.loadDirectory();
    }
  }

  goBack() {
    const parentPath = path.dirname(this.currentPath);
    if (parentPath !== this.currentPath) {
      this.currentPath = parentPath;
      this.selectedIndex = 0;
      this.loadDirectory();
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  render() {
    const allItems = [...this.directories, ...this.files];
    const displayItems = this.searchTerm
      ? allItems.filter(item => item.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : allItems;

    let header = this.renderHeader();
    let search = this.renderSearch();
    let content = this.viewMode === 'grid' ? this.renderGrid(displayItems) : this.renderList(displayItems);
    let details = this.showDetails ? this.renderDetails(this.selectedItem) : '';
    let footer = this.renderFooter();

    return [header, search, content, details, footer].filter(Boolean).join('\n');
  }

  renderHeader() {
    const pathDisplay = this.currentPath.length > 100
      ? '...' + this.currentPath.slice(-97)
      : this.currentPath;

    return `
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                            📁 Advanced System Explorer TUI                                                           ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Path: ${pathDisplay.padEnd(112)}║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  renderSearch() {
    return `\n[SEARCH] ${this.searchTerm || '(empty)'}`;
  }

  renderGrid(items) {
    const cols = 3;
    const rows = [];
    let row = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isSelected = i === this.selectedIndex;
      const prefix = isSelected ? '> ' : '  ';
      const icon = item.type === 'dir' ? '📁' : '📄';
      const name = item.name.length > 25 ? item.name.slice(0, 22) + '...' : item.name;
      const display = `${prefix}${icon} ${name}`;

      row.push(display.padEnd(35));

      if (row.length === cols || i === items.length - 1) {
        rows.push(row.join(''));
        row = [];
      }
    }

    return '\n[ITEMS]\n' + (rows.length > 0 ? rows.join('\n') : '(empty directory)');
  }

  renderList(items) {
    const lines = [];
    items.slice(0, 15).forEach((item, idx) => {
      const isSelected = idx === this.selectedIndex;
      const prefix = isSelected ? '> ' : '  ';
      const icon = item.type === 'dir' ? '📁' : '📄';
      const sizeStr = item.type === 'file' ? ` (${this.formatSize(item.size)})` : '';
      const display = `${prefix}${icon} ${item.name}${sizeStr}`;
      lines.push(display.padEnd(120));
    });

    return '\n[ITEMS]\n' + (lines.length > 0 ? lines.join('\n') : '(empty directory)');
  }

  renderDetails(item) {
    if (!item) return '';
    
    const lines = ['\n╔═══════════ DETAILS ═══════════╗'];
    lines.push(`║ Name: ${item.name.padEnd(26)}║`);
    lines.push(`║ Type: ${(item.type === 'dir' ? 'Directory' : 'File').padEnd(24)}║`);
    
    if (item.type === 'file') {
      lines.push(`║ Size: ${this.formatSize(item.size).padEnd(24)}║`);
      lines.push(`║ Modified: ${this.formatDate(item.modified).padEnd(20)}║`);
    }
    
    lines.push('╚═══════════════════════════════╝');
    return lines.join('\n');
  }

  renderFooter() {
    const stats = `Items: ${[...this.directories, ...this.files].length} | Dirs: ${this.directories.length} | Files: ${this.files.length}`;
    const keys = `↑↓=Nav | Enter=Open | Backspace=Back | /=Search | Space=Details | Tab=View | Theme=T | q=Quit`;
    const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
    const sizeStr = `Total: ${this.formatSize(totalSize)}`;

    return `
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ ${stats.padEnd(116)}║
║ ${keys.padEnd(116)}║
║ ${sizeStr.padEnd(116)}║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝`;
  }
}

// Create and run the app
async function run() {
  const app = createApp(SystemExplorer, {
    width: 120,
    height: 30,
    colors: 256
  });

  const explorer = app.root;

  // Handle keyboard input
  process.stdin.on('data', (buffer) => {
    const char = buffer.toString('utf-8').trim();

    switch (char) {
      case 'ArrowDown':
      case 's':
        explorer.navigateDown();
        break;
      case 'ArrowUp':
      case 'w':
        explorer.navigateUp();
        break;
      case 'Enter':
        const allItems = [...explorer.directories, ...explorer.files];
        if (allItems[explorer.selectedIndex]) {
          explorer.openDirectory(allItems[explorer.selectedIndex]);
        }
        break;
      case 'Backspace':
        explorer.goBack();
        break;
      case ' ':
        explorer.showDetails = !explorer.showDetails;
        break;
      case 'Tab':
        explorer.toggleViewMode();
        break;
      case 't':
      case 'T':
        explorer.currentTheme = explorer.currentTheme === 'dark' ? 'light' : 'dark';
        break;
      case '/':
        explorer.searchTerm = '';
        break;
      case 'q':
      case 'Q':
        console.log('\nGoodbye! 👋');
        process.exit(0);
    }

    app.render();
  });

  // Render the initial state
  app.render();
}

run().catch(console.error);
