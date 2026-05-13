const { Theme } = require('../style/Theme');

/**
 * Light theme.
 */
const lightTheme = new Theme(
  'light',
  {
    primary: 'blue',
    secondary: 'cyan',
    success: 'green',
    warning: 'yellow',
    danger: 'red',
    muted: 'brightBlack',
  },
  {
    text: {
      default: { fg: 'black', bg: 'white' },
    },
    box: {
      default: { fg: 'black', bg: 'white' },
      focused: { fg: 'white', bg: 'blue' },
    },
    button: {
      default: { fg: 'white', bg: 'blue', bold: true },
      focused: { fg: 'white', bg: 'cyan', bold: true },
      disabled: { fg: 'brightBlack', bg: 'white', dim: true },
    },
    input: {
      default: { fg: 'black', bg: 'white' },
      focused: { fg: 'white', bg: 'blue', underline: true },
      disabled: { fg: 'brightBlack', bg: 'white', dim: true },
    },
    checkbox: {
      default: { fg: 'black', bg: 'white' },
      focused: { fg: 'white', bg: 'blue' },
      checked: { fg: 'green', bg: 'white', bold: true },
    },
    list: {
      default: { fg: 'black', bg: 'white' },
      focused: { fg: 'white', bg: 'blue' },
      selected: { fg: 'white', bg: 'cyan' },
    },
  },
);

module.exports = { lightTheme };
