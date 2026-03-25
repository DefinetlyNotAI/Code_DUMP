/**
 * Counter example - Simple state management demo.
 */
const { Element } = require('../src/index.js');

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

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}

// Demo usage
const counter = new Counter({});

console.log('Counter component created.');
console.log(counter.render());
counter.increment();
console.log('\nAfter increment:');
console.log(counter.render());

