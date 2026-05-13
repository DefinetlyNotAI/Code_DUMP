const Flex = require('./Flex');

/**
 * Stack container - Vertical flex container.
 */
class Stack extends Flex {
  constructor(props = {}) {
    super({ ...props, direction: 'column' });
  }
}

module.exports = Stack;
