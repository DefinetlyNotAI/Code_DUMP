const Element = require('../dom/Element');

/**
 * Flex container - Wraps FlexLayout.
 */
class Flex extends Element {
  constructor(props = {}) {
    super(props);
    this.direction = props.direction || 'row';
    this.justifyContent = props.justifyContent || 'flex-start';
    this.alignItems = props.alignItems || 'flex-start';
    this.gap = props.gap || 0;
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
   * Renders the flex container.
   */
  render() {
    return this.children.map(child => child.render ? child.render() : String(child)).join('\n');
  }
}

module.exports = Flex;
