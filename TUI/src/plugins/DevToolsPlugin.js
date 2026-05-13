/**
 * DevTools plugin for development and debugging.
 */
class DevToolsPlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.showBounds = options.showBounds || false;
    this.showStats = options.showStats || false;
    this.stats = {
      rendersPerSecond: 0,
      totalRenders: 0,
      totalUpdates: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
    this.lastRenderTime = Date.now();
    this.frameCount = 0;
  }

  /**
   * Gets component tree.
   */
  getComponentTree(node, depth = 0) {
    if (!node) return null;

    return {
      type: node.constructor.name,
      props: node.props || {},
      bounds: node.bounds || {},
      children: node.children ? node.children.map(child => this.getComponentTree(child, depth + 1)) : [],
      depth,
    };
  }

  /**
   * Gets performance stats.
   */
  getStats() {
    const now = Date.now();
    const elapsed = now - this.startTime;

    return {
      ...this.stats,
      uptime: elapsed,
      fps: Math.round((this.frameCount / elapsed) * 1000),
    };
  }

  /**
   * Plugin hooks.
   */
  onInit(context) {
    this.startTime = Date.now();
  }

  onRender(context) {
    if (!this.enabled) return;

    this.frameCount++;
    this.stats.totalRenders++;

    const now = Date.now();
    const elapsed = now - this.lastRenderTime;
    if (elapsed >= 1000) {
      this.stats.rendersPerSecond = this.frameCount;
      this.frameCount = 0;
      this.lastRenderTime = now;
    }
  }

  onUpdate(context) {
    if (!this.enabled) return;
    this.stats.totalUpdates++;
  }

  onShutdown(context) {
    if (this.showStats) {
      console.log('DevTools Stats:', this.getStats());
    }
  }
}

module.exports = { DevToolsPlugin };
