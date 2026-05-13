/**
 * Event emitter for publishing and subscribing to events.
 */
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Registers an event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {EventEmitter} This instance for chaining
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }

  /**
   * Registers a one-time event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {EventEmitter} This instance for chaining
   */
  once(event, handler) {
    const wrapped = (...args) => {
      handler(...args);
      this.off(event, wrapped);
    };
    return this.on(event, wrapped);
  }

  /**
   * Removes an event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   * @returns {EventEmitter} This instance for chaining
   */
  off(event, handler) {
    if (!this.listeners.has(event)) return this;
    const handlers = this.listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    if (handlers.length === 0) {
      this.listeners.delete(event);
    }
    return this;
  }

  /**
   * Removes all listeners for an event or all events.
   * @param {string} [event] - Event name (if omitted, removes all)
   * @returns {EventEmitter} This instance for chaining
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  /**
   * Emits an event to all listeners.
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to handlers
   * @returns {boolean} True if at least one listener was called
   */
  emit(event, ...args) {
    if (!this.listeners.has(event)) return false;
    const handlers = this.listeners.get(event);
    for (const handler of handlers) {
      handler(...args);
    }
    return handlers.length > 0;
  }

  /**
   * Gets count of listeners for an event.
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Gets all listeners for an event.
   * @param {string} event - Event name
   * @returns {Function[]} Array of listeners
   */
  getListeners(event) {
    return this.listeners.has(event) ? [...this.listeners.get(event)] : [];
  }
}

module.exports = { EventEmitter };
