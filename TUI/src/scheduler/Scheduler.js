const { TaskQueue } = require('./TaskQueue');

/**
 * Task scheduler for managing task execution.
 */
class Scheduler {
  constructor() {
    this.queue = new TaskQueue();
    this.running = false;
  }

  /**
   * Schedules a task.
   * @param {Function} fn - Task function
   * @param {number} priority - Priority
   */
  schedule(fn, priority = 0) {
    this.queue.enqueue(fn, priority);
  }

  /**
   * Runs scheduled tasks.
   */
  run() {
    if (this.running) return;
    this.running = true;
    this.queue.processAll();
    this.running = false;
  }

  /**
   * Clears all tasks.
   */
  clear() {
    this.queue.clear();
  }

  /**
   * Gets number of pending tasks.
   * @returns {number}
   */
  getPendingCount() {
    return this.queue.length();
  }

  /**
   * Checks if scheduler has pending tasks.
   * @returns {boolean}
   */
  hasPending() {
    return this.queue.length() > 0;
  }
}

module.exports = { Scheduler };
