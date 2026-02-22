# Math_to_Graph 📎

Welcome to `Math_to_Graph` 🌐,
a cutting-edge tool
designed to turn any math formula into a complex math graph.
Crafted with python.
This comprehensive guide is here to equip you with everything you need to use `Math_to_Graph` effectively.

## 🛠️ Installation and Setup 🛠️

### Prerequisites

Ensure your system meets these requirements:

- Has Python Installed.
- Has downloaded all dependencies.


### Step-by-Step Installation

1. **Clone the Repository**: Use Git to clone to your local machine.

2. **Navigate to the Project Directory**: Change your current directory to the cloned CHANGE_ME folder:

   ```powershell
   cd Math_to_Graph
   ```

3. **Run CHANGE_ME**: Run `./Graphify` more info below.


### Basic Usage


```python
from Graphify import Grapher

# Example usage
grapher = Grapher()
grapher.generate_plot("FORMULA", "START_VALUE", "END_VALUE")
```

Formula must include (x) and nothing else in it, like `x + 5`.

Formula can support any function from the default python module, as well as cos, tan, sin and log.
Prioritizes BODMAS where brackets come first, etc

Super basic tool, no fancy usage, but it's all you need to get started.

