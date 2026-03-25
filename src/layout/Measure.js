const { stringWidth } = require('../utils/unicode');

/**
 * Measures dimensions and content sizes.
 */
class Measure {
  /**
   * Measures text width in terminal columns.
   * @param {string} text - Text to measure
   * @returns {number} Width in columns
   */
  static textWidth(text) {
    return stringWidth(text || '');
  }

  /**
   * Measures text height (number of lines).
   * @param {string} text - Text to measure
   * @returns {number} Height in lines
   */
  static textHeight(text) {
    if (!text) return 0;
    return text.split('\n').length;
  }

  /**
   * Measures content size.
   * @param {Node} node - Node to measure
   * @returns {{width: number, height: number}}
   */
  static contentSize(node) {
    if (node.measureContent) {
      return node.measureContent();
    }
    return { width: 0, height: 0 };
  }

  /**
   * Resolves a size value.
   * @param {number|string} value - Size value (number, percentage string, or 'auto')
   * @param {number} available - Available space
   * @returns {number} Resolved size
   */
  static resolveSize(value, available) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.endsWith('%')) {
      const percent = parseInt(value) / 100;
      return Math.floor(available * percent);
    }
    return available;
  }

  /**
   * Calculates total padding.
   * @param {object} padding - Padding object
   * @returns {number} Total padding width
   */
  static paddingWidth(padding) {
    return (padding?.left || 0) + (padding?.right || 0);
  }

  /**
   * Calculates total padding height.
   * @param {object} padding - Padding object
   * @returns {number} Total padding height
   */
  static paddingHeight(padding) {
    return (padding?.top || 0) + (padding?.bottom || 0);
  }
}

module.exports = { Measure };
