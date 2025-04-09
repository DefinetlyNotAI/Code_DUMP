import ast
import dis
import sys
import os

def print_ast(source, output_dir):
    ast_filename = os.path.join(output_dir, "ast.txt")
    with open(ast_filename, "w", encoding="utf-8") as f:
        f.write("[*] AST Dump:\n")
        tree = ast.parse(source)
        f.write(ast.dump(tree, indent=2))
        f.write("\n")
    print(f"[*] AST written to {ast_filename}")

def list_functions(tree, output_dir):
    functions_filename = os.path.join(output_dir, "functions.txt")
    with open(functions_filename, "w", encoding="utf-8") as f:
        f.write("[*] Functions and Classes:\n")
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                f.write(f"  Function: {node.name}() @ line {node.lineno}\n")
            elif isinstance(node, ast.AsyncFunctionDef):
                f.write(f"  Async Function: {node.name}() @ line {node.lineno}\n")
            elif isinstance(node, ast.ClassDef):
                f.write(f"  Class: {node.name} @ line {node.lineno}\n")
    print(f"[*] Functions and classes written to {functions_filename}")

def disassemble_code(source, filename, output_dir):
    bytecode_filename = os.path.join(output_dir, "bytecode.txt")
    with open(bytecode_filename, "w", encoding="utf-8") as f:
        f.write("[*] Bytecode Disassembly:\n")
        code = compile(source, filename, 'exec')
        dis.dis(code, file=f)
    print(f"[*] Bytecode disassembly written to {bytecode_filename}")

def disassemble_functions(tree, source, filename, output_dir):
    functions_bytecode_filename = os.path.join(output_dir, "functions_bytecode.txt")
    with open(functions_bytecode_filename, "w", encoding="utf-8") as f:
        f.write("[*] Bytecode of Top-Level Functions:\n")
        namespace = {}
        exec(compile(source, filename, 'exec'), namespace)
        for name, obj in namespace.items():
            if callable(obj) and hasattr(obj, '__code__'):
                f.write(f"--- {name} ---\n")
                dis.dis(obj, file=f)
    print(f"[*] Functions bytecode written to {functions_bytecode_filename}")

def dissect_file(filename):
    if not os.path.exists(filename):
        print(f"[!] File not found: {filename}")
        return

    # Create output folder named after the script
    script_name = os.path.splitext(os.path.basename(filename))[0]
    output_dir = os.path.join(os.getcwd(), script_name)
    os.makedirs(output_dir, exist_ok=True)
    print(f"[*] Created folder: {output_dir}")

    # Read the source code
    with open(filename, "r", encoding="utf-8") as f:
        source = f.read()

    # Parse the AST
    tree = ast.parse(source)
    print_ast(source, output_dir)
    list_functions(tree, output_dir)
    disassemble_code(source, filename, output_dir)
    disassemble_functions(tree, source, filename, output_dir)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("[!] Usage: python python_dissect.py <target_script.py>")
        sys.exit(1)

    dissect_file(sys.argv[1])
