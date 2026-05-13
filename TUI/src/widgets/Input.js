const Element = require('../dom/Element');

/**
 * Input widget - Text input field with cursor.
 */
class Input extends Element {
  constructor(props = {}) {
    super(props);
    this.value = props.value || '';
    this.placeholder = props.placeholder || 'Enter text...';
    this.maxLength = props.maxLength || 100;
    this.cursorPos = 0;
    this.focused = false;
    this.onChange = props.onChange || (() => {});
    this.onSubmit = props.onSubmit || (() => {});
  }

  /**
   * Handles key press.
   */
  handleKey(key) {
    if (key === 'backspace') {
      if (this.cursorPos > 0) {
        this.value = this.value.slice(0, this.cursorPos - 1) + this.value.slice(this.cursorPos);
        this.cursorPos--;
        this.onChange({ target: this, value: this.value });
      }
    } else if (key === 'delete') {
      this.value = this.value.slice(0, this.cursorPos) + this.value.slice(this.cursorPos + 1);
      this.onChange({ target: this, value: this.value });
    } else if (key === 'left') {
      this.cursorPos = Math.max(0, this.cursorPos - 1);
    } else if (key === 'right') {
      this.cursorPos = Math.min(this.value.length, this.cursorPos + 1);
    } else if (key === 'enter') {
      this.onSubmit({ target: this, value: this.value });
    } else if (key.length === 1 && this.value.length < this.maxLength) {
      this.value = this.value.slice(0, this.cursorPos) + key + this.value.slice(this.cursorPos);
      this.cursorPos++;
      this.onChange({ target: this, value: this.value });
    }
  }

  /**
   * Sets focus.
   */
  setFocus(focused) {
    this.focused = focused;
  }

  /**
   * Renders the input.
   * @returns {string} Rendered input content
   */
  render() {
    const width = this.bounds.width || 30;
    const displayValue = this.value || this.placeholder;
    const visibleValue = displayValue.substring(0, width - 2).padEnd(width - 2, ' ');

    const beforeCursor = this.value.substring(0, this.cursorPos);
    const afterCursor = this.value.substring(this.cursorPos);
    const renderedValue = (beforeCursor + '│' + afterCursor).substring(0, width - 2).padEnd(width - 2, ' ');

    return this.focused ? '[' + renderedValue + ']' : ' ' + visibleValue + ' ';
  }
}

module.exports = Input;
