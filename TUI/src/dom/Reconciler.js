/**
 * Virtual DOM reconciliation engine.
 * Detects changes and performs efficient updates.
 */
class Reconciler {
  /**
   * Reconciles old and new component trees.
   * Returns list of mutations to apply.
   * @param {Node} oldComponent - Old component tree
   * @param {Node} newComponent - New component tree
   * @returns {Array} Array of mutations {type, node, props, index}
   */
  static reconcile(oldComponent, newComponent) {
    const mutations = [];

    if (!oldComponent && newComponent) {
      mutations.push({ type: 'insert', node: newComponent });
      return mutations;
    }

    if (oldComponent && !newComponent) {
      mutations.push({ type: 'remove', node: oldComponent });
      return mutations;
    }

    if (!oldComponent || !newComponent) {
      return mutations;
    }

    if (oldComponent.type !== newComponent.type) {
      mutations.push({ type: 'replace', oldNode: oldComponent, newNode: newComponent });
      return mutations;
    }

    if (this.propsChanged(oldComponent.props, newComponent.props)) {
      mutations.push({ type: 'update', node: oldComponent, props: newComponent.props });
    }

    const oldChildren = oldComponent.children || [];
    const newChildren = newComponent.children || [];

    for (let i = 0; i < Math.max(oldChildren.length, newChildren.length); i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      mutations.push(...this.reconcile(oldChild, newChild));
    }

    return mutations;
  }

  /**
   * Checks if component props changed.
   * @private
   */
  static propsChanged(oldProps, newProps) {
    if (oldProps === newProps) return false;
    
    const allKeys = new Set([
      ...Object.keys(oldProps || {}),
      ...Object.keys(newProps || {}),
    ]);

    for (const key of allKeys) {
      if (oldProps?.[key] !== newProps?.[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Applies mutations to the component tree.
   * @param {Node} root - Root component
   * @param {Array} mutations - Mutations to apply
   */
  static applyMutations(root, mutations) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'insert':
          // Find parent and insert
          if (root) {
            root.appendChild(mutation.node);
          }
          break;

        case 'remove':
          if (mutation.node.parent) {
            mutation.node.parent.removeChild(mutation.node);
          }
          break;

        case 'update':
          mutation.node.updateProps(mutation.props);
          break;

        case 'replace':
          if (mutation.oldNode.parent) {
            const index = mutation.oldNode.parent.children.indexOf(mutation.oldNode);
            mutation.oldNode.parent.removeChild(mutation.oldNode);
            mutation.oldNode.parent.insertChild(mutation.newNode, index);
          }
          break;
      }
    }
  }

  /**
   * Gets key for a component (for efficient reconciliation).
   * @param {Node} component - Component
   * @returns {string|null} Key or null
   */
  static getKey(component) {
    return component.props?.key || component.id;
  }
}

module.exports = { Reconciler };
