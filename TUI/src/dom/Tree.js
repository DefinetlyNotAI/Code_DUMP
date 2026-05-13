/**
 * DOM tree management.
 */
class Tree {
  /**
   * Inserts a node into the tree.
   * @param {Node} parent - Parent node
   * @param {Node} child - Child node
   * @param {number} index - Insert position (optional)
   */
  static insert(parent, child, index) {
    if (index !== undefined) {
      parent.insertChild(child, index);
    } else {
      parent.appendChild(child);
    }
  }

  /**
   * Removes a node from the tree.
   * @param {Node} parent - Parent node
   * @param {Node} child - Child node to remove
   */
  static remove(parent, child) {
    parent.removeChild(child);
  }

  /**
   * Finds a node by predicate function.
   * @param {Node} root - Root node to search from
   * @param {Function} predicate - Test function
   * @returns {Node|null} Found node or null
   */
  static find(root, predicate) {
    if (predicate(root)) return root;
    for (const child of root.children) {
      const found = this.find(child, predicate);
      if (found) return found;
    }
    return null;
  }

  /**
   * Finds node by ID.
   * @param {Node} root - Root node to search from
   * @param {string} id - Node ID
   * @returns {Node|null}
   */
  static findById(root, id) {
    return this.find(root, (node) => node.id === id);
  }

  /**
   * Traverses the tree and collects nodes.
   * @param {Node} root - Root node to start from
   * @param {Function} callback - Called with (node, depth)
   */
  static traverse(root, callback) {
    root.traverse(callback);
  }

  /**
   * Gets all nodes at a specific depth.
   * @param {Node} root - Root node
   * @param {number} depth - Target depth (0-based)
   * @returns {Node[]} Array of nodes at that depth
   */
  static getNodesAtDepth(root, depth) {
    const nodes = [];
    this.traverse(root, (node, d) => {
      if (d === depth) nodes.push(node);
    });
    return nodes;
  }

  /**
   * Gets tree depth.
   * @param {Node} root - Root node
   * @returns {number} Maximum depth
   */
  static getDepth(root) {
    let maxDepth = 0;
    this.traverse(root, (node, depth) => {
      maxDepth = Math.max(maxDepth, depth);
    });
    return maxDepth;
  }

  /**
   * Gets total node count.
   * @param {Node} root - Root node
   * @returns {number} Total nodes
   */
  static getNodeCount(root) {
    let count = 0;
    this.traverse(root, () => {
      count++;
    });
    return count;
  }

  /**
   * Validates tree structure.
   * @param {Node} root - Root node
   * @returns {boolean} True if valid
   */
  static isValid(root) {
    let valid = true;
    this.traverse(root, (node) => {
      for (const child of node.children) {
        if (child.parent !== node) {
          valid = false;
        }
      }
    });
    return valid;
  }

  /**
   * Clones a tree recursively.
   * @param {Node} root - Root node to clone
   * @returns {Node} Cloned root
   */
  static clone(root) {
    const cloned = new root.constructor(root.type, { ...root.props });
    cloned.state = { ...root.state };
    for (const child of root.children) {
      cloned.appendChild(this.clone(child));
    }
    return cloned;
  }
}

module.exports = { Tree };
