/**
 * Counter example - Demonstrates hooks and state management.
 */
const { createApp, useState, Element } = require('../src/index.js');

class Counter extends Element {
  constructor(props) {
    super(props);
    this.count = 0;
  }

  render() {
    const content = [
      '',
      '  ╔════════════════════════╗',
      '  ║   Counter Demo         ║',
      '  ╠════════════════════════╣',
      `  ║  Count: ${String(this.count).padStart(18, ' ')} ║`,
      '  ║                        ║',
      '  ║  [+] Increment         ║',
      '  ║  [-] Decrement         ║',
      '  ║  [Q] Quit              ║',
      '  ╚════════════════════════╝',
      '',
    ];

    return content.join('\n');
  }

  handleInput(event) {
    if (event.key === '+') {
      this.count++;
      this.triggerRender();
    } else if (event.key === '-') {
      this.count--;
      this.triggerRender();
    } else if (event.key === 'q' || event.key === 'Q') {
      process.exit(0);
    }
  }

  triggerRender() {
    if (this.onUpdate) {
      this.onUpdate();
    }
  }
}

const app = createApp({
  debug: false,
});

const counter = new Counter({});

console.log('Counter example created. Starting app...');

const unrender = app.render(counter, document.body);

console.log('Counter app is running. Press keys to interact.');
