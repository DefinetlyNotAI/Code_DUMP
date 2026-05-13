const { Scheduler } = require('./Scheduler');

/**
 * Main animation/render frame loop.
 */
class FrameLoop {
  constructor(scheduler) {
    this.scheduler = scheduler || new Scheduler();
    this.isRunning = false;
    this.frameRate = 60;
    this.frameTime = 1000 / this.frameRate;
    this.lastFrameTime = 0;
    this.frameCount = 0;
  }

  /**
   * Starts the frame loop.
   * @param {Function} onFrame - Called each frame with {deltaTime, frameCount}
   */
  start(onFrame) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.frameCount = 0;

    const tick = () => {
      if (!this.isRunning) return;

      const now = Date.now();
      const deltaTime = now - this.lastFrameTime;

      if (deltaTime >= this.frameTime) {
        onFrame({
          deltaTime,
          frameCount: this.frameCount++,
          timestamp: now,
        });

        this.lastFrameTime = now;
        this.scheduler.run();
      }

      setImmediate(tick);
    };

    tick();
  }

  /**
   * Stops the frame loop.
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Sets target frame rate.
   * @param {number} fps - Frames per second
   */
  setFrameRate(fps) {
    this.frameRate = Math.max(1, fps);
    this.frameTime = 1000 / this.frameRate;
  }

  /**
   * Gets frame stats.
   * @returns {object}
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      frameRate: this.frameRate,
      isRunning: this.isRunning,
    };
  }
}

module.exports = { FrameLoop };
