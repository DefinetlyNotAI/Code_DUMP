/**
 * Detects differences between two buffers.
 * Identifies changed regions for optimized rendering.
 */
class Diff {
  /**
   * Compares two buffers and returns changed cells.
   * @param {Buffer} oldBuffer - Previous buffer state
   * @param {Buffer} newBuffer - Current buffer state
   * @returns {Array} Array of {x, y, cell} for changed cells
   */
  static compare(oldBuffer, newBuffer) {
    const changes = [];

    if (!oldBuffer) {
      return this.getAllCells(newBuffer);
    }

    const minHeight = Math.min(oldBuffer.height, newBuffer.height);
    const minWidth = Math.min(oldBuffer.width, newBuffer.width);

    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        const oldCell = oldBuffer.getCell(x, y);
        const newCell = newBuffer.getCell(x, y);
        if (!this.cellsEqual(oldCell, newCell)) {
          changes.push({ x, y, cell: newCell });
        }
      }
    }

    if (newBuffer.width > oldBuffer.width) {
      for (let y = 0; y < minHeight; y++) {
        for (let x = oldBuffer.width; x < newBuffer.width; x++) {
          const newCell = newBuffer.getCell(x, y);
          changes.push({ x, y, cell: newCell });
        }
      }
    }

    if (newBuffer.height > oldBuffer.height) {
      for (let y = oldBuffer.height; y < newBuffer.height; y++) {
        for (let x = 0; x < newBuffer.width; x++) {
          const newCell = newBuffer.getCell(x, y);
          changes.push({ x, y, cell: newCell });
        }
      }
    }

    return changes;
  }

  /**
   * Gets all cells from a buffer.
   * @private
   */
  static getAllCells(buffer) {
    const cells = [];
    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        cells.push({ x, y, cell: buffer.getCell(x, y) });
      }
    }
    return cells;
  }

  /**
   * Checks if two cells are equal.
   * @private
   */
  static cellsEqual(cell1, cell2) {
    if (!cell1 || !cell2) return false;
    return (
      cell1.char === cell2.char &&
      cell1.fg === cell2.fg &&
      cell1.bg === cell2.bg &&
      cell1.bold === cell2.bold &&
      cell1.dim === cell2.dim &&
      cell1.italic === cell2.italic &&
      cell1.underline === cell2.underline &&
      cell1.reverse === cell2.reverse &&
      cell1.hidden === cell2.hidden &&
      cell1.strikethrough === cell2.strikethrough
    );
  }

  /**
   * Groups changes into regions for batch rendering.
   * @param {Array} changes - Array of changes from compare
   * @returns {Array} Array of regions {x, y, width, height}
   */
  static groupIntoRegions(changes) {
    if (changes.length === 0) return [];

    const sorted = [...changes].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const regions = [];
    let currentRegion = null;

    for (const change of sorted) {
      if (
        !currentRegion ||
        change.y !== currentRegion.y ||
        change.x > currentRegion.x + currentRegion.width
      ) {
        if (currentRegion) regions.push(currentRegion);
        currentRegion = {
          x: change.x,
          y: change.y,
          width: 1,
          height: 1,
        };
      } else {
        currentRegion.width = change.x - currentRegion.x + 1;
      }
    }

    if (currentRegion) regions.push(currentRegion);

    return regions;
  }
}

module.exports = { Diff };
