const { Screen } = require('../core/Screen');
const { Engine } = require('../core/Engine');
const { InputManager } = require('../input/InputManager');
const { Renderer } = require('../renderer/Renderer');
const { LayoutEngine } = require('../layout/LayoutEngine');
const { Scheduler } = require('../scheduler/Scheduler');
const { FrameLoop } = require('../scheduler/FrameLoop');
const { defaultTheme } = require('../themes/default');

/**
 * Creates a TUI application instance.
 * @param {object} options - Application options
 * @returns {object} App instance with render method
 */
function createApp(options = {}) {
  const screen = new Screen();
  const scheduler = new Scheduler();
  const frameLoop = new FrameLoop(scheduler);
  const renderer = new Renderer(screen);
  const layoutEngine = new LayoutEngine();
  const engine = new Engine({
    screen,
    renderer,
    layoutEngine,
    scheduler,
    theme: options.theme || defaultTheme,
    debug: options.debug || false,
  });

  const inputManager = new InputManager(screen);

  let isRunning = false;

  return {
    /**
     * Renders component tree.
     * @param {*} component - Root component
     * @param {object} container - Container element
     * @returns {Function} Un-render function
     */
    render(component, container) {
      if (isRunning) {
        throw new Error('App is already running');
      }

      isRunning = true;
      engine.initialize(component);
      inputManager.start();

      frameLoop.start(() => {
        engine.render();
      });

      return () => {
        isRunning = false;
        frameLoop.stop();
        inputManager.stop();
        engine.shutdown();
        screen.cleanup();
      };
    },

    /**
     * Gets the engine instance.
     * @returns {Engine}
     */
    getEngine() {
      return engine;
    },

    /**
     * Gets the screen instance.
     * @returns {Screen}
     */
    getScreen() {
      return screen;
    },

    /**
     * Gets the scheduler instance.
     * @returns {Scheduler}
     */
    getScheduler() {
      return scheduler;
    },

    /**
     * Updates the theme.
     * @param {Theme} theme - New theme
     */
    setTheme(theme) {
      engine.setTheme(theme);
    },

    /**
     * Gets the current theme.
     * @returns {Theme}
     */
    getTheme() {
      return engine.getTheme();
    },

    /**
     * Checks if app is running.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
}

module.exports = { createApp };
