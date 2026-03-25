const Element = require('../dom/Element');

/**
 * Checkbox widget - Toggle checkbox.
 */
class Checkbox extends Element {
  constructor(props = {}) {
    super(props);
    this.checked = props.checked || false;
    this.label = props.label || '';
    this.onChange = props.onChange || (() => {});
  }

  /**
   * Toggles checkbox.
   */
  toggle() {
    this.checked = !this.checked;
    this.onChange({ target: this, checked: this.checked });
  }

  /**
   * Renders the checkbox.
   */
  render() {
    const box = this.checked ? '[✓]' : '[ ]';
    return box + (this.label ? ' ' + this.label : '');
  }
}

module.exports = Checkbox;
