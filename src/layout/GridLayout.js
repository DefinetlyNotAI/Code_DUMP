/**
 * CSS Grid-style layout (basic implementation).
 */
class GridLayout {
  /**
   * Calculates grid layout.
   * @param {Node} container - Container node
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @returns {Array} Array of {node, bounds}
   */
  static calculate(container, width, height) {
    const rows = (container.props?.rows || 1);
    const cols = (container.props?.cols || 1);
    const gap = container.props?.gap || 0;

    const cellWidth = Math.floor((width - gap * (cols - 1)) / cols);
    const cellHeight = Math.floor((height - gap * (rows - 1)) / rows);

    const results = [];
    let row = 0;
    let col = 0;

    for (const child of container.children) {
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);

      results.push({
        node: child,
        bounds: { x, y, width: cellWidth, height: cellHeight },
      });

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }

    return results;
  }
}

module.exports = { GridLayout };
