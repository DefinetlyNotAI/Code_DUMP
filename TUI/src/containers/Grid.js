const Element = require('../dom/Element');

/**
 * Grid container - Wraps GridLayout.
 */
class Grid extends Element {
  constructor(props = {}) {
    super(props);
    this.cols = props.cols || 3;
    this.rows = props.rows || 3;
    this.gap = props.gap || 1;
    this.children = [];
  }

  /**
   * Adds child.
   */
  addChild(child) {
    this.children.push(child);
    return this;
  }

  /**
   * Renders the grid container.
   * @returns {string} Rendered container content
   */
  render() {
    const childrenPerRow = this.cols;
    const rows = [];

    for (let i = 0; i < this.children.length; i += childrenPerRow) {
      const rowChildren = this.children.slice(i, i + childrenPerRow);
      const rowContent = rowChildren.map(child => child.render ? child.render() : String(child)).join(' ');
      rows.push(rowContent);
    }

    return rows.join('\n');
  }
}

module.exports = Grid;
