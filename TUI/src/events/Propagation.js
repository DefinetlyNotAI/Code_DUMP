/**
 * Event propagation through the component tree.
 */
class Propagation {
  /**
   * Dispatches an event through the tree with bubbling.
   * @param {object} event - Event object
   * @param {Node} target - Target node
   * @param {Node} root - Root node
   */
  static dispatchBubble(event, target, root) {
    const path = this.getEventPath(target, root);

    for (const node of path) {
      if (event.cancelBubble) break;
      const listeners = node.getEventListeners?.(event.type) || [];
      for (const handler of listeners) {
        handler.call(node, event);
      }
    }
  }

  /**
   * Dispatches an event with capture phase first.
   * @param {object} event - Event object
   * @param {Node} target - Target node
   * @param {Node} root - Root node
   */
  static dispatchCapture(event, target, root) {
    const path = this.getEventPath(target, root);

    for (let i = path.length - 1; i >= 0; i--) {
      if (event.cancelBubble) break;
      const node = path[i];
      const listeners = node.getEventListeners?.(`capture:${event.type}`) || [];
      for (const handler of listeners) {
        handler.call(node, event);
      }
    }
  }

  /**
   * Gets the event path from target to root.
   * @private
   */
  static getEventPath(target, root) {
    const path = [];
    let current = target;
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  /**
   * Stops event propagation.
   * @param {object} event - Event object
   */
  static stopPropagation(event) {
    event.cancelBubble = true;
  }

  /**
   * Prevents default action.
   * @param {object} event - Event object
   */
  static preventDefault(event) {
    event.defaultPrevented = true;
  }
}

module.exports = { Propagation };
