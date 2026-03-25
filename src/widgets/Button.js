const Element = require('../dom/Element');

/**
 * Button widget - Interactive button with click handling.
 */
class Button extends Element {
  constructor(props = {}) {
    super(props);
    this.label = props.label || 'Button';
    this.focused = false;
    this.onClick = props.onClick || (() => {});
  }

  /**
   * Handles click event.
   */
  click() {
    this.onClick({ target: this });
  }

  /**
   * Sets focus.
   */
  setFocus(focused) {
    this.focused = focused;
  }

  /**
   * Renders the button.
   * @returns {string} Rendered button content
   */
  render() {
    const width = this.bounds.width || (this.label.length + 4);
    const style = this.focused ? '[' : ' ';
    const endStyle = this.focused ? ']' : ' ';

    const padding = Math.max(0, Math.floor((width - this.label.length - 2) / 2));
    const content = ' '.repeat(padding) + this.label + ' '.repeat(width - padding - this.label.length - 2);

    return style + content + endStyle;
  }
}

module.exports = Button;
