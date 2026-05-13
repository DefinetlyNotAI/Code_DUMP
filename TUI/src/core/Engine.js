const { EventEmitter } = require('../events/EventEmitter');

/**
 * Main engine that orchestrates the TUI application.
 * Manages component tree, rendering, lifecycle, and scheduling.
 */
class Engine extends EventEmitter {
  constructor(screen, renderer, layoutEngine, scheduler) {
    super();
    this.screen = screen;
    this.renderer = renderer;
    this.layoutEngine = layoutEngine;
    this.scheduler = scheduler;
    this.root = null;
    this.isRunning = false;
    this.pendingRender = false;
    this.lifecycle = new Map();
    this.componentStates = new Map();
  }

  /**
   * Initializes the engine.
   * @param {Node} rootComponent - Root component node
   */
  initialize(rootComponent) {
    this.root = rootComponent;
    this.isRunning = true;
    this.emit('initialized');
  }

  /**
   * Schedules a render on the next frame.
   * Prevents multiple renders in a single frame.
   */
  scheduleRender() {
    if (this.pendingRender) return;
    this.pendingRender = true;

    this.scheduler.schedule(() => {
      if (!this.isRunning || !this.pendingRender) return;
      this.render();
      this.pendingRender = false;
    });
  }

  /**
   * Performs a full render cycle.
   */
  render() {
    if (!this.root) return;

    this.emit('render:start');

    this.layoutEngine.calculate(this.root);
    this.renderer.render(this.root);

    this.emit('render:end');
  }

  /**
   * Updates a component's props and schedules a re-render.
   * @param {Node} component - Component to update
   * @param {object} newProps - New props
   */
  update(component, newProps) {
    component.updateProps(newProps);
    this.scheduleRender();
  }

  /**
   * Updates a component's state and schedules a re-render.
   * @param {Node} component - Component to update
   * @param {object} newState - State updates (merged with existing state)
   */
  updateState(component, newState) {
    if (!this.componentStates.has(component.id)) {
      this.componentStates.set(component.id, {});
    }
    const state = this.componentStates.get(component.id);
    Object.assign(state, newState);
    this.scheduleRender();
  }

  /**
   * Gets component state.
   * @param {Node} component - Component
   * @returns {object} Component state
   */
  getComponentState(component) {
    return this.componentStates.get(component.id) || {};
  }

  /**
   * Registers lifecycle callback.
   * @param {string} phase - 'mount', 'update', or 'unmount'
   * @param {Node} component - Component
   * @param {Function} callback - Callback function
   */
  onLifecycle(phase, component, callback) {
    const key = `${phase}:${component.id}`;
    if (!this.lifecycle.has(key)) {
      this.lifecycle.set(key, []);
    }
    this.lifecycle.get(key).push(callback);
  }

  /**
   * Triggers lifecycle callbacks.
   * @private
   */
  triggerLifecycle(phase, component) {
    const key = `${phase}:${component.id}`;
    const callbacks = this.lifecycle.get(key) || [];
    for (const callback of callbacks) {
      try {
        callback();
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Mounts a component (triggers lifecycle callbacks).
   * @param {Node} component - Component to mount
   */
  mount(component) {
    this.triggerLifecycle('mount', component);
    this.emit('component:mounted', component);
  }

  /**
   * Unmounts a component (triggers lifecycle callbacks).
   * @param {Node} component - Component to unmount
   */
  unmount(component) {
    this.triggerLifecycle('unmount', component);
    this.componentStates.delete(component.id);
    this.emit('component:unmounted', component);
  }

  /**
   * Traverses the component tree.
   * @param {Function} callback - Called with each node
   */
  traverse(callback) {
    if (this.root) {
      this.root.traverse(callback);
    }
  }

  /**
   * Finds a component by ID.
   * @param {string} id - Component ID
   * @returns {Node|null} Component or null
   */
  findComponent(id) {
    let found = null;
    this.traverse((node) => {
      if (node.id === id) {
        found = node;
      }
    });
    return found;
  }

  /**
   * Shuts down the engine.
   */
  shutdown() {
    this.isRunning = false;
    this.traverse((node) => {
      this.unmount(node);
    });
    this.root = null;
    this.emit('shutdown');
  }

  /**
   * Gets engine status.
   * @returns {object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasPendingRender: this.pendingRender,
      componentCount: this.componentStates.size,
      colorDepth: this.screen.getColorDepth(),
      screenSize: this.screen.getSize(),
    };
  }
}

module.exports = { Engine };
