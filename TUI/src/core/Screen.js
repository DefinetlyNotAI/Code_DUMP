const { EventEmitter } = require('../events/EventEmitter');

/**
 * Screen abstraction layer for terminal operations.
 * Manages cursor, colors, and I/O without direct terminal writes.
 */
class Screen extends EventEmitter {
  constructor() {
    super();
    this.width = 80;
    this.height = 24;
    this.colorDepth = 16;
    this.isRawMode = false;
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorVisible = true;

    this.updateSize();
    this.detectColorCapability();
    this.setupResizeListener();
  }

  /**
   * Updates screen dimensions.
   */
  updateSize() {
    const { columns = 80, rows = 24 } = process.stdout;
    this.width = columns;
    this.height = rows;
  }

  /**
   * Gets screen dimensions.
   * @returns {{width: number, height: number}}
   */
  getSize() {
    return { width: this.width, height: this.height };
  }

  /**
   * Detects terminal color capability.
   * Checks COLORTERM and TERM environment variables.
   */
  detectColorCapability() {
    const colorTerm = process.env.COLORTERM || '';
    const term = process.env.TERM || '';

    if (colorTerm.includes('true-color') || colorTerm.includes('24bit')) {
      this.colorDepth = 16777216; // 24-bit true-color
    } else if (
      term.includes('256color') ||
      colorTerm === 'yes' ||
      process.platform === 'win32'
    ) {
      this.colorDepth = 256;
    } else {
      this.colorDepth = 16;
    }
  }

  /**
   * Gets detected color capability.
   * @returns {number} Color depth (16, 256, or 16777216)
   */
  getColorDepth() {
    return this.colorDepth;
  }

  /**
   * Sets up listener for terminal resize events.
   * @private
   */
  setupResizeListener() {
    process.stdout.on('resize', () => {
      this.updateSize();
      this.emit('resize', { width: this.width, height: this.height });
    });
  }

  /**
   * Enters raw mode (no line buffering, no echo).
   */
  enterRawMode() {
    if (!process.stdin.isTTY) return;
    this.isRawMode = true;
    process.stdin.setRawMode(true);
  }

  /**
   * Exits raw mode.
   */
  exitRawMode() {
    if (!process.stdin.isTTY) return;
    this.isRawMode = false;
    process.stdin.setRawMode(false);
  }

  /**
   * Writes output directly to stdout.
   * @param {string} text - Text to write
   */
  write(text) {
    process.stdout.write(text);
  }

  /**
   * Moves cursor to a specific position.
   * Does not output; only tracks state.
   * @param {number} x - Column (0-based)
   * @param {number} y - Row (0-based)
   */
  moveCursor(x, y) {
    this.cursorX = Math.max(0, Math.min(x, this.width - 1));
    this.cursorY = Math.max(0, Math.min(y, this.height - 1));
  }

  /**
   * Gets current cursor position.
   * @returns {{x: number, y: number}}
   */
  getCursorPosition() {
    return { x: this.cursorX, y: this.cursorY };
  }

  /**
   * Shows the cursor.
   */
  showCursor() {
    this.cursorVisible = true;
  }

  /**
   * Hides the cursor.
   */
  hideCursor() {
    this.cursorVisible = false;
  }

  /**
   * Checks if cursor is visible.
   * @returns {boolean}
   */
  isCursorVisible() {
    return this.cursorVisible;
  }

  /**
   * Clears the entire screen.
   */
  clear() {
    this.write('\x1b[2J');
    this.moveCursor(0, 0);
  }

  /**
   * Clears the current line.
   */
  clearLine() {
    this.write('\x1b[2K');
  }

  /**
   * Checks if stdout is a TTY.
   * @returns {boolean}
   */
  isTTY() {
    return process.stdout.isTTY || false;
  }

  /**
   * Checks if stdin is a TTY.
   * @returns {boolean}
   */
  isInputTTY() {
    return process.stdin.isTTY || false;
  }

  /**
   * Resets terminal to default state.
   */
  reset() {
    this.write('\x1b[0m');
    this.exitRawMode();
  }
}

module.exports = { Screen };
