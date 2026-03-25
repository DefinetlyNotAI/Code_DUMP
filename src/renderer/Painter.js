const { ANSI } = require('./ANSI');

/**
 * Paints characters and styles onto a buffer.
 */
class Painter {
  /**
   * Paints a single character to the buffer.
   * @param {Buffer} buffer - Target buffer
   * @param {number} x - Column
   * @param {number} y - Row
   * @param {string} char - Character to paint
   * @param {object} style - Style properties
   */
  static paintChar(buffer, x, y, char, style = {}) {
    buffer.setCell(x, y, { char, ...style });
  }

  /**
   * Paints a string to the buffer.
   * @param {Buffer} buffer - Target buffer
   * @param {string} text - Text to paint
   * @param {number} x - Starting column
   * @param {number} y - Row
   * @param {object} style - Style properties
   */
  static paintString(buffer, text, x, y, style = {}) {
    let col = x;
    for (const char of text) {
      if (col >= buffer.width) break;
      this.paintChar(buffer, col, y, char, style);
      col++;
    }
  }

  /**
   * Paints a rectangle to the buffer.
   * @param {Buffer} buffer - Target buffer
   * @param {number} x - Starting column
   * @param {number} y - Starting row
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} char - Fill character
   * @param {object} style - Style properties
   */
  static paintRect(buffer, x, y, width, height, char = ' ', style = {}) {
    for (let row = y; row < y + height && row < buffer.height; row++) {
      for (let col = x; col < x + width && col < buffer.width; col++) {
        this.paintChar(buffer, col, row, char, style);
      }
    }
  }

  /**
   * Paints a border around a rectangle.
   * @param {Buffer} buffer - Target buffer
   * @param {number} x - Starting column
   * @param {number} y - Starting row
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {object} style - Style properties
   */
  static paintBorder(buffer, x, y, width, height, style = {}) {
    const chars = {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
    };

    // Corners
    this.paintChar(buffer, x, y, chars.topLeft, style);
    this.paintChar(buffer, x + width - 1, y, chars.topRight, style);
    this.paintChar(buffer, x, y + height - 1, chars.bottomLeft, style);
    this.paintChar(buffer, x + width - 1, y + height - 1, chars.bottomRight, style);

    // Top and bottom edges
    for (let col = x + 1; col < x + width - 1; col++) {
      this.paintChar(buffer, col, y, chars.horizontal, style);
      this.paintChar(buffer, col, y + height - 1, chars.horizontal, style);
    }

    // Left and right edges
    for (let row = y + 1; row < y + height - 1; row++) {
      this.paintChar(buffer, x, row, chars.vertical, style);
      this.paintChar(buffer, x + width - 1, row, chars.vertical, style);
    }
  }

  /**
   * Converts a cell to ANSI-styled output string.
   * @param {object} cell - Buffer cell
   * @param {number} colorDepth - Terminal color depth
   * @returns {string} ANSI-styled character
   */
  static cellToANSI(cell, colorDepth = 16) {
    let output = '';

    if (cell.bold) output += ANSI.bold();
    if (cell.dim) output += ANSI.dim();
    if (cell.italic) output += ANSI.italic();
    if (cell.underline) output += ANSI.underline();
    if (cell.reverse) output += ANSI.reverse();
    if (cell.hidden) output += ANSI.hidden();
    if (cell.strikethrough) output += ANSI.strikethrough();

    if (cell.fg) {
      output += this.colorToANSI(cell.fg, 'fg', colorDepth);
    }

    if (cell.bg) {
      output += this.colorToANSI(cell.bg, 'bg', colorDepth);
    }

    output += cell.char || ' ';
    output += ANSI.reset();

    return output;
  }

  /**
   * Converts a color value to ANSI code.
   * @private
   */
  static colorToANSI(color, type, colorDepth) {
    if (typeof color === 'number') {
      if (colorDepth === 256 || colorDepth === 16777216) {
        return type === 'fg' ? ANSI.fg256(color) : ANSI.bg256(color);
      }
      return type === 'fg' ? ANSI.fg16(color) : ANSI.bg16(color);
    }

    if (typeof color === 'string' && color.startsWith('#')) {
      const rgb = this.hexToRGB(color);
      return type === 'fg'
        ? ANSI.fgRGB(rgb.r, rgb.g, rgb.b)
        : ANSI.bgRGB(rgb.r, rgb.g, rgb.b);
    }

    return '';
  }

  /**
   * Converts hex color to RGB.
   * @private
   */
  static hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }
}

module.exports = { Painter };
