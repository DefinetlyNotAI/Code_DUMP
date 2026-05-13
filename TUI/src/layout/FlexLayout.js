const clamp = require('../utils/clamp');

/**
 * Flexbox-inspired layout calculation.
 */
class FlexLayout {
  /**
   * Calculates layout for flex container and children.
   * @param {Node} container - Container node
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @returns {Array} Array of {node, bounds}
   */
  static calculate(container, width, height) {
    const items = this.prepareItems(container, width, height);
    const direction = container.props?.direction || 'column';
    const justify = container.props?.justifyContent || 'flex-start';
    const align = container.props?.alignItems || 'flex-start';
    const gap = container.props?.gap || 0;

    if (direction === 'row') {
      return this.layoutHorizontal(items, width, height, justify, align, gap);
    } else {
      return this.layoutVertical(items, width, height, justify, align, gap);
    }
  }

  /**
   * Prepares items for layout.
   * @private
   */
  static prepareItems(container, availWidth, availHeight) {
    return container.children.map((child) => ({
      node: child,
      flex: child.props?.flex || 0,
      minWidth: child.props?.minWidth || 0,
      minHeight: child.props?.minHeight || 0,
      maxWidth: child.props?.maxWidth || Infinity,
      maxHeight: child.props?.maxHeight || Infinity,
      width: child.props?.width,
      height: child.props?.height,
    }));
  }

  /**
   * Horizontal layout.
   * @private
   */
  static layoutHorizontal(items, width, height, justify, align, gap) {
    const results = [];
    let usedWidth = 0;
    let totalFlex = 0;

    for (const item of items) {
      totalFlex += item.flex;
    }

    let flexSpace = width;
    for (const item of items) {
      if (item.width === undefined) {
        flexSpace -= item.minWidth + gap;
      } else {
        flexSpace -= item.width + gap;
      }
    }
    flexSpace = Math.max(0, flexSpace);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let itemWidth = item.width || item.minWidth;

      if (item.flex > 0 && totalFlex > 0) {
        itemWidth = Math.floor((item.flex / totalFlex) * flexSpace);
      }

      itemWidth = clamp(itemWidth, item.minWidth, item.maxWidth);
      const itemHeight = clamp(item.height || height, item.minHeight, item.maxHeight);

      results.push({
        node: item.node,
        bounds: {
          x: usedWidth,
          y: 0,
          width: itemWidth,
          height: itemHeight,
        },
      });

      usedWidth += itemWidth + gap;
    }

    return results;
  }

  /**
   * Vertical layout.
   * @private
   */
  static layoutVertical(items, width, height, justify, align, gap) {
    const results = [];
    let usedHeight = 0;
    let totalFlex = 0;

    for (const item of items) {
      totalFlex += item.flex;
    }

    let flexSpace = height;
    for (const item of items) {
      if (item.height === undefined) {
        flexSpace -= item.minHeight + gap;
      } else {
        flexSpace -= item.height + gap;
      }
    }
    flexSpace = Math.max(0, flexSpace);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let itemHeight = item.height || item.minHeight;

      if (item.flex > 0 && totalFlex > 0) {
        itemHeight = Math.floor((item.flex / totalFlex) * flexSpace);
      }

      itemHeight = clamp(itemHeight, item.minHeight, item.maxHeight);
      const itemWidth = clamp(item.width || width, item.minWidth, item.maxWidth);

      results.push({
        node: item.node,
        bounds: {
          x: 0,
          y: usedHeight,
          width: itemWidth,
          height: itemHeight,
        },
      });

      usedHeight += itemHeight + gap;
    }

    return results;
  }
}

module.exports = { FlexLayout };
