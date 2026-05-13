/**
 * Character width map for East Asian width classification.
 * Determines how many terminal columns a character occupies.
 */
const WIDE_CHARS = /[\u1100-\u115F\u2329-\u232A\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u30000-\u3134F\u3400-\u4DBF\u20000-\u2A6DF]/g;

/**
 * Detects if a character is double-width (requires 2 columns).
 * @param {string} char - Single character to check
 * @returns {boolean} True if character is double-width
 */
function isWideChar(char) {
  return WIDE_CHARS.test(char);
}

/**
 * Calculates the visual width of a string in terminal columns.
 * Accounts for double-width characters (CJK, etc.).
 * @param {string} str - String to measure
 * @returns {number} Visual width in columns
 */
function stringWidth(str) {
  let width = 0;
  for (const char of str) {
    width += isWideChar(char) ? 2 : 1;
  }
  return width;
}

/**
 * Slices a string to a maximum visual width.
 * Ensures truncation doesn't occur in the middle of a wide character.
 * @param {string} str - String to slice
 * @param {number} maxWidth - Maximum visual width
 * @returns {string} Sliced string
 */
function sliceByWidth(str, maxWidth) {
  let width = 0;
  let i = 0;
  for (; i < str.length; i++) {
    const char = str[i];
    const charWidth = isWideChar(char) ? 2 : 1;
    if (width + charWidth > maxWidth) break;
    width += charWidth;
  }
  return str.slice(0, i);
}

module.exports = {
  isWideChar,
  stringWidth,
  sliceByWidth,
};
