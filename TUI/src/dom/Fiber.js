/**
 * Fiber architecture for incremental rendering and reconciliation.
 * Inspired by React's fiber implementation.
 */
class Fiber {
  constructor(component, parent = null) {
    this.component = component;
    this.parent = parent;
    this.children = [];
    this.sibling = null;
    this.alternate = null;
    this.hooks = new Map();
    this.hookIndex = 0;
    this.effects = [];
    this.cleanup = [];
  }

  /**
   * Gets or creates fiber for a child component.
   * @param {Node} component - Child component
   * @returns {Fiber} Child fiber
   */
  getOrCreateChild(component) {
    let child = this.children.find((f) => f.component === component);
    if (!child) {
      child = new Fiber(component, this);
      this.children.push(child);
    }
    return child;
  }

  /**
   * Registers a hook for the component.
   * @param {string} hookId - Unique hook identifier
   * @param {*} initialValue - Initial hook value
   * @returns {[*, Function]} State and setter
   */
  registerHook(hookId, initialValue) {
    if (!this.hooks.has(hookId)) {
      this.hooks.set(hookId, {
        state: initialValue,
        deps: null,
      });
    }
    return [this.hooks.get(hookId).state, (newValue) => {
      this.hooks.get(hookId).state = newValue;
    }];
  }

  /**
   * Schedules a side effect.
   * @param {Function} effect - Effect function
   * @param {Array} deps - Dependency array
   */
  scheduleEffect(effect, deps) {
    this.effects.push({ effect, deps });
  }

  /**
   * Runs all scheduled effects.
   */
  runEffects() {
    for (const { effect } of this.effects) {
      try {
        const cleanup = effect();
        if (typeof cleanup === 'function') {
          this.cleanup.push(cleanup);
        }
      } catch (error) {
        console.error('Effect error:', error);
      }
    }
  }

  /**
   * Runs all cleanup functions.
   */
  runCleanup() {
    for (const cleanup of this.cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    this.cleanup = [];
  }

  /**
   * Gets all fibers in the tree.
   * @returns {Fiber[]} Array of fibers
   */
  getAllFibers() {
    const fibers = [this];
    for (const child of this.children) {
      fibers.push(...child.getAllFibers());
    }
    return fibers;
  }
}

module.exports = { Fiber };
