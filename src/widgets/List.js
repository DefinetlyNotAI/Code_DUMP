const Element = require('../dom/Element');

/**
 * List widget - Scrollable list of items.
 */
class List extends Element {
  constructor(props = {}) {
    super(props);
    this.items = props.items || [];
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.onSelect = props.onSelect || (() => {});
  }

  /**
   * Gets selected item.
   */
  getSelectedItem() {
    return this.items[this.selectedIndex];
  }

  /**
   * Selects previous item.
   */
  selectPrevious() {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.selectedIndex));
    this.onSelect({ target: this, item: this.getSelectedItem(), index: this.selectedIndex });
  }

  /**
   * Selects next item.
   */
  selectNext() {
    this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1);
    const visibleHeight = this.bounds.height || 10;
    if (this.selectedIndex >= this.scrollOffset + visibleHeight) {
      this.scrollOffset = this.selectedIndex - visibleHeight + 1;
    }
    this.onSelect({ target: this, item: this.getSelectedItem(), index: this.selectedIndex });
  }

  /**
   * Renders the list.
   */
  render() {
    const height = this.bounds.height || 10;
    const visibleItems = this.items.slice(this.scrollOffset, this.scrollOffset + height);

    return visibleItems.map((item, idx) => {
      const actualIdx = idx + this.scrollOffset;
      const isSelected = actualIdx === this.selectedIndex;
      const prefix = isSelected ? '> ' : '  ';
      return prefix + String(item).substring(0, 20);
    }).join('\n');
  }
}

module.exports = List;
