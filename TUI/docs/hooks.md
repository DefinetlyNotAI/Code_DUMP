# 🪝 Hooks System Guide

## Overview

Hooks provide a way to use state and other React-like features in your TUI components without writing class components. The TUI Framework implements three essential hooks: `useState`, `useEffect`, and `useFocus`.

## useState Hook

### Basic Usage

```javascript
const [count, setCount] = useState(0);
```

### Parameters

- `initialValue` - Initial state value (required)

### Returns

- `[state, setState]` - Current state and function to update it

### Examples

#### Simple Counter

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  
  return `Count: ${count}`;
}
```

#### Text Input

```javascript
function TextInput() {
  const [text, setText] = useState('');
  
  const handleChange = (newText) => {
    setText(newText);
  };
  
  return `Input: ${text}`;
}
```

#### Multiple State Variables

```javascript
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  return `Name: ${name}, Email: ${email}, Subscribed: ${subscribed}`;
}
```

### setState Function

#### Direct Updates

```javascript
setCount(5);
```

#### Functional Updates

```javascript
setCount(prevCount => prevCount + 1);
```

#### Object Updates

```javascript
const [user, setUser] = useState({ name: '', age: 0 });
setUser({ ...user, name: 'John' });
```

### State Updates Trigger Re-renders

Whenever state is updated, the component automatically re-renders with the new state.

```javascript
// This triggers a re-render
setState(newValue);

// The component's render() function is called again
// with the updated state
```

## useEffect Hook

### Basic Usage

```javascript
useEffect(() => {
  // Effect code runs after render
}, [dependencies]);
```

### Parameters

- `effect` - Function to run (required)
- `dependencies` - Array of values to watch (optional)

### Returns

- Cleanup function (optional) - Called before next effect or unmount

### Examples

#### Run Once on Mount

```javascript
useEffect(() => {
  console.log('Component mounted');
  return () => {
    console.log('Component unmounting');
  };
}, []); // Empty dependency array
```

#### Run on Every Render

```javascript
useEffect(() => {
  console.log('Component rendered');
}); // No dependency array
```

#### Run When Dependencies Change

```javascript
useEffect(() => {
  console.log('Count changed to:', count);
}, [count]); // Runs when count changes
```

#### Cleanup Function

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);
  
  return () => {
    clearInterval(interval); // Cleanup
  };
}, []);
```

### Common Patterns

#### Fetch Data

```javascript
useEffect(() => {
  const fetchData = async () => {
    const result = await fetch('/api/data');
    const data = await result.json();
    setData(data);
  };
  
  fetchData();
}, []);
```

#### Event Listener

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [onSubmit]);
```

#### Auto-save

```javascript
const [text, setText] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    saveToServer(text);
  }, 1000);
  
  return () => clearTimeout(timer);
}, [text]);
```

## useFocus Hook

### Basic Usage

```javascript
const [isFocused, focus, blur] = useFocus();
```

### Returns

- `isFocused` - Boolean indicating if component has focus
- `focus()` - Function to gain focus
- `blur()` - Function to lose focus

### Examples

#### Focus Indicator

```javascript
function FocusableInput() {
  const [isFocused, focus, blur] = useFocus();
  
  const border = isFocused ? '[...]' : ' ... ';
  return `${border}`;
}
```

#### Navigation

```javascript
function Buttons() {
  const [isFocused, focus, blur] = useFocus();
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      blur();
      // Focus next button
    }
  };
  
  return isFocused ? '[FOCUSED]' : '[ BUTTON]';
}
```

#### Click to Focus

```javascript
function ClickableElement() {
  const [isFocused, focus, blur] = useFocus();
  
  const handleClick = () => {
    if (!isFocused) {
      focus();
    }
  };
  
  return isFocused ? 'Focused: YES' : 'Focused: NO';
}
```

## Rules of Hooks

1. **Call hooks at top level** - Don't call hooks inside loops, conditions, or nested functions
2. **Call hooks in components** - Only call hooks from functional components or custom hooks
3. **Use the same order** - Always call hooks in the same order between renders

### ✅ Correct

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  
  useEffect(() => {
    // ...
  }, []);
  
  return '...';
}
```

### ❌ Incorrect

```javascript
function Component() {
  if (someCondition) {
    const [count, setCount] = useState(0); // ❌ Conditionally
  }
  
  for (let i = 0; i < 3; i++) {
    const [text, setText] = useState(''); // ❌ In loop
  }
  
  return '...';
}
```

## Combining Hooks

### Complete Example

```javascript
function TodoItem() {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [isFocused, focus, blur] = useFocus();
  
  useEffect(() => {
    if (isEditing && isFocused) {
      // Auto-focus input when editing
    }
  }, [isEditing, isFocused]);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
    focus();
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    blur();
  };
  
  if (isEditing) {
    return `[${text}]`;
  }
  
  return isFocused ? `> ${text}` : `  ${text}`;
}
```

## Performance Tips

1. **Use dependency arrays** - Always specify what your effect depends on
2. **Avoid unnecessary re-renders** - Keep state as close to where it's used
3. **Clean up in useEffect** - Always return a cleanup function when needed
4. **Memoize callbacks** - Use useCallback for event handlers if needed

## Common Mistakes

### Missing Dependency

```javascript
// ❌ Effect never re-runs when count changes
useEffect(() => {
  console.log('Count:', count);
}, []); // Missing count

// ✅ Correct
useEffect(() => {
  console.log('Count:', count);
}, [count]); // Include count
```

### State Closure

```javascript
// ❌ Uses stale count value
const [count, setCount] = useState(0);
setTimeout(() => {
  console.log('Count:', count); // Always logs 0
}, 1000);

// ✅ Use effect to capture current value
useEffect(() => {
  setTimeout(() => {
    console.log('Count:', count);
  }, 1000);
}, [count]);
```

## Debugging Hooks

### Print State Changes

```javascript
useEffect(() => {
  console.log('Component state:', { count, text });
}, [count, text]);
```

### Log Dependencies

```javascript
useEffect(() => {
  console.log('Dependencies changed');
  return () => console.log('Cleanup');
}, [dependency]);
```

## See Also

- [Component Guide](./components.md)
- [State Management](./state.md)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)
