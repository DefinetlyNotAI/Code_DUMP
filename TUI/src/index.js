// App factories
const { createApp } = require('./app/createApp');

// Hooks
const { useState } = require('./hooks/useState');
const { useEffect } = require('./hooks/useEffect');
const { useFocus } = require('./hooks/useFocus');

// Core classes
const Node = require('./dom/Node');
const Element = require('./dom/Element');
const { Engine } = require('./core/Engine');
const { Screen } = require('./core/Screen');

// Renderer
const { Renderer } = require('./renderer/Renderer');
const { Buffer } = require('./renderer/Buffer');
const { ANSI } = require('./renderer/ANSI');

// Layout
const { LayoutEngine } = require('./layout/LayoutEngine');
const { FlexLayout } = require('./layout/FlexLayout');
const { GridLayout } = require('./layout/GridLayout');

// Events
const { EventEmitter } = require('./events/EventEmitter');
const { FocusManager } = require('./events/FocusManager');

// Input
const { InputManager } = require('./input/InputManager');
const { Keymap } = require('./input/Keymap');

// Styling
const { Colors } = require('./style/Colors');
const { Style } = require('./style/Style');
const { Theme } = require('./style/Theme');
const { defaultTheme } = require('./themes/default');
const { lightTheme } = require('./themes/light');
const { darkTheme } = require('./themes/dark');

// Widgets
const Box = require('./widgets/Box');
const Text = require('./widgets/Text');
const Button = require('./widgets/Button');
const Input = require('./widgets/Input');
const Checkbox = require('./widgets/Checkbox');
const List = require('./widgets/List');
const ScrollView = require('./widgets/ScrollView');

// Containers
const Flex = require('./containers/Flex');
const Grid = require('./containers/Grid');
const Stack = require('./containers/Stack');
const Absolute = require('./containers/Absolute');

// Plugins
const { PluginManager } = require('./plugins/PluginManager');
const { LoggerPlugin } = require('./plugins/LoggerPlugin');
const { DevToolsPlugin } = require('./plugins/DevToolsPlugin');

// Utilities
const clamp = require('./utils/clamp');
const deepMerge = require('./utils/deepMerge');

module.exports = {
  // App
  createApp,

  // Hooks
  useState,
  useEffect,
  useFocus,

  // DOM
  Node,
  Element,

  // Core
  Engine,
  Screen,

  // Renderer
  Renderer,
  Buffer,
  ANSI,

  // Layout
  LayoutEngine,
  FlexLayout,
  GridLayout,

  // Events
  EventEmitter,
  FocusManager,

  // Input
  InputManager,
  Keymap,

  // Styling
  Colors,
  Style,
  Theme,
  defaultTheme,
  lightTheme,
  darkTheme,

  // Widgets
  Box,
  Text,
  Button,
  Input,
  Checkbox,
  List,
  ScrollView,

  // Containers
  Flex,
  Grid,
  Stack,
  Absolute,

  // Plugins
  PluginManager,
  LoggerPlugin,
  DevToolsPlugin,

  // Utilities
  clamp,
  deepMerge,
};


