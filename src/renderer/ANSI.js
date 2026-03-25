/**
 * ANSI escape sequence builder.
 * Pure string generation - no direct output.
 */
class ANSI {
  /**
   * Resets all attributes to default.
   * @returns {string} ANSI reset sequence
   */
  static reset() {
    return '\x1b[0m';
  }

  /**
   * Sets text to bold.
   * @returns {string} ANSI bold sequence
   */
  static bold() {
    return '\x1b[1m';
  }

  /**
   * Sets text to dim.
   * @returns {string} ANSI dim sequence
   */
  static dim() {
    return '\x1b[2m';
  }

  /**
   * Sets text to italic.
   * @returns {string} ANSI italic sequence
   */
  static italic() {
    return '\x1b[3m';
  }

  /**
   * Underlines text.
   * @returns {string} ANSI underline sequence
   */
  static underline() {
    return '\x1b[4m';
  }

  /**
   * Reverses foreground and background.
   * @returns {string} ANSI reverse sequence
   */
  static reverse() {
    return '\x1b[7m';
  }

  /**
   * Hides text.
   * @returns {string} ANSI hidden sequence
   */
  static hidden() {
    return '\x1b[8m';
  }

  /**
   * Strikes through text.
   * @returns {string} ANSI strikethrough sequence
   */
  static strikethrough() {
    return '\x1b[9m';
  }

  /**
   * Sets foreground color (16-color).
   * @param {number} code - Color code (30-37 for standard, 90-97 for bright)
   * @returns {string} ANSI color sequence
   */
  static fg16(code) {
    return `\x1b[${code}m`;
  }

  /**
   * Sets background color (16-color).
   * @param {number} code - Color code (40-47 for standard, 100-107 for bright)
   * @returns {string} ANSI color sequence
   */
  static bg16(code) {
    return `\x1b[${code}m`;
  }

  /**
   * Sets foreground color (256-color).
   * @param {number} color - Color index (0-255)
   * @returns {string} ANSI color sequence
   */
  static fg256(color) {
    return `\x1b[38;5;${color}m`;
  }

  /**
   * Sets background color (256-color).
   * @param {number} color - Color index (0-255)
   * @returns {string} ANSI color sequence
   */
  static bg256(color) {
    return `\x1b[48;5;${color}m`;
  }

  /**
   * Sets foreground color (truecolor RGB).
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} ANSI color sequence
   */
  static fgRGB(r, g, b) {
    return `\x1b[38;2;${r};${g};${b}m`;
  }

  /**
   * Sets background color (truecolor RGB).
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} ANSI color sequence
   */
  static bgRGB(r, g, b) {
    return `\x1b[48;2;${r};${g};${b}m`;
  }

  /**
   * Moves cursor up n lines.
   * @param {number} n - Number of lines
   * @returns {string} ANSI cursor sequence
   */
  static cursorUp(n = 1) {
    return `\x1b[${n}A`;
  }

  /**
   * Moves cursor down n lines.
   * @param {number} n - Number of lines
   * @returns {string} ANSI cursor sequence
   */
  static cursorDown(n = 1) {
    return `\x1b[${n}B`;
  }

  /**
   * Moves cursor right n columns.
   * @param {number} n - Number of columns
   * @returns {string} ANSI cursor sequence
   */
  static cursorRight(n = 1) {
    return `\x1b[${n}C`;
  }

  /**
   * Moves cursor left n columns.
   * @param {number} n - Number of columns
   * @returns {string} ANSI cursor sequence
   */
  static cursorLeft(n = 1) {
    return `\x1b[${n}D`;
  }

  /**
   * Moves cursor to specific position.
   * @param {number} row - Row (1-based)
   * @param {number} col - Column (1-based)
   * @returns {string} ANSI cursor sequence
   */
  static cursorTo(row, col) {
    return `\x1b[${row};${col}H`;
  }

  /**
   * Hides the cursor.
   * @returns {string} ANSI cursor sequence
   */
  static hideCursor() {
    return '\x1b[?25l';
  }

  /**
   * Shows the cursor.
   * @returns {string} ANSI cursor sequence
   */
  static showCursor() {
    return '\x1b[?25h';
  }

  /**
   * Clears entire screen.
   * @returns {string} ANSI screen sequence
   */
  static clearScreen() {
    return '\x1b[2J';
  }

  /**
   * Clears from cursor to end of screen.
   * @returns {string} ANSI screen sequence
   */
  static clearToEnd() {
    return '\x1b[0J';
  }

  /**
   * Clears current line.
   * @returns {string} ANSI line sequence
   */
  static clearLine() {
    return '\x1b[2K';
  }

  /**
   * Clears from cursor to end of line.
   * @returns {string} ANSI line sequence
   */
  static clearToEndOfLine() {
    return '\x1b[0K';
  }
}

module.exports = { ANSI };
