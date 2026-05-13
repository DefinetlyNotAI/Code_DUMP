/**
 * React-like useState hook for functional components.
 * @type {Function}
 */
let currentComponent = null;
const componentStates = new Map();

function useState(initialValue) {
  if (!currentComponent) {
    throw new Error('useState can only be called during component render');
  }

  const componentId = currentComponent.id;
  const hookKey = `${componentId}:state:${useState.hookIndex || 0}`;

  if (!componentStates.has(hookKey)) {
    componentStates.set(hookKey, typeof initialValue === 'function' ? initialValue() : initialValue);
  }

  const state = componentStates.get(hookKey);
  const setState = (newValue) => {
    const value = typeof newValue === 'function' ? newValue(state) : newValue;
    componentStates.set(hookKey, value);
    if (currentComponent && typeof currentComponent.requestRender === 'function') {
      currentComponent.requestRender();
    }
  };

  useState.hookIndex = (useState.hookIndex || 0) + 1;
  return [state, setState];
}

function setCurrentComponent(component) {
  currentComponent = component;
  useState.hookIndex = 0;
}

module.exports = { useState, setCurrentComponent };
