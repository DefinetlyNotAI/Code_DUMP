/**
 * Terminal buffer abstraction.
 * Character grid with support for styling and dirty region tracking.
 */
class Buffer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.dirtyRegions = new Set();
    this.initialize();
  }

  /**
   * Initializes buffer with empty cells.
   * @private
   */
  initialize() {
    for (let y = 0; y < this.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = {
          char: ' ',
          fg: null,
          bg: null,
          bold: false,
          dim: false,
          italic: false,
          underline: false,
          reverse: false,
          hidden: false,
          strikethrough: false,
        };
      }
    }
  }

  /**
   * Resizes the buffer.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.cells = [];
    this.dirtyRegions.clear();
    this.initialize();
  }

  /**
   * Gets cell at position.
   * @param {number} x - Column
   * @param {number} y - Row
   * @returns {object|null} Cell object or null if out of bounds
   */
  getCell(x, y) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return null;
    }
    return this.cells[y][x];
  }

  /**
   * Sets cell content and styling.
   * @param {number} x - Column
   * @param {number} y - Row
   * @param {object} cell - Cell data
   */
  setCell(x, y, cell) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return;
    }
    this.cells[y][x] = { ...this.cells[y][x], ...cell };
    this.markDirty(x, y);
  }

  /**
   * Writes a string at a position.
   * @param {string} text - Text to write
   * @param {number} x - Starting column
   * @param {number} y - Row
   * @param {object} style - Style properties
   */
  write(text, x, y, style = {}) {
    let col = x;
    for (const char of text) {
      if (col >= this.width) break;
      this.setCell(col, y, { char, ...style });
      col++;
    }
  }

  /**
   * Clears entire buffer.
   */
  clear() {
    this.initialize();
    this.markEntireBufferDirty();
  }

  /**
   * Clears a rectangular region.
   * @param {number} x - Starting column
   * @param {number} y - Starting row
   * @param {number} width - Width
   * @param {number} height - Height
   */
  clearRect(x, y, width, height) {
    for (let row = y; row < y + height && row < this.height; row++) {
      for (let col = x; col < x + width && col < this.width; col++) {
        this.setCell(col, row, { char: ' ' });
      }
    }
  }

  /**
   * Marks a cell as dirty for rendering.
   * @param {number} x - Column
   * @param {number} y - Row
   */
  markDirty(x, y) {
    this.dirtyRegions.add(`${x},${y}`);
  }

  /**
   * Marks entire buffer as dirty.
   * @private
   */
  markEntireBufferDirty() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.dirtyRegions.add(`${x},${y}`);
      }
    }
  }

  /**
   * Gets dirty cells.
   * @returns {Array} Array of {x, y, cell}
   */
  getDirtyCells() {
    const cells = [];
    for (const key of this.dirtyRegions) {
      const [x, y] = key.split(',').map(Number);
      cells.push({ x, y, cell: this.cells[y][x] });
    }
    return cells;
  }

  /**
   * Clears dirty regions.
   */
  clearDirtyRegions() {
    this.dirtyRegions.clear();
  }

  /**
   * Gets the number of dirty cells.
   * @returns {number}
   */
  getDirtyCellCount() {
    return this.dirtyRegions.size;
  }

  /**
   * Creates a copy of the buffer.
   * @returns {Buffer} Cloned buffer
   */
  clone() {
    const clone = new Buffer(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        clone.cells[y][x] = { ...this.cells[y][x] };
      }
    }
    return clone;
  }
}

module.exports = { Buffer };
