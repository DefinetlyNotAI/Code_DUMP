#!/usr/bin/env node

/**
 * Interactive Feature Test & Demo Module
 * Demonstrates TUI framework features with simple terminal interface.
 */

const readline = require('readline');

const demos = [
  { name: 'Welcome', id: 'welcome' },
  { name: 'Components & Widgets', id: 'components' },
  { name: 'Layout Systems', id: 'layout' },
  { name: 'Input Handling', id: 'input' },
  { name: 'Event System', id: 'events' },
  { name: 'Hooks System', id: 'hooks' },
  { name: 'Styling & Themes', id: 'styling' },
  { name: 'Performance', id: 'performance' }
];

let currentDemo = 0;

function getTerminalWidth() {
  return Math.max(40, (process.stdout.columns || 80) - 4);
}

function renderBox(title, content) {
  const width = getTerminalWidth();
  const border = '═'.repeat(width);
  
  const lines = [
    `╔${border}╗`,
    `║ ${title.padEnd(width - 2)}║`,
    `╠${border}╣`
  ];
  
  const contentLines = content.split('\n');
  for (const line of contentLines) {
    const trimmed = line.substring(0, width - 2).padEnd(width - 2);
    lines.push(`║ ${trimmed}║`);
  }
  
  lines.push(`╚${border}╝`);
  return lines.join('\n');
}

function getContent() {
  const demo = demos[currentDemo];
  
  switch (demo.id) {
    case 'welcome':
      return 'Welcome to TUI Framework Feature Demo!\n\nThis interactive demo showcases all major framework features.\n\nUse arrow keys or W/S to navigate between demos.\n\nPress q to exit.';
    case 'components':
      return 'COMPONENTS & WIDGETS\n\n7 pre-built widgets:\n• Box - Container with padding and styling\n• Text - Formatted text display\n• Button - Interactive buttons with focus\n• Input - Text input with cursor\n• Checkbox - Toggle controls\n• List - Scrollable lists\n• ScrollView - Scrollable containers';
    case 'layout':
      return 'LAYOUT SYSTEMS\n\nFlex Layout:\n• Direction: row or column\n• justify-content & align-items\n• Gap support\n\nGrid Layout:\n• Columns and rows\n• Spans and auto-placement\n• Gap support';
    case 'input':
      return 'INPUT HANDLING\n\nKeyboard Input:\n• 50+ keys support\n• Modifiers: ctrl, shift, alt\n• Raw terminal mode\n\nMouse Input:\n• Click detection\n• Position tracking';
    case 'events':
      return 'EVENT SYSTEM\n\n• Event emission (pub/sub)\n• Event propagation phases\n• Capture and bubble\n• Focus management\n• Event queue dispatch';
    case 'hooks':
      return 'HOOKS SYSTEM\n\n• useState - Local state\n• useEffect - Side effects\n• useFocus - Focus control\n\nReact-like patterns for easy component development.';
    case 'styling':
      return 'STYLING & THEMES\n\n• 16-color ANSI support\n• 256-color palette\n• Truecolor RGB\n• Text attributes (bold, italic, underline)\n• Built-in themes';
    case 'performance':
      return 'PERFORMANCE\n\n• Diff-based rendering\n• Fiber architecture\n• Task scheduling\n• Frame loop coordination\n• Optimized output';
    default:
      return 'Unknown demo';
  }
}

function renderMenu() {
  let menu = 'Navigation Menu:\n\n';
  for (let i = 0; i < demos.length; i++) {
    const prefix = i === currentDemo ? '> ' : '  ';
    menu += `${prefix}${i + 1}. ${demos[i].name}\n`;
  }
  return menu;
}

function showScreen() {
  console.clear();
  
  // Dynamic header based on terminal width
  const headerWidth = getTerminalWidth();
  const headerBorder = '═'.repeat(headerWidth);
  const title = 'TUI Framework Feature Demo & Interactive Tour';
  const padding = Math.max(0, headerWidth - title.length - 2);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log(`╔${headerBorder}╗`);
  console.log(`║${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}║`);
  console.log(`╚${headerBorder}╝\n`);
  
  const content = getContent();
  const box = renderBox(demos[currentDemo].name, content);
  console.log(box);
  
  console.log();
  console.log(renderMenu());
  console.log('Navigation: ↑↓ or W/S = Change | q = Quit\n');
}

function main() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  showScreen();

  process.stdin.on('data', (key) => {
    if (key === '\u0003' || key === 'q' || key === 'Q') {
      process.stdin.setRawMode(false);
      console.clear();
      console.log('Thank you for using TUI Framework! 👋\n');
      process.exit(0);
    } else if (key === '\u001b[A' || key === 'w' || key === 'W') {
      currentDemo = (currentDemo - 1 + demos.length) % demos.length;
      showScreen();
    } else if (key === '\u001b[B' || key === 's' || key === 'S') {
      currentDemo = (currentDemo + 1) % demos.length;
      showScreen();
    }
  });
}

main();
