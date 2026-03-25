const Element = require('../dom/Element');
const { Style } = require('../style/Style');

/**
 * Box widget - Generic container with styling.
 */
class Box extends Element {
  constructor(props = {}) {
    super(props);
    this.children = [];
    this.padding = props.padding || 1;
    this.border = props.border !== false;
    this.borderStyle = props.borderStyle || 'single';
    this.bg = props.bg || 'default';
    this.fg = props.fg || 'white';
  }

  /**
   * Adds a child element.
   */
  addChild(child) {
    this.children.push(child);
    return this;
  }

  /**
   * Renders the box.
   */
  render() {
    const width = this.bounds.width || 40;
    const height = this.bounds.height || 10;
    const padding = this.padding;

    const lines = [];
    const contentWidth = width - padding * 2 - (this.border ? 2 : 0);

    if (this.border) {
      lines.push('┌' + '─'.repeat(width - 2) + '┐');
    }

    // Top padding
    for (let i = 0; i < padding; i++) {
      const line = this.border ? '│' : '';
      lines.push(line + ' '.repeat(width - (this.border ? 2 : 0)) + (this.border ? '│' : ''));
    }

    // Content
    const content = this.props.children || this.props.content || '';
    if (typeof content === 'string') {
      const contentLines = content.split('\n');
      for (const contentLine of contentLines) {
        const paddedContent = contentLine.padEnd(contentWidth, ' ');
        const line = (this.border ? '│ ' : ' ') + paddedContent + (this.border ? ' │' : ' ');
        lines.push(line);
      }
    }

    // Bottom padding
    for (let i = 0; i < padding; i++) {
      const line = this.border ? '│' : '';
      lines.push(line + ' '.repeat(width - (this.border ? 2 : 0)) + (this.border ? '│' : ''));
    }

    if (this.border) {
      lines.push('└' + '─'.repeat(width - 2) + '┘');
    }

    return lines.join('\n');
  }
}

module.exports = Box;
