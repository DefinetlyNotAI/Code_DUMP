/**
 * useEffect hook for side effects.
 * @param {Function} effect - Effect function
 * @param {Array} [deps] - Dependency array
 * @type {Function}
 */
function useEffect(effect, deps) {
  // @type {object} currentComponentFiber
  if (!global.currentComponentFiber) {
    throw new Error('useEffect can only be called during component render');
  }

  const fiber = global.currentComponentFiber;

  if (!fiber.effects) {
    fiber.effects = [];
  }

  const hasNoDeps = !deps;
  const hasChangedDeps = deps && fiber.prevDeps && deps.some((d, i) => d !== fiber.prevDeps[i]);

  if (hasNoDeps || hasChangedDeps) {
    fiber.effects.push(() => {
      const cleanup = effect();
      return typeof cleanup === 'function' ? cleanup : undefined;
    });
  }

  fiber.prevDeps = deps;
}

module.exports = { useEffect };
