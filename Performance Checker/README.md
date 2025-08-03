# 🧠 PerformanceChecker

**PerformanceChecker** is a powerful Python library and CLI tool designed to analyze and profile Python scripts or functions. It provides loop/logic analysis, time and space complexity estimates, CPU/GPU usage, and full execution coverage — all in one clean interface.

> 📦 Use it as a CLI tool or import it directly into your Python projects.

---

## 🚀 Features

### ✅ CLI Mode
```bash
python check_performance.py <script.py> [flags]
```

-  Loop, conditional, and function count
-  Static code complexity estimation (O-notation)
-  Time + memory profiling
-  CPU and (optional) GPU usage
-  Line coverage (which lines were executed)

### ✅ Import Mode

```python
from performance_manager import test

def your_function():
    # your logic
    ...

test(your_function)
```

-  Time taken (total)
-  Memory usage
-  CPU/GPU usage
-  Line coverage
-  Optional flags to disable any metric

------

## 🧪 Example Scripts

Check the `examples/` directory:

| Example                                                      | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`example_import_usage.py`](https://github.com/DefinetlyNotAI/PerformanceChecker/blob/main/examples/example_import_usage.py) | Demonstrates usage as an import (ideal for testing custom functions). |
| [`example_cli_target.py`](https://github.com/DefinetlyNotAI/PerformanceChecker/blob/main/examples/example_cli_target.py) | A sample script meant to be profiled using CLI mode.         |

------

## ⚙️ CLI Flags

| Flag                 | Description                         |
| -------------------- | ----------------------------------- |
| `--no-time-coverage` | Disables execution time measurement |
| `--no-cpu`           | Disables CPU/GPU monitoring         |
| `--no-line-coverage` | Skips line coverage reporting       |

------

## 🧠 Example Output

### CLI

```
[*] Static Analysis:
Function 'main' detected
Total loops: 2
Total conditionals: 3

[*] Profiling:
Execution time: 0.77s
Peak memory usage: 0.40MB
CPU Usage: 4.5%
GPU Usage: 0%
```

### Import

```python
[+] Testing function: main
Execution time: 0.77s
Memory usage: 0.40MB
CPU Usage: 4.5%
GPU Usage: 0%
Executed 4 lines in function `main`
```

------

## 📦 Installation

```bash
git clone https://github.com/DefinetlyNotAI/PerformanceChecker.git
cd PerformanceChecker
pip install -r requirements.txt  # if needed (psutil, etc.)
```

------

## 📁 Project Structure

```
performance_manager/
├── analyzer.py        # Static code analyzer (loops, ifs, complexity)
├── profiler.py        # Time, memory, CPU/GPU usage
├── coverage.py        # Line execution tracking
├── cli.py             # CLI interface
└── __init__.py        # Import logic for test()

check_performance.py   # CLI runner script
examples/              # Demo scripts
```

------

## 📘 License

MIT License © 2025 [DefinetlyNotAI](https://github.com/DefinetlyNotAI)
