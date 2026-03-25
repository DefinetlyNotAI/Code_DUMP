/**
 * Pads a string to a specific length with a fill string.
 * @param {string} str - The string to pad
 * @param {number} length - Target length
 * @param {string} fill - Fill character/string (default: space)
 * @param {string} side - 'start' or 'end' (default: 'end')
 * @returns {string} The padded string
 */
function pad(str, length, fill = ' ', side = 'end') {
  if (str.length >= length) return str;
  const padLength = length - str.length;
  const padding = fill.repeat(Math.ceil(padLength / fill.length)).slice(0, padLength);
  return side === 'start' ? padding + str : str + padding;
}

/**
 * Truncates a string to a specific length with optional ellipsis.
 * @param {string} str - The string to truncate
 * @param {number} length - Maximum length
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} The truncated string
 */
function truncate(str, length, ellipsis = '...') {
  if (str.length <= length) return str;
  if (length <= ellipsis.length) return str.slice(0, length);
  return str.slice(0, length - ellipsis.length) + ellipsis;
}

/**
 * Repeats a string n times.
 * @param {string} str - The string to repeat
 * @param {number} count - Number of repetitions
 * @returns {string} The repeated string
 */
function repeat(str, count) {
  return str.repeat(Math.max(0, count));
}

module.exports = {
  pad,
  truncate,
  repeat,
};
