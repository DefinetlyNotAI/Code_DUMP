#!/usr/bin/env node

/**
 * Advanced System Explorer
 * Demonstrates framework features with file browser.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class FileExplorer {
  constructor() {
    this.currentPath = process.cwd();
    this.items = [];
    this.selectedIndex = 0;
    this.history = [this.currentPath];
    this.historyIndex = 0;
    this.loadDirectory();
  }

  loadDirectory() {
    try {
      const entries = fs.readdirSync(this.currentPath, { withFileTypes: true });
      this.items = entries
        .map(entry => {
          const fullPath = path.join(this.currentPath, entry.name);
          const stats = fs.statSync(fullPath);
          return {
            name: entry.name,
            path: fullPath,
            isDir: entry.isDirectory(),
            size: stats.size,
            modified: new Date(stats.mtime).toLocaleDateString()
          };
        })
        .sort((a, b) => {
          if (a.isDir !== b.isDir) return b.isDir ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
      this.selectedIndex = 0;
    } catch (err) {
      this.items = [];
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.items.length - 1) {
      this.selectedIndex++;
    }
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }

  open() {
    if (this.items[this.selectedIndex]?.isDir) {
      this.currentPath = this.items[this.selectedIndex].path;
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(this.currentPath);
      this.historyIndex++;
      this.loadDirectory();
    }
  }

  back() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentPath = this.history[this.historyIndex];
      this.loadDirectory();
    }
  }

  forward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentPath = this.history[this.historyIndex];
      this.loadDirectory();
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + sizes[i];
  }

  getTerminalWidth() {
    return Math.max(60, (process.stdout.columns || 120) - 4);
  }

  render() {
    const width = this.getTerminalWidth();
    const border = '═'.repeat(width);
    const pathDisplay = this.currentPath.length > width - 10
      ? '...' + this.currentPath.slice(-(width - 13))
      : this.currentPath;

    const lines = [
      `╔${border}╗`,
      `║ Path: ${pathDisplay.padEnd(width - 8)}║`,
      `╠${border}╣`
    ];

    const displayItems = this.items.slice(0, 12);
    for (let i = 0; i < displayItems.length; i++) {
      const item = displayItems[i];
      const isSelected = i === this.selectedIndex;
      const icon = item.isDir ? '[DIR]' : '[FIL]';
      const prefix = isSelected ? '> ' : '  ';
      const nameLen = width - 30;
      const name = item.name.length > nameLen 
        ? item.name.substring(0, nameLen - 3) + '...'
        : item.name;
      const size = !item.isDir ? this.formatSize(item.size) : '     ';
      const display = `${prefix}${icon} ${name.padEnd(nameLen)} ${size.padStart(5)}`;
      lines.push(`║ ${display.padEnd(width - 2)}║`);
    }

    lines.push(`╠${border}╣`);
    const stats = `Items: ${this.items.length}`;
    lines.push(`║ ${stats.padEnd(width - 2)}║`);
    lines.push(`╚${border}╝`);

    return lines.join('\n');
  }
}

function main() {
  const explorer = new FileExplorer();
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  function showScreen() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        TUI File System Explorer                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
    console.log(explorer.render());
    console.log('\nNavigation: ↑↓ = Nav | Enter = Open Dir | Backspace = Back | q = Quit\n');
  }

  showScreen();

  process.stdin.on('data', (key) => {
    if (key === '\u0003' || key === 'q' || key === 'Q') {
      process.stdin.setRawMode(false);
      console.clear();
      console.log('Thank you for using File Explorer! 👋\n');
      process.exit(0);
    } else if (key === '\u001b[A' || key === 'w' || key === 'W') {
      explorer.navigateUp();
      showScreen();
    } else if (key === '\u001b[B' || key === 's' || key === 'S') {
      explorer.navigateDown();
      showScreen();
    } else if (key === '\r' || key === '\n' || key === ' ') {
      explorer.open();
      showScreen();
    } else if (key === '\u007f' || key === '\b') {
      explorer.back();
      showScreen();
    }
  });
}

main();
