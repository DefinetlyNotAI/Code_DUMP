# Math_Flag 📎

Welcome to Math_Flag 🌐,
a cutting-edge tool
designed to return all special mathematical flags for a number
inputted either inputted by command line, or by calling it from a function.
Crafted with python,
it's an actively developed project that is
aimed at simplifying math numerical flagging.
This comprehensive guide is here to equip you with everything you need to use Math_Flag effectively.

## 🛠️ Installation and Setup 🛠️

### Prerequisites

Ensure your system meets these requirements:

- Has Python 3.
- Has required libraries.

### Step-by-Step Installation

1. **Clone the Repository**: Use Git to clone Math_Flag to your local machine.

2. **Navigate to the Project Directory**: Change your current directory to the cloned CHANGE_ME folder:

   ```powershell
   cd Math_Flag
   ```

### Basic Usage

You may import Math_Flag into your Python script as follows:
```python
from flag import Check
check = Check(use_json=False, show_errors=False)
print(check.evaluate(1234))
```

Where the following parameters are optional:
- `use_json`: Whether to use JSON when returning results, otherwise will use simple english. Defaults to True.
- `show_errors`: Whether to show errors or warnings from the code. Defaults to True.
