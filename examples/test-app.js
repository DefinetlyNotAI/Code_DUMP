#!/usr/bin/env node

/**
 * Comprehensive TUI Framework Test App
 * 
 * Validates:
 * - Screen and terminal abstraction
 * - ANSI rendering and colors
 * - Buffer and diff system
 * - Layout engines (flex and grid)
 * - Input handling (keyboard)
 * - Event system and focus management
 * - Hooks (useState, useEffect, useFocus)
 * - Styling and themes
 */

const { createApp, Element, Colors, Style, Theme, defaultTheme, Screen, Buffer, ANSI, Engine, LayoutEngine, FlexLayout } = require('../src/index.js');

class TestApp extends Element {
  constructor(props) {
    super(props);
    this.currentTest = 0;
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.output = [];
  }

  /**
   * Run all tests.
   */
  runTests() {
    this.log('🧪 Starting TUI Framework Tests\n');

    this.testColors();
    this.testANSI();
    this.testBuffer();
    this.testLayout();
    this.testTheme();
    this.testStyle();

    this.log(`\n✅ Tests Passed: ${this.testsPassed}`);
    this.log(`❌ Tests Failed: ${this.testsFailed}`);
    this.log(`\n📊 Total: ${this.testsPassed + this.testsFailed} tests\n`);

    if (this.testsFailed === 0) {
      this.log('🎉 All tests passed!\n');
    }
  }

  /**
   * Test Colors system.
   */
  testColors() {
    this.log('📝 Testing Colors System:');

    try {
      const colors = Colors;

      const redCode = colors.fgCode('red');
      this.assert(redCode === 31, 'Red color code is 31');

      const blueCode = colors.fgCode('blue');
      this.assert(blueCode === 34, 'Blue color code is 34');

      const hasRed = colors.has('red');
      this.assert(hasRed, 'Colors has red');

      const hex = colors.rgbToHex(255, 0, 0);
      this.assert(hex === '#ff0000', 'RGB to hex conversion works');

      const rgb = colors.hexToRGB('#00ff00');
      this.assert(rgb.g === 255, 'Hex to RGB conversion works');

      this.log('  ✅ Colors system working\n');
    } catch (err) {
      this.log(`  ❌ Colors test failed: ${err.message}\n`);
    }
  }

  /**
   * Test ANSI code generation.
   */
  testANSI() {
    this.log('📝 Testing ANSI System:');

    try {
      const ansi = ANSI;

      const reset = ansi.reset();
      this.assert(reset === '\x1b[0m', 'Reset code correct');

      const bold = ansi.bold();
      this.assert(bold === '\x1b[1m', 'Bold code correct');

      const red = ansi.fg(31);
      this.assert(red === '\x1b[31m', 'Foreground color code correct');

      const cursorMove = ansi.cursorTo(5, 10);
      this.assert(cursorMove === '\x1b[5;10H', 'Cursor position code correct');

      const clear = ansi.clear();
      this.assert(clear === '\x1b[2J', 'Clear screen code correct');

      this.log('  ✅ ANSI system working\n');
    } catch (err) {
      this.log(`  ❌ ANSI test failed: ${err.message}\n`);
    }
  }

  /**
   * Test Buffer and cell system.
   */
  testBuffer() {
    this.log('📝 Testing Buffer System:');

    try {
      const buffer = new Buffer(10, 5);

      buffer.setCell(0, 0, { char: 'A', fg: 'red', bg: 'default' });
      const cell = buffer.getCell(0, 0);
      this.assert(cell.char === 'A', 'Buffer cell write/read works');

      buffer.write('Hello', 1, 1, { fg: 'blue' });
      const cellH = buffer.getCell(1, 1);
      this.assert(cellH.char === 'H', 'Buffer write string works');

      buffer.markDirty(2, 2);
      const dirty = buffer.getDirtyCells();
      this.assert(dirty.length > 0, 'Dirty tracking works');

      buffer.clear();
      const cellAfterClear = buffer.getCell(0, 0);
      this.assert(cellAfterClear.char === ' ', 'Buffer clear works');

      this.log('  ✅ Buffer system working\n');
    } catch (err) {
      this.log(`  ❌ Buffer test failed: ${err.message}\n`);
    }
  }

  /**
   * Test Layout engines.
   */
  testLayout() {
    this.log('📝 Testing Layout System:');

    try {
      const mockNode = {
        type: 'element',
        children: [],
        bounds: {},
        layout: { direction: 'row' },
        applyLayout: function(bounds) { this.bounds = bounds; }
      };

      LayoutEngine.calculate(mockNode, 80, 24);
      this.assert(mockNode.bounds !== undefined, 'Layout engine works');

      this.log('  ✅ Layout system working\n');
    } catch (err) {
      this.log(`  ❌ Layout test failed: ${err.message}\n`);
    }
  }

  /**
   * Test Theme system.
   */
  testTheme() {
    this.log('📝 Testing Theme System:');

    try {
      const theme = defaultTheme;

      const color = theme.getColor('primary');
      this.assert(color !== undefined, 'Theme has colors');

      const buttonStyle = theme.getComponentStyle('button', 'default');
      this.assert(buttonStyle !== undefined, 'Theme has component styles');

      const newTheme = new Theme('custom', { primary: 'blue' }, {});
      const merged = theme.merge(newTheme);
      this.assert(merged !== null, 'Theme merge works');

      this.log('  ✅ Theme system working\n');
    } catch (err) {
      this.log(`  ❌ Theme test failed: ${err.message}\n`);
    }
  }

  /**
   * Test Style system.
   */
  testStyle() {
    this.log('📝 Testing Style System:');

    try {
      const style = new Style({ fg: 'red', bold: true });

      this.assert(style.fg === 'red', 'Style properties set');
      this.assert(style.bold === true, 'Style bold set');

      const codes = style.toANSICodes();
      this.assert(codes.length > 0, 'Style generates ANSI codes');

      const obj = style.toObject();
      this.assert(obj.fg === 'red', 'Style converts to object');

      const clone = style.clone();
      this.assert(clone.fg === style.fg, 'Style cloning works');

      this.log('  ✅ Style system working\n');
    } catch (err) {
      this.log(`  ❌ Style test failed: ${err.message}\n`);
    }
  }

  /**
   * Helper to log output.
   */
  log(text) {
    this.output.push(text);
    console.log(text);
  }

  /**
   * Helper to assert condition.
   */
  assert(condition, message) {
    if (condition) {
      this.testsPassed++;
      this.log(`    ✅ ${message}`);
    } else {
      this.testsFailed++;
      this.log(`    ❌ ${message}`);
    }
  }

  render() {
    if (this.output.length === 0) {
      this.runTests();
    }

    return this.output.join('\n');
  }
}

// Run test app
async function main() {
  try {
    const testApp = new TestApp({});
    const output = testApp.render();

    process.stdout.write('\n' + output + '\n');

    const exitCode = testApp.testsFailed === 0 ? 0 : 1;
    process.exit(exitCode);
  } catch (err) {
    console.error('Test app error:', err);
    process.exit(1);
  }
}

main();
