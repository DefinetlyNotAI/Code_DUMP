/**
 * Mouse event processing.
 */
class Mouse {
  /**
   * Process mouse input to mouse event.
   * @param {object} inputEvent - Parsed input event
   * @returns {object|null} MouseEvent or null if not mouse input
   */
  static process(inputEvent) {
    if (!inputEvent.type.startsWith('mouse')) return null;

    return {
      type: inputEvent.type,
      x: inputEvent.x || 0,
      y: inputEvent.y || 0,
      button: inputEvent.button || 0,
      shift: inputEvent.shift || false,
      ctrl: inputEvent.ctrl || false,
      alt: inputEvent.alt || false,
      preventDefault: false,
      stopPropagation: false,
    };
  }

  /**
   * Check if button matches.
   * @param {object} event - Mouse event
   * @param {number} button - Button number (0=left, 1=middle, 2=right)
   * @returns {boolean}
   */
  static buttonMatches(event, button) {
    return event.button === button;
  }

  /**
   * Get button name.
   * @param {number} button - Button number
   * @returns {string}
   */
  static getButtonName(button) {
    const names = ['left', 'middle', 'right'];
    return names[button] || 'unknown';
  }
}

module.exports = { Mouse };
