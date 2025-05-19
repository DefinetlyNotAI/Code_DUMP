# Swift_Library

## How to Import and Use

1. **Import the Logger module:**

   In any Swift file where you want to use the logger, import the module:

   ```swift
   import Swift_Library
   ```

2. **Using the Logger:**

   You can use the logger to log messages at different levels: debug, info, warning, and error.

   ```swift
   Logger.shared.log("This is a debug message", level: .debug)
   Logger.shared.log("This is an info message", level: .info)
   Logger.shared.log("This is a warning message", level: .warning)
   Logger.shared.log("This is an error message", level: .error)
   ```
