/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} The clamped value
 */
function clamp(value, min, max) {
  if (min > max) {
    throw new Error('Minimum value cannot be greater than maximum value');
  }
  return Math.max(min, Math.min(max, value));
}

module.exports = clamp;
