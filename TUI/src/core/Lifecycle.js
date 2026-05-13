/**
 * Manages component lifecycle phases and hooks.
 */
class Lifecycle {
  constructor() {
    this.hooks = new Map();
  }

  /**
   * Registers a lifecycle hook.
   * @param {string} componentId - Component ID
   * @param {string} phase - 'mount', 'update', or 'unmount'
   * @param {Function} callback - Callback function
   */
  on(componentId, phase, callback) {
    const key = `${componentId}:${phase}`;
    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }
    this.hooks.get(key).push(callback);
  }

  /**
   * Triggers all hooks for a phase.
   * @param {string} componentId - Component ID
   * @param {string} phase - 'mount', 'update', or 'unmount'
   */
  trigger(componentId, phase) {
    const key = `${componentId}:${phase}`;
    const callbacks = this.hooks.get(key) || [];
    for (const callback of callbacks) {
      try {
        callback();
      } catch (error) {
        console.error(`Lifecycle hook error in ${phase}:`, error);
      }
    }
  }

  /**
   * Clears all hooks for a component.
   * @param {string} componentId - Component ID
   */
  clear(componentId) {
    const keys = Array.from(this.hooks.keys()).filter((k) =>
      k.startsWith(componentId)
    );
    for (const key of keys) {
      this.hooks.delete(key);
    }
  }

  /**
   * Gets hooks for a phase.
   * @param {string} componentId - Component ID
   * @param {string} phase - Phase name
   * @returns {Function[]} Array of callbacks
   */
  getHooks(componentId, phase) {
    const key = `${componentId}:${phase}`;
    return this.hooks.get(key) || [];
  }
}

module.exports = { Lifecycle };
