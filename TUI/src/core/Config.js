/**
 * Framework configuration management.
 */
class Config {
  constructor() {
    this.values = new Map();
    this.initializeDefaults();
  }

  /**
   * Initializes default configuration values.
   * @private
   */
  initializeDefaults() {
    this.values.set('debug', false);
    this.values.set('theme', 'default');
    this.values.set('plugins', []);
    this.values.set('frameRate', 60);
    this.values.set('renderDiff', true);
    this.values.set('logPerformance', false);
  }

  /**
   * Gets a config value.
   * @param {string} key - Config key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Config value
   */
  get(key, defaultValue = undefined) {
    return this.values.has(key) ? this.values.get(key) : defaultValue;
  }

  /**
   * Sets a config value.
   * @param {string} key - Config key
   * @param {*} value - Value to set
   */
  set(key, value) {
    this.values.set(key, value);
  }

  /**
   * Merges configuration from an object.
   * @param {object} config - Configuration object
   */
  merge(config) {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value);
    }
  }

  /**
   * Gets all configuration values.
   * @returns {object} All config values
   */
  getAll() {
    const result = {};
    for (const [key, value] of this.values) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Resets configuration to defaults.
   */
  reset() {
    this.values.clear();
    this.initializeDefaults();
  }
}

module.exports = { Config };
