# 🧠 PyDissect

A minimal but powerful static and dynamic analyzer for Python scripts.  
It parses, inspects, and disassembles Python code to reveal its **AST structure**, **function/class definitions**, and **bytecode**—all exported cleanly into human-readable files.

---

## 📦 Features

- 📄 Dumps the full **Abstract Syntax Tree (AST)**.
- 🔍 Lists all **functions**, **async functions**, and **classes** with line numbers.
- 🔬 Outputs **full bytecode disassembly** of the script.
- 🧩 Separately disassembles **top-level functions** for focused inspection.
- 📁 Saves everything in a cleanly organized folder named after the script.

---

## 🚀 Usage

```bash
python dissect.py <target_script.py>
```

### Example:
```bash
python dissect.py example.py
```

This will create a folder called [`example/`](example) in the current working directory containing:

- [`ast.txt`](example/ast.txt): Full AST dump
- [`functions.txt`](example/functions.txt): All detected functions and classes with line numbers
- [`bytecode.txt`](example/bytecode.txt): Complete bytecode of the script
- [`functions_bytecode.txt`](example/functions_bytecode.txt): Bytecode for each top-level function

---

## 📂 Output Structure

```
example/
├── ast.txt
├── functions.txt
├── bytecode.txt
└── functions_bytecode.txt
```

---

## ⚠️ Notes

> [!WARNING]
> - Only **top-level functions** are disassembled separately. Nested functions, lambdas, etc., aren't isolated.
> - Code execution (`exec`) is used to analyze function bytecode. Avoid running this tool on **untrusted scripts** unless sandboxed.

---

## 🛠 Dependencies

- Built-in Python modules only:
  - `ast`
  - `dis`
  - `os`
  - `sys`

Tested on Python 3.11

## 🧪 License

MIT License — do whatever, just don’t blame the author if it goes sideways.

---

Let me know if you want badges, emoji-free version, or to turn this into a PyPI package.
