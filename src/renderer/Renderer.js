const { ANSI } = require('./ANSI');
const { Painter } = require('./Painter');

/**
 * Main renderer that converts component trees to screen output.
 */
class Renderer {
  constructor(screen, buffer) {
    this.screen = screen;
    this.buffer = buffer;
    this.previousBuffer = null;
  }

  /**
   * Renders a component tree to the buffer and screen.
   * @param {Node} root - Root component node
   */
  render(root) {
    if (!root) return;

    this.buffer.clear();
    this.renderNode(root, 0, 0);
    this.updateScreen();
  }

  /**
   * Recursively renders a node and its children.
   * @private
   */
  renderNode(node, offsetX, offsetY) {
    if (!node || node.props.hidden) return;

    const { x = 0, y = 0, width = 10, height = 1 } = node.props.bounds || {};
    const x1 = offsetX + x;
    const y1 = offsetY + y;

    if (node.render) {
      node.render(this.buffer, x1, y1, width, height);
    }

    for (const child of node.children) {
      this.renderNode(child, x1, y1);
    }
  }

  /**
   * Updates the screen with buffer changes.
   * Detects changes and outputs only modified regions.
   */
  updateScreen() {
    const { Diff } = require('./Diff');
    const changes = Diff.compare(this.previousBuffer, this.buffer);

    if (changes.length === 0) return;

    let output = '';

    for (const change of changes) {
      output += ANSI.cursorTo(change.y + 1, change.x + 1);
      output += Painter.cellToANSI(change.cell, this.screen.getColorDepth());
    }

    output += ANSI.cursorTo(
      this.screen.cursorY + 1,
      this.screen.cursorX + 1
    );

    if (this.screen.isCursorVisible()) {
      output += ANSI.showCursor();
    } else {
      output += ANSI.hideCursor();
    }

    this.screen.write(output);
    this.previousBuffer = this.buffer.clone();
  }

  /**
   * Clears the screen and buffer.
   */
  clear() {
    this.screen.clear();
    this.buffer.clear();
  }

  /**
   * Gets renderer statistics.
   * @returns {object} Statistics
   */
  getStats() {
    return {
      bufferSize: `${this.buffer.width}x${this.buffer.height}`,
      dirtyCells: this.buffer.getDirtyCellCount(),
    };
  }
}

module.exports = { Renderer };
