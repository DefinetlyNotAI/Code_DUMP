const { Theme } = require('../style/Theme');

/**
 * Dark theme.
 */
const darkTheme = new Theme(
  'dark',
  {
    primary: 'brightBlue',
    secondary: 'brightCyan',
    success: 'brightGreen',
    warning: 'brightYellow',
    danger: 'brightRed',
    muted: 'brightBlack',
  },
  {
    text: {
      default: { fg: 'brightWhite', bg: 'black' },
    },
    box: {
      default: { fg: 'brightWhite', bg: 'black' },
      focused: { fg: 'black', bg: 'brightBlue' },
    },
    button: {
      default: { fg: 'black', bg: 'brightBlue', bold: true },
      focused: { fg: 'black', bg: 'brightCyan', bold: true },
      disabled: { fg: 'brightBlack', bg: 'black', dim: true },
    },
    input: {
      default: { fg: 'brightWhite', bg: 'black' },
      focused: { fg: 'black', bg: 'brightCyan', underline: true },
      disabled: { fg: 'brightBlack', bg: 'black', dim: true },
    },
    checkbox: {
      default: { fg: 'brightWhite', bg: 'black' },
      focused: { fg: 'black', bg: 'brightBlue' },
      checked: { fg: 'brightGreen', bg: 'black', bold: true },
    },
    list: {
      default: { fg: 'brightWhite', bg: 'black' },
      focused: { fg: 'black', bg: 'brightBlue' },
      selected: { fg: 'black', bg: 'brightCyan' },
    },
  },
);

module.exports = { darkTheme };
