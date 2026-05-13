const { Parser } = require('./Parser');
const { Keyboard } = require('./Keyboard');
const { Mouse } = require('./Mouse');

/**
 * Central input coordinator.
 */
class InputManager {
  constructor(screen) {
    this.screen = screen;
    this.isStarted = false;
    this.listeners = [];
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Starts input handling.
   */
  start() {
    if (this.isStarted) return;
    this.isStarted = true;

    const stdin = process.stdin;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    stdin.on('data', (data) => {
      this.handleData(data);
    });

    stdin.on('error', (err) => {
      this.emit('error', err);
    });

    this.emit('start');
  }

  /**
   * Stops input handling.
   */
  stop() {
    if (!this.isStarted) return;
    this.isStarted = false;

    const stdin = process.stdin;

    if (stdin.isTTY) {
      try {
        stdin.setRawMode(false);
      } catch (e) {
        // Already off
      }
    }

    stdin.removeAllListeners('data');
    stdin.removeAllListeners('error');

    this.emit('stop');
  }

  /**
   * Handles incoming data.
   * @private
   */
  handleData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);

    const events = Parser.parse(this.buffer);

    for (const event of events) {
      const keyEvent = Keyboard.process(event);
      if (keyEvent) {
        this.emit('key', keyEvent);
      }

      const mouseEvent = Mouse.process(event);
      if (mouseEvent) {
        this.emit('mouse', mouseEvent);
      }
    }

    this.buffer = Buffer.alloc(0);
  }

  /**
   * Registers event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  /**
   * Removes event listener.
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    if (!this.listeners[event]) return;
    const idx = this.listeners[event].indexOf(handler);
    if (idx >= 0) {
      this.listeners[event].splice(idx, 1);
    }
  }

  /**
   * Emits event.
   * @private
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    for (const handler of this.listeners[event]) {
      handler(data);
    }
  }
}

module.exports = { InputManager };
