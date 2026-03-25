# 🎨 Styling & Themes Guide

## Overview

The TUI Framework provides a comprehensive styling system that allows you to color and format your terminal UI with a familiar CSS-like approach.

## Color System

### Supported Modes

#### 16-Color ANSI (Default)
Standard terminal colors supported everywhere:

```javascript
const colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const brightColors = ['brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan'];
```

#### 256-Color Mode
Extended color palette for more vibrant UIs:

```javascript
const app = createApp(MyComponent, { colors: 256 });
```

#### Truecolor RGB
Full 24-bit color support on modern terminals:

```javascript
const app = createApp(MyComponent, { colors: 'truecolor' });
```

## Style Properties

### Text Formatting

```javascript
const style = {
  fg: 'red',              // Foreground color
  bg: 'white',            // Background color
  bold: true,             // Bold text
  dim: true,              // Dim/faint text
  italic: true,           // Italic text
  underline: true,        // Underlined text
  reverse: true,          // Reverse video (swap fg/bg)
  hidden: true,           // Hidden text
  strikethrough: true     // Strikethrough text
};
```

### Color Values

```javascript
// Named colors
{ fg: 'red', bg: 'blue' }

// Hex colors (256-color+ only)
{ fg: '#ff0000', bg: '#0000ff' }

// RGB values (truecolor only)
{ fg: { r: 255, g: 0, b: 0 }, bg: { r: 0, g: 0, b: 255 } }

// ANSI color codes (0-255)
{ fg: 31, bg: 44 }
```

## Using Styles

### Direct Style Application

```javascript
const { Style } = require('tui-framework');

const redBold = new Style({
  fg: 'red',
  bold: true
});

console.log(redBold.toANSI()); // Outputs ANSI escape codes
```

### Styled Components

```javascript
class StyledText extends Element {
  render() {
    const style = {
      fg: 'yellow',
      bold: true,
      underline: true
    };
    
    return `${ANSI.applyStyle('Important', style)}`;
  }
}
```

### Style Merging

```javascript
const baseStyle = { fg: 'blue', bold: true };
const overrideStyle = { fg: 'red' };

const merged = Style.merge(baseStyle, overrideStyle);
// Result: { fg: 'red', bold: true }
```

## Themes

### Using Built-in Themes

```javascript
const { defaultTheme, lightTheme, darkTheme } = require('tui-framework');

// Select a theme
const theme = darkTheme;
```

### Theme Structure

```javascript
{
  name: 'dark',
  colors: {
    primary: 'blue',
    secondary: 'green',
    error: 'red',
    warning: 'yellow',
    success: 'green',
    info: 'cyan'
  },
  components: {
    button: {
      default: { fg: 'white', bg: 'blue' },
      focused: { fg: 'blue', bg: 'white', bold: true },
      pressed: { fg: 'white', bg: 'darkBlue', reverse: true }
    },
    input: {
      default: { fg: 'white', bg: 'black' },
      focused: { fg: 'yellow', bg: 'black', bold: true }
    },
    // ... more components
  }
}
```

### Creating Custom Themes

```javascript
const { Theme } = require('tui-framework');

const myTheme = new Theme('my-theme', 
  // Colors
  {
    primary: 'blue',
    secondary: 'magenta',
    error: 'red',
    success: 'green',
    warning: 'yellow'
  },
  // Component styles
  {
    box: {
      default: { fg: 'white', bg: 'black' },
      primary: { fg: 'black', bg: 'blue' }
    },
    button: {
      default: { fg: 'white', bg: 'blue' },
      focused: { fg: 'yellow', bg: 'darkBlue', bold: true }
    },
    input: {
      default: { fg: 'white', bg: 'black' },
      focused: { fg: 'yellow', bg: 'black', bold: true }
    }
  }
);
```

### Applying Themes

```javascript
class MyApp extends Element {
  constructor() {
    super();
    this.theme = myTheme;
  }

  getComponentStyle(component, state = 'default') {
    return this.theme.getComponentStyle(component, state);
  }
}
```

## ANSI Code Generation

### Direct ANSI Output

```javascript
const { ANSI, Colors } = require('tui-framework');

// Reset
ANSI.reset();          // '\x1b[0m'

// Text attributes
ANSI.bold();           // '\x1b[1m'
ANSI.dim();            // '\x1b[2m'
ANSI.italic();         // '\x1b[3m'
ANSI.underline();      // '\x1b[4m'
ANSI.reverse();        // '\x1b[7m'
ANSI.hidden();         // '\x1b[8m'
ANSI.strikethrough();  // '\x1b[9m'

// Colors
ANSI.fg(Colors.red);          // '\x1b[31m'
ANSI.bg(Colors.blue);         // '\x1b[44m'

// Cursor
ANSI.cursorTo(10, 5);         // '\x1b[5;10H'
ANSI.cursorUp(3);             // '\x1b[3A'
ANSI.cursorDown(2);           // '\x1b[2B'
```

## Color Reference

### Standard Colors (16)

| Name | Code |
|------|------|
| black | 30 |
| red | 31 |
| green | 32 |
| yellow | 33 |
| blue | 34 |
| magenta | 35 |
| cyan | 36 |
| white | 37 |

### Bright Colors (16)

| Name | Code |
|---|---|
| brightRed | 91 |
| brightGreen | 92 |
| brightYellow | 93 |
| brightBlue | 94 |
| brightMagenta | 95 |
| brightCyan | 96 |

## Best Practices

1. **Use Themes** - Define your colors in a theme, not hardcoded
2. **Accessibility** - Avoid color-only differentiation
3. **Contrast** - Ensure sufficient contrast between fg and bg
4. **Consistency** - Use the same colors for similar elements
5. **Performance** - Cache style objects when possible

## Examples

### Colored Box

```javascript
class ColoredBox extends Element {
  render() {
    const style = {
      fg: 'white',
      bg: 'blue',
      bold: true
    };
    
    const content = 'Hello World';
    return `${ANSI.applyStyle(content, style)}`;
  }
}
```

### Theme-Based Button

```javascript
class ThemedButton extends Button {
  render() {
    const style = this.focused 
      ? this.theme.getComponentStyle('button', 'focused')
      : this.theme.getComponentStyle('button', 'default');
    
    return `${ANSI.applyStyle(this.label, style)}`;
  }
}
```

### Status Colors

```javascript
class StatusBar extends Element {
  render() {
    const statusColor = this.status === 'error' 
      ? this.theme.getColor('error')
      : this.theme.getColor('success');
    
    const style = { fg: statusColor };
    return `Status: ${ANSI.applyStyle(this.message, style)}`;
  }
}
```

## See Also

- [Colors API](./colors.md)
- [Theming Guide](./theming.md)
- [Widget Customization](./widgets.md)
