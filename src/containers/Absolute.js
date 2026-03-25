const Element = require('../dom/Element');

/**
 * Absolute positioned container.
 */
class Absolute extends Element {
  constructor(props = {}) {
    super(props);
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.width = props.width || 0;
    this.height = props.height || 0;
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
   * Renders the absolute container.
   */
  render() {
    if (this.children.length === 0) return '';

    const child = this.children[0];
    const content = child.render ? child.render() : String(child);

    const lines = content.split('\n');
    const buffer = [];

    for (let i = 0; i < this.y; i++) {
      buffer.push('');
    }

    for (const line of lines) {
      buffer.push(' '.repeat(this.x) + line);
    }

    return buffer.join('\n');
  }
}

module.exports = Absolute;
