/**
 * Base Node class for all DOM nodes.
 * Provides fundamental tree structure and property management.
 */
class Node {
  /**
   * @type {Node|null}
   */
  parent;

  constructor(type, props = {}) {
    this.id = props.id || `node-${Math.random().toString(36).substring(2, 11)}`;
    this.type = type;
    this.props = { ...props };
    this.state = {};
    this.parent = null;
    this.children = [];
    this.listeners = new Map();
  }

  /**
   * Appends a child node.
   * @param {Node} child - Child node to append
   * @returns {Node} The child node
   */
  appendChild(child) {
    if (!(child instanceof Node)) {
      throw new TypeError('Child must be a Node instance');
    }
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    return child;
  }

  /**
   * Removes a child node.
   * @param {Node} child - Child node to remove
   * @returns {Node|null} The removed child or null if not found
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index === -1) return null;
    const removed = this.children.splice(index, 1)[0];
    removed.parent = null;
    return removed;
  }

  /**
   * Inserts a child at a specific index.
   * @param {Node} child - Child node to insert
   * @param {number} index - Insert position
   * @returns {Node} The child node
   */
  insertChild(child, index) {
    if (!(child instanceof Node)) {
      throw new TypeError('Child must be a Node instance');
    }
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.splice(index, 0, child);
    return child;
  }

  /**
   * Updates node properties.
   * @param {object} props - Properties to update
   */
  updateProps(props) {
    Object.assign(this.props, props);
  }

  /**
   * Registers an event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  addEventListener(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  /**
   * Removes an event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  removeEventListener(event, handler) {
    if (!this.listeners.has(event)) return;
    const handlers = this.listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Gets all listeners for an event.
   * @param {string} event - Event name
   * @returns {Function[]} Array of handlers
   */
  getEventListeners(event) {
    return this.listeners.get(event) || [];
  }

  /**
   * Checks if this node is an ancestor of another node.
   * @param {Node} node - Node to check
   * @returns {boolean} True if ancestor
   */
  isAncestorOf(node) {
    let current = node.parent;
    while (current) {
      if (current === this) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Gets the root node.
   * @returns {Node} The root node
   */
  getRoot() {
    let current = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  /**
   * Traverses the tree with a callback.
   * @param {Function} callback - Called with (node, depth)
   * @param {number} depth - Current depth (internal use)
   */
  traverse(callback, depth = 0) {
    callback(this, depth);
    for (const child of this.children) {
      child.traverse(callback, depth + 1);
    }
  }

  /**
   * Emits an event to all listeners.
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to handlers
   * @returns {boolean} True if at least one listener was called
   */
  emit(event, ...args) {
    const handlers = this.getEventListeners(event);
    for (const handler of handlers) {
      handler(...args);
    }
    return handlers.length > 0;
  }
}

module.exports = Node;
