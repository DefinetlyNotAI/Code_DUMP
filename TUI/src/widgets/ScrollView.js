const Element = require('../dom/Element');

/**
 * ScrollView widget - Scrollable container.
 */
class ScrollView extends Element {
  constructor(props = {}) {
    super(props);
    this.scrollX = 0;
    this.scrollY = 0;
    this.contentWidth = props.contentWidth || 1000;
    this.contentHeight = props.contentHeight || 1000;
    this.showScrollbars = props.showScrollbars !== false;
    this.children = [];
  }

  /**
   * Scrolls up.
   */
  scrollUp(amount = 1) {
    this.scrollY = Math.max(0, this.scrollY - amount);
  }

  /**
   * Scrolls down.
   */
  scrollDown(amount = 1) {
    const maxScroll = Math.max(0, this.contentHeight - (this.bounds.height || 10));
    this.scrollY = Math.min(maxScroll, this.scrollY + amount);
  }

  /**
   * Scrolls left.
   */
  scrollLeft(amount = 1) {
    this.scrollX = Math.max(0, this.scrollX - amount);
  }

  /**
   * Scrolls right.
   */
  scrollRight(amount = 1) {
    const maxScroll = Math.max(0, this.contentWidth - (this.bounds.width || 80));
    this.scrollX = Math.min(maxScroll, this.scrollX + amount);
  }

  /**
   * Gets scroll ratio.
   */
  getScrollRatioY() {
    const visibleHeight = this.bounds.height || 10;
    return this.scrollY / Math.max(1, this.contentHeight - visibleHeight);
  }

  /**
   * Gets scroll ratio.
   */
  getScrollRatioX() {
    const visibleWidth = this.bounds.width || 80;
    return this.scrollX / Math.max(1, this.contentWidth - visibleWidth);
  }

  /**
   * Renders the scroll view.
   * @returns {string} Rendered scroll view content
   */
  render() {
    const width = this.bounds.width || 80;
    const height = this.bounds.height || 10;

    const lines = [];
    const content = this.props.content || '';
    const contentLines = content.split('\n');

    for (let i = this.scrollY; i < Math.min(contentLines.length, this.scrollY + height); i++) {
      const line = contentLines[i] || '';
      const visiblePart = line.substring(this.scrollX, this.scrollX + width - 1);
      lines.push(visiblePart.padEnd(width - 1, ' '));
    }

    // Add scrollbar indicator
    if (this.showScrollbars && this.scrollY > 0) {
      lines.push('▼'.repeat(Math.min(3, Math.ceil(this.getScrollRatioY() * width))));
    }

    return lines.join('\n');
  }
}

module.exports = ScrollView;
