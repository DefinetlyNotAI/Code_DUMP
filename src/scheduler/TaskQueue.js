/**
 * Priority-based task queue.
 */
class TaskQueue {
  constructor() {
    this.tasks = [];
  }

  /**
   * Enqueues a task.
   * @param {Function} fn - Task function
   * @param {number} priority - Priority (lower runs first)
   */
  enqueue(fn, priority = 0) {
    this.tasks.push({ fn, priority });
    this.tasks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Dequeues and runs the next task.
   * @returns {*} Task result
   */
  dequeue() {
    const task = this.tasks.shift();
    if (task) {
      return task.fn();
    }
  }

  /**
   * Gets queue length.
   * @returns {number}
   */
  length() {
    return this.tasks.length;
  }

  /**
   * Clears queue.
   */
  clear() {
    this.tasks = [];
  }

  /**
   * Processes all tasks.
   */
  processAll() {
    while (this.tasks.length > 0) {
      this.dequeue();
    }
  }
}

module.exports = { TaskQueue };
