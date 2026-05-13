/**
 * Event queue for buffering and dispatching events.
 */
class EventQueue {
  constructor() {
    this.events = [];
    this.processing = false;
  }

  /**
   * Enqueues an event.
   * @param {object} event - Event object {type, target, data, priority}
   */
  enqueue(event) {
    this.events.push({
      type: event.type,
      target: event.target,
      data: event.data || {},
      priority: event.priority || 0,
      timestamp: Date.now(),
    });

    this.events.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Processes and dispatches all queued events.
   * @param {Function} dispatcher - Function to call for each event
   */
  process(dispatcher) {
    if (this.processing) return;
    this.processing = true;

    const toProcess = [...this.events];
    this.events = [];

    for (const event of toProcess) {
      try {
        dispatcher(event);
      } catch (error) {
        console.error('Event dispatch error:', error);
      }
    }

    this.processing = false;
  }

  /**
   * Gets number of queued events.
   * @returns {number}
   */
  length() {
    return this.events.length;
  }

  /**
   * Clears the queue.
   */
  clear() {
    this.events = [];
  }
}

module.exports = { EventQueue };
