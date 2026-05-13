/**
 * Layout constraints for sizing and positioning.
 */
class Constraints {
  constructor() {
    this.minWidth = 0;
    this.maxWidth = Infinity;
    this.minHeight = 0;
    this.maxHeight = Infinity;
    this.width = null;
    this.height = null;
    this.flex = 0;
  }

  /**
   * Sets fixed width.
   * @param {number} width - Width value
   */
  setWidth(width) {
    this.width = width;
    return this;
  }

  /**
   * Sets fixed height.
   * @param {number} height - Height value
   */
  setHeight(height) {
    this.height = height;
    return this;
  }

  /**
   * Sets minimum width.
   * @param {number} minWidth - Minimum width
   */
  setMinWidth(minWidth) {
    this.minWidth = minWidth;
    return this;
  }

  /**
   * Sets maximum width.
   * @param {number} maxWidth - Maximum width
   */
  setMaxWidth(maxWidth) {
    this.maxWidth = maxWidth;
    return this;
  }

  /**
   * Sets minimum height.
   * @param {number} minHeight - Minimum height
   */
  setMinHeight(minHeight) {
    this.minHeight = minHeight;
    return this;
  }

  /**
   * Sets maximum height.
   * @param {number} maxHeight - Maximum height
   */
  setMaxHeight(maxHeight) {
    this.maxHeight = maxHeight;
    return this;
  }

  /**
   * Sets flex factor.
   * @param {number} flex - Flex factor
   */
  setFlex(flex) {
    this.flex = Math.max(0, flex);
    return this;
  }

  /**
   * Clamps a value within constraints.
   * @param {number} value - Value to clamp
   * @param {string} dimension - 'width' or 'height'
   * @returns {number} Clamped value
   */
  clamp(value, dimension = 'width') {
    if (dimension === 'width') {
      return Math.max(this.minWidth, Math.min(this.maxWidth, value));
    } else {
      return Math.max(this.minHeight, Math.min(this.maxHeight, value));
    }
  }

  /**
   * Gets constraint object.
   * @returns {object}
   */
  toObject() {
    return {
      minWidth: this.minWidth,
      maxWidth: this.maxWidth,
      minHeight: this.minHeight,
      maxHeight: this.maxHeight,
      width: this.width,
      height: this.height,
      flex: this.flex,
    };
  }

  /**
   * Creates from object.
   * @param {object} obj - Constraint object
   * @returns {Constraints}
   */
  static from(obj) {
    const c = new Constraints();
    if (obj.width !== undefined) c.width = obj.width;
    if (obj.height !== undefined) c.height = obj.height;
    if (obj.minWidth !== undefined) c.minWidth = obj.minWidth;
    if (obj.maxWidth !== undefined) c.maxWidth = obj.maxWidth;
    if (obj.minHeight !== undefined) c.minHeight = obj.minHeight;
    if (obj.maxHeight !== undefined) c.maxHeight = obj.maxHeight;
    if (obj.flex !== undefined) c.flex = obj.flex;
    return c;
  }
}

module.exports = { Constraints };
