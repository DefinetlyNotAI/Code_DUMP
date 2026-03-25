/**
 * Keyboard input keymap and key definitions.
 */
const KEYMAP = {
  // Navigation keys
  up: ['\x1b[A', 'w'],
  down: ['\x1b[B', 's'],
  left: ['\x1b[D', 'a'],
  right: ['\x1b[C', 'd'],

  // Special keys
  enter: ['\r', '\n'],
  escape: ['\x1b'],
  backspace: ['\x7f', '\x08'],
  delete: ['\x1b[3~'],
  tab: ['\t'],
  space: [' '],

  // Function keys
  f1: ['\x1bOP'],
  f2: ['\x1bOQ'],
  f3: ['\x1bOR'],
  f4: ['\x1bOS'],
  f5: ['\x1b[15~'],
  f6: ['\x1b[17~'],
  f7: ['\x1b[18~'],
  f8: ['\x1b[19~'],
  f9: ['\x1b[20~'],
  f10: ['\x1b[21~'],
  f11: ['\x1b[23~'],
  f12: ['\x1b[24~'],

  // Home/End
  home: ['\x1b[H', '\x1b[1~'],
  end: ['\x1b[F', '\x1b[4~'],
  pageUp: ['\x1b[5~'],
  pageDown: ['\x1b[6~'],
};

/**
 * Keymap utility for keyboard input parsing.
 */
class Keymap {
  /**
   * Gets key name from input sequence.
   * @param {string} input - Input sequence
   * @returns {string|null} Key name or null
   */
  static getKeyName(input) {
    for (const [key, sequences] of Object.entries(KEYMAP)) {
      if (sequences.includes(input)) {
        return key;
      }
    }
    return null;
  }

  /**
   * Checks if input matches a key.
   * @param {string} input - Input sequence
   * @param {string} keyName - Key name to check
   * @returns {boolean}
   */
  static matches(input, keyName) {
    const sequences = KEYMAP[keyName];
    return sequences && sequences.includes(input);
  }

  /**
   * Gets all key names.
   * @returns {string[]}
   */
  static getKeyNames() {
    return Object.keys(KEYMAP);
  }

  /**
   * Gets sequences for a key.
   * @param {string} keyName - Key name
   * @returns {string[]}
   */
  static getSequences(keyName) {
    return KEYMAP[keyName] || [];
  }

  /**
   * Adds a custom key mapping.
   * @param {string} keyName - Key name
   * @param {string|Array} sequences - Sequence or array of sequences
   */
  static addKey(keyName, sequences) {
    if (typeof sequences === 'string') {
      sequences = [sequences];
    }
    KEYMAP[keyName] = sequences;
  }
}

module.exports = { Keymap };
