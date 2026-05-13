const { Style } = require('./Style');

/**
 * Theme management.
 */
class Theme {
  constructor(name = 'default', colors = {}, components = {}) {
    this.name = name;
    this.colors = colors;
    this.components = components;
  }

  /**
   * Gets a color by name.
   * @param {string} name - Color name
   * @returns {string}
   */
  getColor(name) {
    return this.colors[name] || name;
  }

  /**
   * Gets component style.
   * @param {string} componentName - Component name
   * @param {string} state - Component state (default, focused, disabled, etc.)
   * @returns {Style}
   */
  getComponentStyle(componentName, state = 'default') {
    const componentStyles = this.components[componentName] || {};
    const stateStyle = componentStyles[state] || componentStyles.default || {};
    return new Style(stateStyle);
  }

  /**
   * Sets component style.
   * @param {string} componentName - Component name
   * @param {string} state - Component state
   * @param {object} style - Style object
   */
  setComponentStyle(componentName, state, style) {
    if (!this.components[componentName]) {
      this.components[componentName] = {};
    }
    this.components[componentName][state] = style;
  }

  /**
   * Merges with another theme.
   * @param {Theme} other - Other theme
   * @returns {Theme} New merged theme
   */
  merge(other) {
    if (!other) return this;

    const mergedColors = { ...this.colors, ...other.colors };
    const mergedComponents = { ...this.components };

    for (const [name, states] of Object.entries(other.components)) {
      mergedComponents[name] = {
        ...this.components[name],
        ...states,
      };
    }

    return new Theme(this.name, mergedColors, mergedComponents);
  }

  /**
   * Creates a copy of this theme.
   * @returns {Theme}
   */
  clone() {
    return new Theme(
      this.name,
      JSON.parse(JSON.stringify(this.colors)),
      JSON.parse(JSON.stringify(this.components)),
    );
  }
}

module.exports = { Theme };
