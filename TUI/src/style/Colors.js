/**
 * Color definitions and utilities.
 */
const COLORS = {
  // ANSI 16 standard colors
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,

  // Bright variants
  brightBlack: 8,
  brightRed: 9,
  brightGreen: 10,
  brightYellow: 11,
  brightBlue: 12,
  brightMagenta: 13,
  brightCyan: 14,
  brightWhite: 15,

  // Common aliases
  gray: 8,
  grey: 8,
  default: 'default',
};

/**
 * Color management.
 */
class Colors {
  /**
   * Gets color code by name.
   * @param {string} name - Color name
   * @returns {number|string} Color code or default
   */
  static get(name) {
    return COLORS[name] ?? COLORS.default;
  }

  /**
   * Checks if color name exists.
   * @param {string} name - Color name
   * @returns {boolean}
   */
  static has(name) {
    return name in COLORS;
  }

  /**
   * Gets all color names.
   * @returns {string[]}
   */
  static names() {
    return Object.keys(COLORS);
  }

  /**
   * Gets ANSI foreground code for color.
   * @param {string|number} color - Color name or code
   * @returns {number} ANSI code (30-37 or 90-97)
   */
  static fgCode(color) {
    const code = typeof color === 'string' ? COLORS[color] : color;
    if (code >= 8) {
      return 90 + (code - 8);
    }
    return 30 + code;
  }

  /**
   * Gets ANSI background code for color.
   * @param {string|number} color - Color name or code
   * @returns {number} ANSI code (40-47 or 100-107)
   */
  static bgCode(color) {
    const code = typeof color === 'string' ? COLORS[color] : color;
    if (code >= 8) {
      return 100 + (code - 8);
    }
    return 40 + code;
  }

  /**
   * Converts hex to RGB.
   * @param {string} hex - Hex color code
   * @returns {{r: number, g: number, b: number}}
   */
  static hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Converts RGB to hex.
   * @param {number} r - Red
   * @param {number} g - Green
   * @param {number} b - Blue
   * @returns {string} Hex color code
   */
  static rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = { Colors };
