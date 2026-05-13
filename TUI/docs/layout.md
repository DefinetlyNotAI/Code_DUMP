# 📐 Layout System Guide

## Overview

The TUI Framework provides two powerful layout systems: **Flex** (flexbox-like) and **Grid** (CSS Grid-like). Both support responsive sizing and automatic measurement.

## Flex Layout

### Basic Usage

```javascript
const { Flex } = require('tui-framework');

const layout = new Flex({
  direction: 'column',
  gap: 1,
  children: [header, content, footer]
});
```

### Properties

#### direction
- `'row'` (default) - Arrange children horizontally
- `'column'` - Arrange children vertically

```javascript
// Horizontal layout
const row = new Flex({
  direction: 'row',
  children: [left, center, right]
});

// Vertical layout
const column = new Flex({
  direction: 'column',
  children: [top, middle, bottom]
});
```

#### justifyContent
Align children along the main axis:

- `'flex-start'` (default) - Align to start
- `'flex-end'` - Align to end
- `'center'` - Center children
- `'space-between'` - Space between children
- `'space-around'` - Space around children

```javascript
// Center items horizontally
const centered = new Flex({
  direction: 'row',
  justifyContent: 'center',
  children: [item1, item2, item3]
});

// Distribute with space between
const spaced = new Flex({
  direction: 'row',
  justifyContent: 'space-between',
  children: [start, end]
});
```

#### alignItems
Align children along the cross axis:

- `'flex-start'` (default) - Align to start
- `'center'` - Center children
- `'stretch'` - Stretch to fill

```javascript
// Center items vertically
const vcenter = new Flex({
  direction: 'column',
  alignItems: 'center',
  children: [item1, item2]
});

// Stretch items to full width
const stretch = new Flex({
  direction: 'column',
  alignItems: 'stretch',
  children: [full1, full2]
});
```

#### gap
Space between children:

```javascript
const spaced = new Flex({
  direction: 'column',
  gap: 2, // 2 lines between items
  children: [item1, item2, item3]
});
```

### Examples

#### Header, Content, Footer

```javascript
const layout = new Flex({
  direction: 'column',
  children: [
    header,      // Takes natural size
    content,     // Takes remaining space
    footer       // Takes natural size
  ]
});
```

#### Navigation Menu

```javascript
const navbar = new Flex({
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  children: [logo, menu, account]
});
```

#### Card Grid

```javascript
const grid = new Flex({
  direction: 'row',
  gap: 2,
  justifyContent: 'space-around',
  children: [card1, card2, card3]
});
```

### Nested Flex

```javascript
const app = new Flex({
  direction: 'column',
  children: [
    header,
    new Flex({
      direction: 'row',
      gap: 2,
      children: [
        sidebar,
        new Flex({
          direction: 'column',
          children: [content, footer]
        })
      ]
    })
  ]
});
```

## Grid Layout

### Basic Usage

```javascript
const { Grid } = require('tui-framework');

const grid = new Grid({
  cols: 3,
  gap: 1,
  children: [item1, item2, item3, item4, item5, item6]
});
```

### Properties

#### cols
Number of columns:

```javascript
const twoColumn = new Grid({
  cols: 2,
  children: [item1, item2, item3, item4]
});
```

#### rows
Number of rows:

```javascript
const threeRow = new Grid({
  rows: 3,
  children: [item1, item2, item3]
});
```

#### gap
Space between cells:

```javascript
const spacious = new Grid({
  cols: 2,
  gap: 2, // 2 lines/columns between items
  children: [item1, item2, item3, item4]
});
```

### Examples

#### Image Gallery (3 columns)

```javascript
const gallery = new Grid({
  cols: 3,
  gap: 1,
  children: images.map(img => new ImageBox(img))
});
```

#### Dashboard (2x2)

```javascript
const dashboard = new Grid({
  cols: 2,
  rows: 2,
  gap: 2,
  children: [
    statsWidget,
    chartWidget,
    logsWidget,
    settingsWidget
  ]
});
```

#### Features Grid (auto-flow)

```javascript
const features = new Grid({
  cols: 4,
  gap: 1,
  children: featureList.map(f => new FeatureCard(f))
});
```

## Stack Container

### Convenience Wrapper

`Stack` is a convenient wrapper for vertical flex layout:

```javascript
const { Stack } = require('tui-framework');

// These are equivalent:
const method1 = new Stack({ gap: 2, children: [a, b, c] });

const method2 = new Flex({
  direction: 'column',
  gap: 2,
  children: [a, b, c]
});
```

### Usage

```javascript
const sidebar = new Stack({
  gap: 1,
  children: [
    new Text('Menu'),
    menuItem1,
    menuItem2,
    menuItem3
  ]
});
```

## Absolute Positioning

### Basic Usage

```javascript
const { Absolute } = require('tui-framework');

const overlay = new Absolute({
  x: 10,
  y: 5,
  width: 30,
  height: 10,
  children: [content]
});
```

### Properties

- `x` - Horizontal position (column)
- `y` - Vertical position (row)
- `width` - Container width
- `height` - Container height

### Examples

#### Modal Dialog

```javascript
const modal = new Absolute({
  x: 20,
  y: 5,
  width: 60,
  height: 20,
  children: [dialogContent]
});
```

#### Floating Tooltip

```javascript
const tooltip = new Absolute({
  x: Math.floor(triggerX + 5),
  y: Math.floor(triggerY + 1),
  width: 30,
  height: 3,
  children: [tooltipText]
});
```

## Responsive Design

### Terminal Size Detection

```javascript
function ResponsiveApp() {
  const width = process.stdout.columns;
  const height = process.stdout.rows;
  
  if (width < 60) {
    // Mobile layout
    return mobile;
  } else {
    // Desktop layout
    return desktop;
  }
}
```

### Dynamic Layouts

```javascript
class AdaptiveLayout extends Element {
  getLayout() {
    if (this.bounds.width < 80) {
      // Single column for narrow screens
      return new Flex({
        direction: 'column',
        children: [sidebar, content]
      });
    } else {
      // Two column for wide screens
      return new Flex({
        direction: 'row',
        children: [sidebar, content]
      });
    }
  }
}
```

### Resize Handling

```javascript
useEffect(() => {
  const handleResize = () => {
    // Recalculate layout
    app.render();
  };
  
  process.stdout.on('resize', handleResize);
  
  return () => {
    process.stdout.off('resize', handleResize);
  };
}, []);
```

## Layout Measurement

### Text Width

```javascript
const { Measure } = require('tui-framework');

const width = Measure.textWidth('Hello'); // 5
const width2 = Measure.textWidth('世界'); // 4 (CJK characters are 2-width)
```

### Content Size

```javascript
const size = Measure.contentSize(component);
// { width: 30, height: 5 }
```

### Constraints

```javascript
const { Constraints } = require('tui-framework');

const limited = new Constraints({
  minWidth: 20,
  maxWidth: 60,
  minHeight: 5,
  maxHeight: 30
});
```

## Best Practices

1. **Use Flex for linear layouts** - Rows and columns
2. **Use Grid for tabular layouts** - Even distributions
3. **Nest layouts for complex UIs** - Break into smaller components
4. **Responsive design** - Check terminal size
5. **Add gaps** - Improve visual separation
6. **Use Stack for convenience** - For vertical layouts

## Common Patterns

### Sidebar + Main

```javascript
new Flex({
  direction: 'row',
  gap: 2,
  children: [
    new Flex({ direction: 'column', children: [sidebarItems] }),
    new Flex({ direction: 'column', children: [mainContent] })
  ]
});
```

### Button Row

```javascript
new Flex({
  direction: 'row',
  justifyContent: 'space-between',
  gap: 2,
  children: [cancelBtn, submitBtn]
});
```

### Centered Content

```javascript
new Flex({
  direction: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  children: [title, content]
});
```

## See Also

- [Flex API](./api/flex.md)
- [Grid API](./api/grid.md)
- [Component Guide](./components.md)
- [CSS Flexbox Reference](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
