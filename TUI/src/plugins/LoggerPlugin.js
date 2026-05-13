/**
 * Logger plugin for debugging and monitoring.
 */
class LoggerPlugin {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.logs = [];
    this.maxLogs = options.maxLogs || 1000;
  }

  /**
   * Logs a message.
   */
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.verbose) {
      console.log(`[${level}] ${message}`, data);
    }
  }

  /**
   * Gets logs.
   */
  getLogs(level = null) {
    if (!level) return this.logs;
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clears logs.
   */
  clear() {
    this.logs = [];
  }

  /**
   * Plugin hooks.
   */
  onInit(context) {
    this.log('info', 'Application initialized');
  }

  onRender(context) {
    this.log('debug', 'Frame rendered');
  }

  onInput(context) {
    this.log('debug', 'Input event', { key: context.key });
  }

  onShutdown(context) {
    this.log('info', 'Application shutting down');
  }
}

module.exports = { LoggerPlugin };
