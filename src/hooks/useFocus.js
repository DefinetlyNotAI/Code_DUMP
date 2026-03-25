/**
 * useFocus hook for focus management.
 * @type {Function}
 */
function useFocus() {
  // @type {object} currentComponentFiber
  // @type {FocusManager} focusManager
  if (!global.currentComponentFiber) {
    throw new Error('useFocus can only be called during component render');
  }

  const component = global.currentComponentFiber.component;
  const focusManager = global.focusManager;

  if (!focusManager) {
    return [false, () => {}, () => {}];
  }

  const isFocused = focusManager.isFocused(component);

  const focus = () => {
    focusManager.setFocus(component);
  };

  const blur = () => {
    focusManager.blur();
  };

  return [isFocused, focus, blur];
}

module.exports = { useFocus };
