/**
 * Style string/object parsing.
 */
class Parser {
  /**
   * Parses style object from string or object.
   * @param {string|object} style - Style definition
   * @returns {object} Parsed style object
   */
  static parse(style) {
    if (typeof style === 'object' && style !== null) {
      return style;
    }

    if (typeof style === 'string') {
      return this.parseString(style);
    }

    return {};
  }

  /**
   * Parses CSS-like style string.
   * @param {string} str - Style string
   * @returns {object}
   */
  static parseString(str) {
    const style = {};
    const props = str.split(';').filter(Boolean);

    for (const prop of props) {
      const [key, value] = prop.split(':').map((s) => s.trim());
      if (key && value) {
        style[this.camelCase(key)] = this.parseValue(value);
      }
    }

    return style;
  }

  /**
   * Parses style value.
   * @param {string} value - Value string
   * @returns {*} Parsed value
   */
  static parseValue(value) {
    // Boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number values
    if (/^\d+$/.test(value)) return parseInt(value, 10);

    // Default: string value
    return value;
  }

  /**
   * Converts kebab-case to camelCase.
   * @param {string} str - Kebab string
   * @returns {string}
   */
  static camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Validates style object.
   * @param {object} style - Style object
   * @returns {boolean}
   */
  static isValid(style) {
    const validProps = [
      'fg', 'bg', 'bold', 'dim', 'italic', 'underline',
      'blink', 'reverse', 'hidden', 'strikethrough',
    ];

    for (const key in style) {
      if (!validProps.includes(key)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = { Parser };
