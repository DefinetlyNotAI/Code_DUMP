/**
 * Manages focus state and focus changes.
 */
class FocusManager {
  constructor() {
    this.focused = null;
    this.focusHistory = [];
  }

  /**
   * Sets focus to a component.
   * @param {Node} component - Component to focus
   */
  setFocus(component) {
    if (this.focused === component) return;

    if (this.focused) {
      this.focused.emit?.('blur');
    }

    this.focused = component;
    this.focusHistory.push(component.id);

    if (component) {
      component.emit?.('focus');
    }
  }

  /**
   * Gets currently focused component.
   * @returns {Node|null}
   */
  getFocus() {
    return this.focused;
  }

  /**
   * Blurs current focus.
   */
  blur() {
    if (this.focused) {
      this.focused.emit?.('blur');
      this.focused = null;
    }
  }

  /**
   * Checks if a component has focus.
   * @param {Node} component - Component to check
   * @returns {boolean}
   */
  isFocused(component) {
    return this.focused === component;
  }

  /**
   * Restores previous focus.
   */
  restorePrevious() {
    if (this.focusHistory.length > 1) {
      this.focusHistory.pop();
    }
  }

  /**
   * Gets focus history.
   * @returns {Array} Array of component IDs
   */
  getHistory() {
    return [...this.focusHistory];
  }

  /**
   * Clears focus and history.
   */
  clear() {
    this.focused = null;
    this.focusHistory = [];
  }
}

module.exports = { FocusManager };
