const { Colors } = require('./Colors');

/**
 * Style property management.
 */
class Style {
  constructor(props = {}) {
    this.fg = props.fg || 'default';
    this.bg = props.bg || 'default';
    this.bold = props.bold || false;
    this.dim = props.dim || false;
    this.italic = props.italic || false;
    this.underline = props.underline || false;
    this.blink = props.blink || false;
    this.reverse = props.reverse || false;
    this.hidden = props.hidden || false;
    this.strikethrough = props.strikethrough || false;
  }

  /**
   * Merges styles.
   * @param {Style} other - Other style
   * @returns {Style} New merged style
   */
  merge(other) {
    if (!other) return new Style(this);

    return new Style({
      fg: other.fg !== undefined ? other.fg : this.fg,
      bg: other.bg !== undefined ? other.bg : this.bg,
      bold: other.bold !== undefined ? other.bold : this.bold,
      dim: other.dim !== undefined ? other.dim : this.dim,
      italic: other.italic !== undefined ? other.italic : this.italic,
      underline: other.underline !== undefined ? other.underline : this.underline,
      blink: other.blink !== undefined ? other.blink : this.blink,
      reverse: other.reverse !== undefined ? other.reverse : this.reverse,
      hidden: other.hidden !== undefined ? other.hidden : this.hidden,
      strikethrough: other.strikethrough !== undefined ? other.strikethrough : this.strikethrough,
    });
  }

  /**
   * Gets ANSI codes for this style.
   * @returns {number[]} ANSI codes
   */
  toANSICodes() {
    const codes = [];

    const fgCode = Colors.fgCode(this.fg);
    if (fgCode !== undefined) codes.push(fgCode);

    const bgCode = Colors.bgCode(this.bg);
    if (bgCode !== undefined) codes.push(bgCode);

    if (this.bold) codes.push(1);
    if (this.dim) codes.push(2);
    if (this.italic) codes.push(3);
    if (this.underline) codes.push(4);
    if (this.blink) codes.push(5);
    if (this.reverse) codes.push(7);
    if (this.hidden) codes.push(8);
    if (this.strikethrough) codes.push(9);

    return codes;
  }

  /**
   * Converts to object.
   * @returns {object}
   */
  toObject() {
    return {
      fg: this.fg,
      bg: this.bg,
      bold: this.bold,
      dim: this.dim,
      italic: this.italic,
      underline: this.underline,
      blink: this.blink,
      reverse: this.reverse,
      hidden: this.hidden,
      strikethrough: this.strikethrough,
    };
  }

  /**
   * Clones this style.
   * @returns {Style}
   */
  clone() {
    return new Style(this.toObject());
  }
}

module.exports = { Style };
