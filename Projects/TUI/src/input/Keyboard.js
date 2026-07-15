const { Keymap } = require('./Keymap');

/**
 * Keyboard event processing.
 */
class Keyboard {
  /**
   * Process keyboard input to keyboard event.
   * @param {object} inputEvent - Parsed input event from Parser
   * @returns {object} KeyboardEvent
   */
  static process(inputEvent) {
    if (inputEvent.type !== 'key') return null;

    const key = inputEvent.key;
    const keyName = Keymap.get(key) || key;

    return {
      type: 'keydown',
      key: keyName,
      raw: key,
      ctrl: inputEvent.ctrl || false,
      shift: inputEvent.shift || false,
      alt: inputEvent.alt || false,
      preventDefault: false,
      stopPropagation: false,
    };
  }

  /**
   * Check if key matches pattern.
   * @param {string} key - Key name
   * @param {string|RegExp} pattern - Pattern to match
   * @returns {boolean}
   */
  static matches(key, pattern) {
    if (typeof pattern === 'string') {
      return key === pattern;
    }
    return pattern.test(key);
  }

  /**
   * Get modifier keys from event.
   * @param {object} event - Keyboard event
   * @returns {string[]}
   */
  static getModifiers(event) {
    const mods = [];
    if (event.ctrl) mods.push('ctrl');
    if (event.shift) mods.push('shift');
    if (event.alt) mods.push('alt');
    return mods;
  }
}

module.exports = { Keyboard };
