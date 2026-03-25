const Node = require('./Node');

/**
 * Base UI element class.
 * Represents renderable nodes in the DOM tree.
 */
class Element extends Node {
  constructor(type, props = {}) {
    super(type, props);
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.visible = props.visible !== false;
    this.zIndex = props.zIndex || 0;
    this.parent = null;
    this.children = [];
  }

  /**
   * Measures the content of this element.
   * Should be overridden by subclasses.
   * @returns {{width: number, height: number}}
   */
  measureContent() {
    return { width: 0, height: 0 };
  }

  /**
   * Sets bounds for this element.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setBounds(x, y, width, height) {
    this.bounds = { x, y, width, height };
  }

  /**
   * Gets bounds for this element.
   * @returns {object} Bounds object
   */
  getBounds() {
    return { ...this.bounds };
  }

  /**
   * Renders this element to a buffer.
   * Should be overridden by subclasses.
   * @param {Buffer} buffer - Target buffer
   * @param {number} x - Starting x coordinate
   * @param {number} y - Starting y coordinate
   * @param {number} width - Rendering width
   * @param {number} height - Rendering height
   */
  render(buffer, x, y, width, height) {
    // Default implementation - should be overridden
  }

  /**
   * Hides this element.
   */
  hide() {
    this.visible = false;
  }

  /**
   * Shows this element.
   */
  show() {
    this.visible = true;
  }

  /**
   * Checks if element is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Applies layout bounds.
   * @param {object} bounds - Bounds from layout engine
   */
  applyLayout(bounds) {
    this.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
   * Gets computed style value.
   * @param {string} key - Style key
   * @param {*} defaultValue - Default if not found
   * @returns {*} Style value
   */
  getStyle(key, defaultValue = null) {
    return this.props.style ? (this.props.style[key] ?? defaultValue) : defaultValue;
  }

  /**
   * Checks if this element is a descendant of another.
   * @param {Element} ancestor - Potential ancestor
   * @returns {boolean}
   */
  isDescendantOf(ancestor) {
    let current = this.parent;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }
}

module.exports = Element;
