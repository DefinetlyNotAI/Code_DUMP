const { FlexLayout } = require('./FlexLayout');
const { GridLayout } = require('./GridLayout');

/**
 * Layout engine that orchestrates layout calculation.
 */
class LayoutEngine {
  /**
   * Calculates layout for a component tree.
   * @param {Node} root - Root component
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static calculate(root, width = 80, height = 24) {
    this.layoutNode(root, 0, 0, width, height);
  }

  /**
   * Recursively layouts a node and children.
   * @private
   */
  static layoutNode(node, x, y, width, height) {
    if (!node || !node.applyLayout) return;

    let layout = [];

    if (node.props?.type === 'grid') {
      layout = GridLayout.calculate(node, width, height);
    } else {
      layout = FlexLayout.calculate(node, width, height);
    }

    for (const { node: child, bounds } of layout) {
      child.applyLayout(bounds);
      this.layoutNode(child, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }
}

module.exports = { LayoutEngine };
