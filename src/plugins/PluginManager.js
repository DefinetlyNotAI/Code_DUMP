/**
 * Plugin Manager for TUI framework.
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  /**
   * Registers a plugin.
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" already registered`);
    }

    this.plugins.set(name, plugin);

    if (plugin.onRegister) {
      plugin.onRegister({ manager: this });
    }

    return this;
  }

  /**
   * Unregisters a plugin.
   */
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    if (plugin.onUnregister) {
      plugin.onUnregister({ manager: this });
    }

    this.plugins.delete(name);
    return true;
  }

  /**
   * Gets a plugin.
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Checks if plugin exists.
   */
  has(name) {
    return this.plugins.has(name);
  }

  /**
   * Registers a hook.
   */
  hook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(fn);
    return this;
  }

  /**
   * Calls a hook.
   */
  call(name, context) {
    if (!this.hooks.has(name)) return;

    for (const fn of this.hooks.get(name)) {
      fn(context);
    }
  }

  /**
   * Emits lifecycle event.
   */
  emit(event, context) {
    this.call(event, context);

    for (const [name, plugin] of this.plugins) {
      const methodName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
      if (plugin[methodName]) {
        plugin[methodName](context);
      }
    }
  }

  /**
   * Gets all plugins.
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Gets plugin names.
   */
  getNames() {
    return Array.from(this.plugins.keys());
  }
}

module.exports = { PluginManager };
