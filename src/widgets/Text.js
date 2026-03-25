const Element = require('../dom/Element');

/**
 * Text widget - Display text with optional wrapping and alignment.
 */
class Text extends Element {
  constructor(props = {}) {
    super(props);
    this.text = props.text || '';
    this.align = props.align || 'left';
    this.wrap = props.wrap !== false;
    this.maxWidth = props.maxWidth || 80;
  }

  /**
   * Wraps text to max width.
   */
  wrapText(text, width) {
    if (!this.wrap || width === Infinity) return [text];

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > width) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Aligns text.
   */
  alignText(text, width) {
    if (this.align === 'center') {
      const padding = Math.floor((width - text.length) / 2);
      return ' '.repeat(padding) + text;
    } else if (this.align === 'right') {
      return text.padStart(width, ' ');
    }
    return text.padEnd(width, ' ');
  }

  /**
   * Renders the text.
   */
  render() {
    const width = this.bounds.width || this.maxWidth;
    const lines = this.wrapText(this.text, width);

    return lines.map(line => this.alignText(line, width)).join('\n');
  }
}

module.exports = Text;
