const { ANSI } = require('./ANSI');

/**
 * Manages cursor position and visibility.
 */
class Cursor {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.savedX = 0;
    this.savedY = 0;
  }

  /**
   * Moves cursor to position.
   * @param {number} x - Column
   * @param {number} y - Row
   * @returns {string} ANSI sequence for the move
   */
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    return ANSI.cursorTo(y + 1, x + 1);
  }

  /**
   * Moves cursor up.
   * @param {number} n - Number of lines
   * @returns {string} ANSI sequence
   */
  moveUp(n = 1) {
    this.y = Math.max(0, this.y - n);
    return ANSI.cursorUp(n);
  }

  /**
   * Moves cursor down.
   * @param {number} n - Number of lines
   * @returns {string} ANSI sequence
   */
  moveDown(n = 1) {
    this.y += n;
    return ANSI.cursorDown(n);
  }

  /**
   * Moves cursor left.
   * @param {number} n - Number of columns
   * @returns {string} ANSI sequence
   */
  moveLeft(n = 1) {
    this.x = Math.max(0, this.x - n);
    return ANSI.cursorLeft(n);
  }

  /**
   * Moves cursor right.
   * @param {number} n - Number of columns
   * @returns {string} ANSI sequence
   */
  moveRight(n = 1) {
    this.x += n;
    return ANSI.cursorRight(n);
  }

  /**
   * Gets current position.
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Shows cursor.
   * @returns {string} ANSI sequence
   */
  show() {
    this.visible = true;
    return ANSI.showCursor();
  }

  /**
   * Hides cursor.
   * @returns {string} ANSI sequence
   */
  hide() {
    this.visible = false;
    return ANSI.hideCursor();
  }

  /**
   * Checks if cursor is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Saves cursor position.
   */
  save() {
    this.savedX = this.x;
    this.savedY = this.y;
  }

  /**
   * Restores cursor position.
   * @returns {string} ANSI sequence
   */
  restore() {
    return this.moveTo(this.savedX, this.savedY);
  }
}

module.exports = { Cursor };
