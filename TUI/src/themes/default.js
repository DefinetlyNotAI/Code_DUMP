const { Theme } = require('../style/Theme');

/**
 * Default theme.
 */
const defaultTheme = new Theme(
  'default',
  {
    primary: 'blue',
    secondary: 'cyan',
    success: 'green',
    warning: 'yellow',
    danger: 'red',
    muted: 'gray',
  },
  {
    text: {
      default: { fg: 'white', bg: 'default' },
    },
    box: {
      default: { fg: 'white', bg: 'default' },
      focused: { fg: 'white', bg: 'blue' },
    },
    button: {
      default: { fg: 'white', bg: 'blue', bold: true },
      focused: { fg: 'black', bg: 'cyan', bold: true },
      disabled: { fg: 'gray', bg: 'default', dim: true },
    },
    input: {
      default: { fg: 'white', bg: 'black' },
      focused: { fg: 'black', bg: 'cyan', underline: true },
      disabled: { fg: 'gray', bg: 'default', dim: true },
    },
    checkbox: {
      default: { fg: 'white', bg: 'default' },
      focused: { fg: 'white', bg: 'blue' },
      checked: { fg: 'green', bg: 'default', bold: true },
    },
    list: {
      default: { fg: 'white', bg: 'default' },
      focused: { fg: 'white', bg: 'blue' },
      selected: { fg: 'black', bg: 'cyan' },
    },
  },
);

module.exports = { defaultTheme };
